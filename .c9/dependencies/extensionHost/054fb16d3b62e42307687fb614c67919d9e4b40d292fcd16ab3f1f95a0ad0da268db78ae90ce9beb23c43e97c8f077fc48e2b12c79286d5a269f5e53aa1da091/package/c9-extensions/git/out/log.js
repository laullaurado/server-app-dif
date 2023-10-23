"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputChannelLogger = exports.LogLevel = void 0;
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
const vscode_1 = require("vscode");
const util_1 = require("./util");
/**
 * The severity level of a log message
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Trace"] = 1] = "Trace";
    LogLevel[LogLevel["Debug"] = 2] = "Debug";
    LogLevel[LogLevel["Info"] = 3] = "Info";
    LogLevel[LogLevel["Warning"] = 4] = "Warning";
    LogLevel[LogLevel["Error"] = 5] = "Error";
    LogLevel[LogLevel["Critical"] = 6] = "Critical";
    LogLevel[LogLevel["Off"] = 7] = "Off";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
/**
 * Output channel logger
 */
class OutputChannelLogger {
    constructor() {
        this._onDidChangeLogLevel = new vscode_1.EventEmitter();
        this.onDidChangeLogLevel = this._onDidChangeLogLevel.event;
        this._disposables = [];
        // Output channel
        this._outputChannel = vscode_1.window.createOutputChannel('Git');
        vscode_1.commands.registerCommand('git.showOutput', () => this.showOutputChannel());
        this._disposables.push(this._outputChannel);
        this._disposables.push(vscode_1.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('git.logLevel')) {
                this.onLogLevelChange();
            }
        }));
        this.onLogLevelChange();
    }
    get currentLogLevel() {
        return this._currentLogLevel;
    }
    set currentLogLevel(value) {
        if (this._currentLogLevel === value) {
            return;
        }
        this._currentLogLevel = value;
        this._onDidChangeLogLevel.fire(value);
        this.log(localize('gitLogLevel', "Log level: {0}", LogLevel[value]));
    }
    get defaultLogLevel() {
        return this._defaultLogLevel;
    }
    onLogLevelChange() {
        var _a;
        const config = vscode_1.workspace.getConfiguration('git');
        const logLevel = config.get('logLevel', 'Info');
        this.currentLogLevel = this._defaultLogLevel = (_a = LogLevel[logLevel]) !== null && _a !== void 0 ? _a : LogLevel.Info;
    }
    log(message, logLevel) {
        if (logLevel && logLevel < this._currentLogLevel) {
            return;
        }
        this._outputChannel.appendLine(`[${new Date().toISOString()}]${logLevel ? ` [${LogLevel[logLevel].toLowerCase()}]` : ''} ${message}`);
    }
    logCritical(message) {
        this.log(message, LogLevel.Critical);
    }
    logDebug(message) {
        this.log(message, LogLevel.Debug);
    }
    logError(message) {
        this.log(message, LogLevel.Error);
    }
    logInfo(message) {
        this.log(message, LogLevel.Info);
    }
    logTrace(message) {
        this.log(message, LogLevel.Trace);
    }
    logWarning(message) {
        this.log(message, LogLevel.Warning);
    }
    showOutputChannel() {
        this._outputChannel.show();
    }
    dispose() {
        this._disposables = (0, util_1.dispose)(this._disposables);
    }
}
exports.OutputChannelLogger = OutputChannelLogger;
//# sourceMappingURL=log.js.map