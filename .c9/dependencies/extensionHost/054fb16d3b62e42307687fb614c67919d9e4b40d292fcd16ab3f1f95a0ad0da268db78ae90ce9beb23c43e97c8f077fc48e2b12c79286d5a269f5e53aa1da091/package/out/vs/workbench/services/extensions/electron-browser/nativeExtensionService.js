/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/electron-browser/nativeLocalProcessExtensionHost", "vs/workbench/services/extensions/electron-sandbox/electronExtensionService"], function (require, exports, extensions_1, extensions_2, nativeLocalProcessExtensionHost_1, electronExtensionService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeExtensionService = void 0;
    class NativeExtensionService extends electronExtensionService_1.ElectronExtensionService {
        _createExtensionHost(runningLocation, isInitialStart) {
            if (runningLocation.kind === 1 /* ExtensionHostKind.LocalProcess */) {
                return this._instantiationService.createInstance(nativeLocalProcessExtensionHost_1.NativeLocalProcessExtensionHost, runningLocation, this._createLocalExtensionHostDataProvider(isInitialStart, runningLocation));
            }
            return super._createExtensionHost(runningLocation, isInitialStart);
        }
    }
    exports.NativeExtensionService = NativeExtensionService;
    (0, extensions_1.registerSingleton)(extensions_2.IExtensionService, NativeExtensionService);
});
//# sourceMappingURL=nativeExtensionService.js.map