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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/nls", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/instantiation/common/instantiation"], function (require, exports, cancellation_1, lifecycle_1, platform_1, nls_1, extensionManagement_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguagePackBaseService = exports.ILanguagePackService = void 0;
    exports.ILanguagePackService = (0, instantiation_1.createDecorator)('languagePackService');
    let LanguagePackBaseService = class LanguagePackBaseService extends lifecycle_1.Disposable {
        constructor(extensionGalleryService) {
            super();
            this.extensionGalleryService = extensionGalleryService;
        }
        async getAvailableLanguages() {
            const timeout = new cancellation_1.CancellationTokenSource();
            setTimeout(() => timeout.cancel(), 1000);
            let result;
            try {
                result = await this.extensionGalleryService.query({
                    text: 'category:"language packs"',
                    pageSize: 20
                }, timeout.token);
            }
            catch (_) {
                // This method is best effort. So, we ignore any errors.
                return [];
            }
            const languagePackExtensions = result.firstPage.filter(e => { var _a; return ((_a = e.properties.localizedLanguages) === null || _a === void 0 ? void 0 : _a.length) && e.tags.some(t => t.startsWith('lp-')); });
            const allFromMarketplace = languagePackExtensions.map(lp => {
                var _a;
                const languageName = (_a = lp.properties.localizedLanguages) === null || _a === void 0 ? void 0 : _a[0];
                const locale = lp.tags.find(t => t.startsWith('lp-')).split('lp-')[1];
                const baseQuickPick = this.createQuickPickItem({ locale, label: languageName });
                return Object.assign(Object.assign({}, baseQuickPick), { extensionId: lp.identifier.id, galleryExtension: lp });
            });
            allFromMarketplace.push(Object.assign(Object.assign({}, this.createQuickPickItem({ locale: 'en', label: 'English' })), { extensionId: 'default' }));
            return allFromMarketplace;
        }
        createQuickPickItem(languageItem) {
            var _a;
            const label = (_a = languageItem.label) !== null && _a !== void 0 ? _a : languageItem.locale;
            let description = languageItem.locale !== languageItem.label ? languageItem.locale : undefined;
            if (languageItem.locale.toLowerCase() === platform_1.language.toLowerCase()) {
                if (!description) {
                    description = '';
                }
                description += (0, nls_1.localize)('currentDisplayLanguage', " (Current)");
            }
            return {
                id: languageItem.locale,
                label,
                description
            };
        }
    };
    LanguagePackBaseService = __decorate([
        __param(0, extensionManagement_1.IExtensionGalleryService)
    ], LanguagePackBaseService);
    exports.LanguagePackBaseService = LanguagePackBaseService;
});
//# sourceMappingURL=languagePacks.js.map