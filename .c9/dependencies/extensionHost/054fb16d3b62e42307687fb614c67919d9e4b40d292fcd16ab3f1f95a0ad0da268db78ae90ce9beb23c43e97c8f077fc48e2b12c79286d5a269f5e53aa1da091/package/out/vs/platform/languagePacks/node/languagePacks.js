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
define(["require", "exports", "crypto", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/node/pfs", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/log/common/log", "vs/platform/languagePacks/common/languagePacks"], function (require, exports, crypto_1, arrays_1, async_1, lifecycle_1, network_1, path_1, pfs_1, environment_1, extensionManagement_1, extensionManagementUtil_1, log_1, languagePacks_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeLanguagePackService = void 0;
    let NativeLanguagePackService = class NativeLanguagePackService extends languagePacks_1.LanguagePackBaseService {
        constructor(extensionManagementService, environmentService, extensionGalleryService, logService) {
            super(extensionGalleryService);
            this.extensionManagementService = extensionManagementService;
            this.logService = logService;
            this.cache = this._register(new LanguagePacksCache(environmentService, logService));
            this.extensionManagementService.registerParticipant({
                postInstall: async (extension) => {
                    return this.postInstallExtension(extension);
                },
                postUninstall: async (extension) => {
                    return this.postUninstallExtension(extension);
                }
            });
        }
        async getInstalledLanguages() {
            const languagePacks = await this.cache.getLanguagePacks();
            const languages = Object.keys(languagePacks).map(locale => {
                const languagePack = languagePacks[locale];
                const baseQuickPick = this.createQuickPickItem({ locale, label: languagePack.label });
                return Object.assign(Object.assign({}, baseQuickPick), { extensionId: languagePack.extensions[0].extensionIdentifier.id });
            });
            languages.push(Object.assign(Object.assign({}, this.createQuickPickItem({ locale: 'en', label: 'English' })), { extensionId: 'default' }));
            return languages;
        }
        async postInstallExtension(extension) {
            if (extension && extension.manifest && extension.manifest.contributes && extension.manifest.contributes.localizations && extension.manifest.contributes.localizations.length) {
                this.logService.info('Adding language packs from the extension', extension.identifier.id);
                await this.update();
            }
        }
        async postUninstallExtension(extension) {
            const languagePacks = await this.cache.getLanguagePacks();
            if (Object.keys(languagePacks).some(language => languagePacks[language] && languagePacks[language].extensions.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e.extensionIdentifier, extension.identifier)))) {
                this.logService.info('Removing language packs from the extension', extension.identifier.id);
                await this.update();
            }
        }
        async update() {
            const [current, installed] = await Promise.all([this.cache.getLanguagePacks(), this.extensionManagementService.getInstalled()]);
            const updated = await this.cache.update(installed);
            return !(0, arrays_1.equals)(Object.keys(current), Object.keys(updated));
        }
    };
    NativeLanguagePackService = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, environment_1.INativeEnvironmentService),
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, log_1.ILogService)
    ], NativeLanguagePackService);
    exports.NativeLanguagePackService = NativeLanguagePackService;
    let LanguagePacksCache = class LanguagePacksCache extends lifecycle_1.Disposable {
        constructor(environmentService, logService) {
            super();
            this.logService = logService;
            this.languagePacks = {};
            this.languagePacksFilePath = (0, path_1.join)(environmentService.userDataPath, 'languagepacks.json');
            this.languagePacksFileLimiter = new async_1.Queue();
        }
        getLanguagePacks() {
            // if queue is not empty, fetch from disk
            if (this.languagePacksFileLimiter.size || !this.initializedCache) {
                return this.withLanguagePacks()
                    .then(() => this.languagePacks);
            }
            return Promise.resolve(this.languagePacks);
        }
        update(extensions) {
            return this.withLanguagePacks(languagePacks => {
                Object.keys(languagePacks).forEach(language => delete languagePacks[language]);
                this.createLanguagePacksFromExtensions(languagePacks, ...extensions);
            }).then(() => this.languagePacks);
        }
        createLanguagePacksFromExtensions(languagePacks, ...extensions) {
            for (const extension of extensions) {
                if (extension && extension.manifest && extension.manifest.contributes && extension.manifest.contributes.localizations && extension.manifest.contributes.localizations.length) {
                    this.createLanguagePacksFromExtension(languagePacks, extension);
                }
            }
            Object.keys(languagePacks).forEach(languageId => this.updateHash(languagePacks[languageId]));
        }
        createLanguagePacksFromExtension(languagePacks, extension) {
            var _a;
            const extensionIdentifier = extension.identifier;
            const localizations = extension.manifest.contributes && extension.manifest.contributes.localizations ? extension.manifest.contributes.localizations : [];
            for (const localizationContribution of localizations) {
                if (extension.location.scheme === network_1.Schemas.file && isValidLocalization(localizationContribution)) {
                    let languagePack = languagePacks[localizationContribution.languageId];
                    if (!languagePack) {
                        languagePack = {
                            hash: '',
                            extensions: [],
                            translations: {},
                            label: (_a = localizationContribution.localizedLanguageName) !== null && _a !== void 0 ? _a : localizationContribution.languageName
                        };
                        languagePacks[localizationContribution.languageId] = languagePack;
                    }
                    let extensionInLanguagePack = languagePack.extensions.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.extensionIdentifier, extensionIdentifier))[0];
                    if (extensionInLanguagePack) {
                        extensionInLanguagePack.version = extension.manifest.version;
                    }
                    else {
                        languagePack.extensions.push({ extensionIdentifier, version: extension.manifest.version });
                    }
                    for (const translation of localizationContribution.translations) {
                        languagePack.translations[translation.id] = (0, path_1.join)(extension.location.fsPath, translation.path);
                    }
                }
            }
        }
        updateHash(languagePack) {
            if (languagePack) {
                const md5 = (0, crypto_1.createHash)('md5');
                for (const extension of languagePack.extensions) {
                    md5.update(extension.extensionIdentifier.uuid || extension.extensionIdentifier.id).update(extension.version);
                }
                languagePack.hash = md5.digest('hex');
            }
        }
        withLanguagePacks(fn = () => null) {
            return this.languagePacksFileLimiter.queue(() => {
                let result = null;
                return pfs_1.Promises.readFile(this.languagePacksFilePath, 'utf8')
                    .then(undefined, err => err.code === 'ENOENT' ? Promise.resolve('{}') : Promise.reject(err))
                    .then(raw => { try {
                    return JSON.parse(raw);
                }
                catch (e) {
                    return {};
                } })
                    .then(languagePacks => { result = fn(languagePacks); return languagePacks; })
                    .then(languagePacks => {
                    for (const language of Object.keys(languagePacks)) {
                        if (!languagePacks[language]) {
                            delete languagePacks[language];
                        }
                    }
                    this.languagePacks = languagePacks;
                    this.initializedCache = true;
                    const raw = JSON.stringify(this.languagePacks);
                    this.logService.debug('Writing language packs', raw);
                    return pfs_1.Promises.writeFile(this.languagePacksFilePath, raw);
                })
                    .then(() => result, error => this.logService.error(error));
            });
        }
    };
    LanguagePacksCache = __decorate([
        __param(0, environment_1.INativeEnvironmentService),
        __param(1, log_1.ILogService)
    ], LanguagePacksCache);
    function isValidLocalization(localization) {
        if (typeof localization.languageId !== 'string') {
            return false;
        }
        if (!Array.isArray(localization.translations) || localization.translations.length === 0) {
            return false;
        }
        for (const translation of localization.translations) {
            if (typeof translation.id !== 'string') {
                return false;
            }
            if (typeof translation.path !== 'string') {
                return false;
            }
        }
        if (localization.languageName && typeof localization.languageName !== 'string') {
            return false;
        }
        if (localization.localizedLanguageName && typeof localization.localizedLanguageName !== 'string') {
            return false;
        }
        return true;
    }
});
//# sourceMappingURL=languagePacks.js.map