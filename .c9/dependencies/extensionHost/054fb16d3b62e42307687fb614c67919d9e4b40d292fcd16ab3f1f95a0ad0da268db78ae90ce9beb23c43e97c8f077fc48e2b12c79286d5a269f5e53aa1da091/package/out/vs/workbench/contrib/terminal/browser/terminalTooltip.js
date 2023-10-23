/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getShellIntegrationTooltip = void 0;
    function getShellIntegrationTooltip(instance, markdown, configurationService) {
        if (!configurationService.getValue("terminal.integrated.shellIntegration.enabled" /* TerminalSettingId.ShellIntegrationEnabled */) || instance.disableShellIntegrationReporting) {
            return '';
        }
        const shellIntegrationCapabilities = [];
        if (instance.capabilities.has(2 /* TerminalCapability.CommandDetection */)) {
            shellIntegrationCapabilities.push(2 /* TerminalCapability.CommandDetection */);
        }
        if (instance.capabilities.has(0 /* TerminalCapability.CwdDetection */)) {
            shellIntegrationCapabilities.push(0 /* TerminalCapability.CwdDetection */);
        }
        let shellIntegrationString = '';
        if (shellIntegrationCapabilities.length > 0) {
            shellIntegrationString += `${markdown ? '\n\n---\n\n' : '\n\n'} ${(0, nls_1.localize)('shellIntegration.enabled', "Shell integration activated")}`;
        }
        else {
            shellIntegrationString += `${markdown ? '\n\n---\n\n' : '\n\n'} ${(0, nls_1.localize)('shellIntegration.activationFailed', "Shell integration failed to activate")}`;
        }
        return shellIntegrationString;
    }
    exports.getShellIntegrationTooltip = getShellIntegrationTooltip;
});
//# sourceMappingURL=terminalTooltip.js.map