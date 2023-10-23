/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/extensions/common/extensions", "vs/nls", "vs/base/common/semver/semver"], function (require, exports, extensions_1, nls_1, semver) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dedupExtensions = void 0;
    // TODO: @sandy081 merge this with deduping in extensionsScannerService.ts
    function dedupExtensions(system, user, development, logService) {
        let result = new Map();
        system.forEach((systemExtension) => {
            const extensionKey = extensions_1.ExtensionIdentifier.toKey(systemExtension.identifier);
            const extension = result.get(extensionKey);
            if (extension) {
                logService.warn((0, nls_1.localize)('overwritingExtension', "Overwriting extension {0} with {1}.", extension.extensionLocation.fsPath, systemExtension.extensionLocation.fsPath));
            }
            result.set(extensionKey, systemExtension);
        });
        user.forEach((userExtension) => {
            const extensionKey = extensions_1.ExtensionIdentifier.toKey(userExtension.identifier);
            const extension = result.get(extensionKey);
            if (extension) {
                if (extension.isBuiltin) {
                    if (semver.gt(extension.version, userExtension.version)) {
                        logService.warn(`Skipping extension ${userExtension.extensionLocation.path} with lower version ${userExtension.version}.`);
                        return;
                    }
                    // Overwriting a builtin extension inherits the `isBuiltin` property and it doesn't show a warning
                    userExtension.isBuiltin = true;
                }
                else {
                    logService.warn((0, nls_1.localize)('overwritingExtension', "Overwriting extension {0} with {1}.", extension.extensionLocation.fsPath, userExtension.extensionLocation.fsPath));
                }
            }
            result.set(extensionKey, userExtension);
        });
        development.forEach(developedExtension => {
            logService.info((0, nls_1.localize)('extensionUnderDevelopment', "Loading development extension at {0}", developedExtension.extensionLocation.fsPath));
            const extensionKey = extensions_1.ExtensionIdentifier.toKey(developedExtension.identifier);
            const extension = result.get(extensionKey);
            if (extension) {
                if (extension.isBuiltin) {
                    // Overwriting a builtin extension inherits the `isBuiltin` property
                    developedExtension.isBuiltin = true;
                }
            }
            result.set(extensionKey, developedExtension);
        });
        let r = [];
        result.forEach((value) => r.push(value));
        return r;
    }
    exports.dedupExtensions = dedupExtensions;
});
//# sourceMappingURL=extensionsUtil.js.map