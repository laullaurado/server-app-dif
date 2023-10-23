/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/log/common/log", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/base/common/stopwatch", "child_process", "string_decoder", "vs/base/common/async", "vs/base/common/network", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/process", "electron", "vs/platform/windows/electron-main/windows"], function (require, exports, errors_1, lifecycle_1, event_1, log_1, lifecycleMainService_1, stopwatch_1, child_process_1, string_decoder_1, async_1, network_1, objects_1, platform, process_1, electron, windows_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostStarter = void 0;
    const UtilityProcess = (electron.UtilityProcess);
    const canUseUtilityProcess = (typeof UtilityProcess !== 'undefined');
    let ExtensionHostStarter = class ExtensionHostStarter {
        constructor(_logService, lifecycleMainService, _windowsMainService) {
            this._logService = _logService;
            this._windowsMainService = _windowsMainService;
            this._shutdown = false;
            this._extHosts = new Map();
            // On shutdown: gracefully await extension host shutdowns
            lifecycleMainService.onWillShutdown((e) => {
                this._shutdown = true;
                e.join(this._waitForAllExit(6000));
            });
        }
        dispose() {
            // Intentionally not killing the extension host processes
        }
        _getExtHost(id) {
            const extHostProcess = this._extHosts.get(id);
            if (!extHostProcess) {
                throw new Error(`Unknown extension host!`);
            }
            return extHostProcess;
        }
        onDynamicStdout(id) {
            return this._getExtHost(id).onStdout;
        }
        onDynamicStderr(id) {
            return this._getExtHost(id).onStderr;
        }
        onDynamicMessage(id) {
            return this._getExtHost(id).onMessage;
        }
        onDynamicError(id) {
            return this._getExtHost(id).onError;
        }
        onDynamicExit(id) {
            return this._getExtHost(id).onExit;
        }
        async canUseUtilityProcess() {
            return canUseUtilityProcess;
        }
        async createExtensionHost(useUtilityProcess) {
            if (this._shutdown) {
                throw (0, errors_1.canceled)();
            }
            const id = String(++ExtensionHostStarter._lastId);
            let extHost;
            if (useUtilityProcess) {
                if (!canUseUtilityProcess) {
                    throw new Error(`Cannot use UtilityProcess!`);
                }
                extHost = new UtilityExtensionHostProcess(id, this._logService, this._windowsMainService);
            }
            else {
                extHost = new ExtensionHostProcess(id, this._logService);
            }
            this._extHosts.set(id, extHost);
            extHost.onExit(({ pid, code, signal }) => {
                this._logService.info(`Extension host with pid ${pid} exited with code: ${code}, signal: ${signal}.`);
                setTimeout(() => {
                    extHost.dispose();
                    this._extHosts.delete(id);
                });
            });
            return { id };
        }
        async start(id, opts) {
            if (this._shutdown) {
                throw (0, errors_1.canceled)();
            }
            return this._getExtHost(id).start(opts);
        }
        async enableInspectPort(id) {
            if (this._shutdown) {
                throw (0, errors_1.canceled)();
            }
            const extHostProcess = this._extHosts.get(id);
            if (!extHostProcess) {
                return false;
            }
            return extHostProcess.enableInspectPort();
        }
        async kill(id) {
            if (this._shutdown) {
                throw (0, errors_1.canceled)();
            }
            const extHostProcess = this._extHosts.get(id);
            if (!extHostProcess) {
                // already gone!
                return;
            }
            extHostProcess.kill();
        }
        async _killAllNow() {
            for (const [, extHost] of this._extHosts) {
                extHost.kill();
            }
        }
        async _waitForAllExit(maxWaitTimeMs) {
            const exitPromises = [];
            for (const [, extHost] of this._extHosts) {
                exitPromises.push(extHost.waitForExit(maxWaitTimeMs));
            }
            return async_1.Promises.settled(exitPromises).then(() => { });
        }
    };
    ExtensionHostStarter._lastId = 0;
    ExtensionHostStarter = __decorate([
        __param(0, log_1.ILogService),
        __param(1, lifecycleMainService_1.ILifecycleMainService),
        __param(2, windows_1.IWindowsMainService)
    ], ExtensionHostStarter);
    exports.ExtensionHostStarter = ExtensionHostStarter;
    let ExtensionHostProcess = class ExtensionHostProcess extends lifecycle_1.Disposable {
        constructor(id, _logService) {
            super();
            this.id = id;
            this._logService = _logService;
            this._onStdout = this._register(new event_1.Emitter());
            this.onStdout = this._onStdout.event;
            this._onStderr = this._register(new event_1.Emitter());
            this.onStderr = this._onStderr.event;
            this._onMessage = this._register(new event_1.Emitter());
            this.onMessage = this._onMessage.event;
            this._onError = this._register(new event_1.Emitter());
            this.onError = this._onError.event;
            this._onExit = this._register(new event_1.Emitter());
            this.onExit = this._onExit.event;
            this._process = null;
            this._hasExited = false;
        }
        start(opts) {
            var _a, _b;
            if (platform.isCI) {
                this._logService.info(`Calling fork to start extension host...`);
            }
            const sw = stopwatch_1.StopWatch.create(false);
            this._process = (0, child_process_1.fork)(network_1.FileAccess.asFileUri('bootstrap-fork', require).fsPath, ['--type=extensionHost', '--skipWorkspaceStorageLock'], (0, objects_1.mixin)({ cwd: (0, process_1.cwd)() }, opts));
            const forkTime = sw.elapsed();
            const pid = this._process.pid;
            this._logService.info(`Starting extension host with pid ${pid} (fork() took ${forkTime} ms).`);
            const stdoutDecoder = new string_decoder_1.StringDecoder('utf-8');
            (_a = this._process.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (chunk) => {
                const strChunk = typeof chunk === 'string' ? chunk : stdoutDecoder.write(chunk);
                this._onStdout.fire(strChunk);
            });
            const stderrDecoder = new string_decoder_1.StringDecoder('utf-8');
            (_b = this._process.stderr) === null || _b === void 0 ? void 0 : _b.on('data', (chunk) => {
                const strChunk = typeof chunk === 'string' ? chunk : stderrDecoder.write(chunk);
                this._onStderr.fire(strChunk);
            });
            this._process.on('message', msg => {
                this._onMessage.fire(msg);
            });
            this._process.on('error', (err) => {
                this._onError.fire({ error: (0, errors_1.transformErrorForSerialization)(err) });
            });
            this._process.on('exit', (code, signal) => {
                this._hasExited = true;
                this._onExit.fire({ pid, code, signal });
            });
        }
        enableInspectPort() {
            if (!this._process) {
                return false;
            }
            this._logService.info(`Enabling inspect port on extension host with pid ${this._process.pid}.`);
            if (typeof process._debugProcess === 'function') {
                // use (undocumented) _debugProcess feature of node
                process._debugProcess(this._process.pid);
                return true;
            }
            else if (!platform.isWindows) {
                // use KILL USR1 on non-windows platforms (fallback)
                this._process.kill('SIGUSR1');
                return true;
            }
            else {
                // not supported...
                return false;
            }
        }
        kill() {
            if (!this._process) {
                return;
            }
            this._logService.info(`Killing extension host with pid ${this._process.pid}.`);
            this._process.kill();
        }
        async waitForExit(maxWaitTimeMs) {
            if (!this._process) {
                return;
            }
            const pid = this._process.pid;
            this._logService.info(`Waiting for extension host with pid ${pid} to exit.`);
            await Promise.race([event_1.Event.toPromise(this.onExit), (0, async_1.timeout)(maxWaitTimeMs)]);
            if (!this._hasExited) {
                // looks like we timed out
                this._logService.info(`Extension host with pid ${pid} did not exit within ${maxWaitTimeMs}ms.`);
                this._process.kill();
            }
        }
    };
    ExtensionHostProcess = __decorate([
        __param(1, log_1.ILogService)
    ], ExtensionHostProcess);
    let UtilityExtensionHostProcess = class UtilityExtensionHostProcess extends lifecycle_1.Disposable {
        constructor(id, _logService, _windowsMainService) {
            super();
            this.id = id;
            this._logService = _logService;
            this._windowsMainService = _windowsMainService;
            this.onStdout = event_1.Event.None;
            this.onStderr = event_1.Event.None;
            this.onError = event_1.Event.None;
            this._onMessage = this._register(new event_1.Emitter());
            this.onMessage = this._onMessage.event;
            this._onExit = this._register(new event_1.Emitter());
            this.onExit = this._onExit.event;
            this._process = null;
            this._hasExited = false;
        }
        start(opts) {
            const codeWindow = this._windowsMainService.getWindowById(opts.responseWindowId);
            if (!codeWindow) {
                this._logService.info(`Refusing to create new Extension Host UtilityProcess because requesting window cannot be found...`);
                return;
            }
            const responseWindow = codeWindow.win;
            if (!responseWindow || responseWindow.isDestroyed() || responseWindow.webContents.isDestroyed()) {
                this._logService.info(`Refusing to create new Extension Host UtilityProcess because requesting window cannot be found...`);
                return;
            }
            const serviceName = `extensionHost${this.id}`;
            const modulePath = network_1.FileAccess.asFileUri('bootstrap-fork.js', require).fsPath;
            const args = ['--type=extensionHost', '--skipWorkspaceStorageLock'];
            const execArgv = opts.execArgv || [];
            const env = Object.assign({}, opts.env);
            // Make sure all values are strings, otherwise the process will not start
            for (const key of Object.keys(env)) {
                env[key] = String(env[key]);
            }
            this._logService.info(`Creating new UtilityProcess to start extension host...`);
            this._process = new UtilityProcess(modulePath, args, { serviceName, env, execArgv });
            this._process.on('spawn', () => {
                this._logService.info(`Utility process emits spawn!`);
            });
            this._process.on('exit', (code) => {
                this._logService.info(`Utility process emits exit!`);
                this._hasExited = true;
                this._onExit.fire({ pid: this._process.pid, code, signal: '' });
            });
            const listener = (event, details) => {
                if (details.type !== 'Utility') {
                    return;
                }
                // Despite the fact that we pass the argument `seviceName`,
                // the details have a field called `name` where this value appears
                if (details.name === serviceName) {
                    this._logService.info(`Utility process emits exit!`);
                    this._hasExited = true;
                    this._onExit.fire({ pid: this._process.pid, code: details.exitCode, signal: '' });
                }
            };
            electron.app.on('child-process-gone', listener);
            this._register((0, lifecycle_1.toDisposable)(() => {
                electron.app.off('child-process-gone', listener);
            }));
            const { port1, port2 } = new electron.MessageChannelMain();
            this._process.postMessage('port', null, [port2]);
            responseWindow.webContents.postMessage(opts.responseChannel, opts.responseNonce, [port1]);
        }
        enableInspectPort() {
            if (!this._process) {
                return false;
            }
            this._logService.info(`Enabling inspect port on extension host with pid ${this._process.pid}.`);
            if (typeof process._debugProcess === 'function') {
                // use (undocumented) _debugProcess feature of node
                process._debugProcess(this._process.pid);
                return true;
            }
            else if (!platform.isWindows) {
                // use KILL USR1 on non-windows platforms (fallback)
                this._process.kill('SIGUSR1');
                return true;
            }
            else {
                // not supported...
                return false;
            }
        }
        kill() {
            if (!this._process) {
                return;
            }
            this._logService.info(`Killing extension host with pid ${this._process.pid}.`);
            this._process.kill();
        }
        async waitForExit(maxWaitTimeMs) {
            if (!this._process) {
                return;
            }
            const pid = this._process.pid;
            this._logService.info(`Waiting for extension host with pid ${pid} to exit.`);
            await Promise.race([event_1.Event.toPromise(this.onExit), (0, async_1.timeout)(maxWaitTimeMs)]);
            if (!this._hasExited) {
                // looks like we timed out
                this._logService.info(`Extension host with pid ${pid} did not exit within ${maxWaitTimeMs}ms.`);
                this._process.kill();
            }
        }
    };
    UtilityExtensionHostProcess = __decorate([
        __param(1, log_1.ILogService),
        __param(2, windows_1.IWindowsMainService)
    ], UtilityExtensionHostProcess);
});
//# sourceMappingURL=extensionHostStarter.js.map