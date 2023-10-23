/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/webview/browser/webviewService", "vs/workbench/contrib/webview/electron-sandbox/webviewElement"], function (require, exports, webviewService_1, webviewElement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElectronWebviewService = void 0;
    class ElectronWebviewService extends webviewService_1.WebviewService {
        createWebviewElement(initInfo) {
            const webview = this._instantiationService.createInstance(webviewElement_1.ElectronWebviewElement, initInfo, this._webviewThemeDataProvider);
            this.registerNewWebview(webview);
            return webview;
        }
    }
    exports.ElectronWebviewService = ElectronWebviewService;
});
//# sourceMappingURL=webviewService.js.map