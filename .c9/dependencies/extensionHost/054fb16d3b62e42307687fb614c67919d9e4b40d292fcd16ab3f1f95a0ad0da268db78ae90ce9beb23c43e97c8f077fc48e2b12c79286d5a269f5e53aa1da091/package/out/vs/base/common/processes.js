/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform"], function (require, exports, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.removeDangerousEnvVariables = exports.sanitizeProcessEnvironment = exports.TerminateResponseCode = exports.Source = void 0;
    var Source;
    (function (Source) {
        Source[Source["stdout"] = 0] = "stdout";
        Source[Source["stderr"] = 1] = "stderr";
    })(Source = exports.Source || (exports.Source = {}));
    var TerminateResponseCode;
    (function (TerminateResponseCode) {
        TerminateResponseCode[TerminateResponseCode["Success"] = 0] = "Success";
        TerminateResponseCode[TerminateResponseCode["Unknown"] = 1] = "Unknown";
        TerminateResponseCode[TerminateResponseCode["AccessDenied"] = 2] = "AccessDenied";
        TerminateResponseCode[TerminateResponseCode["ProcessNotFound"] = 3] = "ProcessNotFound";
    })(TerminateResponseCode = exports.TerminateResponseCode || (exports.TerminateResponseCode = {}));
    /**
     * Sanitizes a VS Code process environment by removing all Electron/VS Code-related values.
     */
    function sanitizeProcessEnvironment(env, ...preserve) {
        const set = preserve.reduce((set, key) => {
            set[key] = true;
            return set;
        }, {});
        const keysToRemove = [
            /^ELECTRON_.+$/,
            /^VSCODE_(?!SHELL_LOGIN).+$/,
            /^SNAP(|_.*)$/,
            /^GDK_PIXBUF_.+$/,
        ];
        const envKeys = Object.keys(env);
        envKeys
            .filter(key => !set[key])
            .forEach(envKey => {
            for (let i = 0; i < keysToRemove.length; i++) {
                if (envKey.search(keysToRemove[i]) !== -1) {
                    delete env[envKey];
                    break;
                }
            }
        });
    }
    exports.sanitizeProcessEnvironment = sanitizeProcessEnvironment;
    /**
     * Remove dangerous environment variables that have caused crashes
     * in forked processes (i.e. in ELECTRON_RUN_AS_NODE processes)
     *
     * @param env The env object to change
     */
    function removeDangerousEnvVariables(env) {
        if (!env) {
            return;
        }
        // Unset `DEBUG`, as an invalid value might lead to process crashes
        // See https://github.com/microsoft/vscode/issues/130072
        delete env['DEBUG'];
        if (platform_1.isMacintosh) {
            // Unset `DYLD_LIBRARY_PATH`, as it leads to process crashes
            // See https://github.com/microsoft/vscode/issues/104525
            // See https://github.com/microsoft/vscode/issues/105848
            delete env['DYLD_LIBRARY_PATH'];
        }
        if (platform_1.isLinux) {
            // Unset `LD_PRELOAD`, as it might lead to process crashes
            // See https://github.com/microsoft/vscode/issues/134177
            delete env['LD_PRELOAD'];
        }
    }
    exports.removeDangerousEnvVariables = removeDangerousEnvVariables;
});
//# sourceMappingURL=processes.js.map