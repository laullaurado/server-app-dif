/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.minimumTranslatedStrings = void 0;
    // The strings localized in this file will get pulled into the manifest of the language packs.
    // So that they are available for VS Code to use without downloading the entire language pack.
    exports.minimumTranslatedStrings = {
        showLanguagePackExtensions: (0, nls_1.localize)('showLanguagePackExtensions', "Search language packs in the Marketplace to change the display language to {0}."),
        searchMarketplace: (0, nls_1.localize)('searchMarketplace', "Search Marketplace"),
        installAndRestartMessage: (0, nls_1.localize)('installAndRestartMessage', "Install language pack to change the display language to {0}."),
        installAndRestart: (0, nls_1.localize)('installAndRestart', "Install and Restart")
    };
});
//# sourceMappingURL=minimalTranslations.js.map