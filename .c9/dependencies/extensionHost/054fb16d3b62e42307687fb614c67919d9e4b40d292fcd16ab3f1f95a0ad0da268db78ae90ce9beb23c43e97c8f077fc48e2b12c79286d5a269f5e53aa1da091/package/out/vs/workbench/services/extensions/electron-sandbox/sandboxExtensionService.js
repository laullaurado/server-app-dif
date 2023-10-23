/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/electron-sandbox/electronExtensionService"], function (require, exports, extensions_1, extensions_2, electronExtensionService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SandboxExtensionService = void 0;
    class SandboxExtensionService extends electronExtensionService_1.ElectronExtensionService {
    }
    exports.SandboxExtensionService = SandboxExtensionService;
    (0, extensions_1.registerSingleton)(extensions_2.IExtensionService, SandboxExtensionService);
});
//# sourceMappingURL=sandboxExtensionService.js.map