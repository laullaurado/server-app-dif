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
define(["require", "exports", "net", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/stopwatch", "vs/base/parts/ipc/common/ipc.net", "vs/base/parts/ipc/node/ipc.net", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/platform/log/common/log", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/workbench/services/extensions/electron-sandbox/localProcessExtensionHost"], function (require, exports, net_1, lifecycle_1, platform, stopwatch_1, ipc_net_1, ipc_net_2, globals_1, log_1, extensionHostProtocol_1, localProcessExtensionHost_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeLocalProcessExtensionHost = void 0;
    class NativeLocalProcessExtensionHost extends localProcessExtensionHost_1.SandboxLocalProcessExtensionHost {
        async _start() {
            const canUseUtilityProcess = await this._extensionHostStarter.canUseUtilityProcess();
            if (canUseUtilityProcess && globals_1.process.env['VSCODE_USE_UTILITY_PROCESS']) {
                const communication = this._toDispose.add(new localProcessExtensionHost_1.ExtHostMessagePortCommunication(this._logService));
                return this._startWithCommunication(communication);
            }
            else {
                const communication = this._toDispose.add(new ExtHostNamedPipeCommunication(this._logService));
                return this._startWithCommunication(communication);
            }
        }
    }
    exports.NativeLocalProcessExtensionHost = NativeLocalProcessExtensionHost;
    let ExtHostNamedPipeCommunication = class ExtHostNamedPipeCommunication extends lifecycle_1.Disposable {
        constructor(_logService) {
            super();
            this._logService = _logService;
            this.useUtilityProcess = false;
        }
        prepare() {
            return new Promise((resolve, reject) => {
                const pipeName = (0, ipc_net_2.createRandomIPCHandle)();
                const namedPipeServer = (0, net_1.createServer)();
                namedPipeServer.on('error', reject);
                namedPipeServer.listen(pipeName, () => {
                    if (namedPipeServer) {
                        namedPipeServer.removeListener('error', reject);
                    }
                    resolve({ pipeName, namedPipeServer });
                });
                this._register((0, lifecycle_1.toDisposable)(() => {
                    if (namedPipeServer.listening) {
                        namedPipeServer.close();
                    }
                }));
            });
        }
        establishProtocol(prepared, extensionHostProcess, opts) {
            const { namedPipeServer, pipeName } = prepared;
            opts.env['VSCODE_IPC_HOOK_EXTHOST'] = pipeName;
            return new Promise((resolve, reject) => {
                // Wait for the extension host to connect to our named pipe
                // and wrap the socket in the message passing protocol
                const handle = setTimeout(() => {
                    if (namedPipeServer.listening) {
                        namedPipeServer.close();
                    }
                    reject('The local extension host took longer than 60s to connect.');
                }, 60 * 1000);
                namedPipeServer.on('connection', (socket) => {
                    clearTimeout(handle);
                    if (namedPipeServer.listening) {
                        namedPipeServer.close();
                    }
                    const nodeSocket = new ipc_net_2.NodeSocket(socket, 'renderer-exthost');
                    const protocol = new ipc_net_1.PersistentProtocol(nodeSocket);
                    this._register((0, lifecycle_1.toDisposable)(() => {
                        // Send the extension host a request to terminate itself
                        // (graceful termination)
                        protocol.send((0, extensionHostProtocol_1.createMessageOfType)(2 /* MessageType.Terminate */));
                        protocol.flush();
                        socket.end();
                        nodeSocket.dispose();
                        protocol.dispose();
                    }));
                    resolve(protocol);
                });
                // Now that the named pipe listener is installed, start the ext host process
                const sw = stopwatch_1.StopWatch.create(false);
                extensionHostProcess.start(opts).then(() => {
                    const duration = sw.elapsed();
                    if (platform.isCI) {
                        this._logService.info(`IExtensionHostStarter.start() took ${duration} ms.`);
                    }
                }, (err) => {
                    // Starting the ext host process resulted in an error
                    reject(err);
                });
            });
        }
    };
    ExtHostNamedPipeCommunication = __decorate([
        __param(0, log_1.ILogService)
    ], ExtHostNamedPipeCommunication);
});
//# sourceMappingURL=nativeLocalProcessExtensionHost.js.map