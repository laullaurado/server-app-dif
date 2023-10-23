/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/host/browser/host", "vs/platform/dialogs/common/dialogs", "vs/platform/product/common/productService", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/platform/languagePacks/common/languagePacks", "vs/workbench/services/localization/common/locale", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/notification/common/notification", "vs/base/common/platform"], function (require, exports, nls_1, quickInput_1, host_1, dialogs_1, productService_1, cancellation_1, lifecycle_1, actions_1, languagePacks_1, locale_1, extensionManagement_1, panecomposite_1, extensions_1, notification_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ClearDisplayLanguageAction = exports.ConfigureDisplayLanguageAction = void 0;
    const restart = (0, nls_1.localize)('restart', "&&Restart");
    class ConfigureDisplayLanguageAction extends actions_1.Action2 {
        constructor() {
            super({
                id: ConfigureDisplayLanguageAction.ID,
                title: { original: 'Configure Display Language', value: ConfigureDisplayLanguageAction.LABEL },
                menu: {
                    id: actions_1.MenuId.CommandPalette
                }
            });
        }
        async run(accessor) {
            var _a;
            const languagePackService = accessor.get(languagePacks_1.ILanguagePackService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const hostService = accessor.get(host_1.IHostService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const productService = accessor.get(productService_1.IProductService);
            const localeService = accessor.get(locale_1.ILocaleService);
            const extensionManagementService = accessor.get(extensionManagement_1.IExtensionManagementService);
            const paneCompositePartService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const installedLanguages = await languagePackService.getInstalledLanguages();
            const qp = quickInputService.createQuickPick();
            qp.placeholder = (0, nls_1.localize)('chooseLocale', "Select Display Language");
            if (installedLanguages === null || installedLanguages === void 0 ? void 0 : installedLanguages.length) {
                const items = [{ type: 'separator', label: (0, nls_1.localize)('installed', "Installed languages") }];
                qp.items = items.concat(installedLanguages);
            }
            const disposables = new lifecycle_1.DisposableStore();
            const source = new cancellation_1.CancellationTokenSource();
            disposables.add(qp.onDispose(() => {
                source.cancel();
                disposables.dispose();
            }));
            const installedSet = new Set((_a = installedLanguages === null || installedLanguages === void 0 ? void 0 : installedLanguages.map(language => language.id)) !== null && _a !== void 0 ? _a : []);
            languagePackService.getAvailableLanguages().then(availableLanguages => {
                const newLanguages = availableLanguages.filter(l => l.id && !installedSet.has(l.id));
                if (newLanguages.length) {
                    qp.items = [
                        ...qp.items,
                        { type: 'separator', label: (0, nls_1.localize)('available', "Available languages") },
                        ...newLanguages
                    ];
                }
                qp.busy = false;
            });
            disposables.add(qp.onDidAccept(async () => {
                var _a;
                const selectedLanguage = qp.activeItems[0];
                qp.hide();
                // Only Desktop has the concept of installing language packs so we only do this for Desktop
                // and only if the language pack is not installed
                if (!platform_1.isWeb && !installedSet.has(selectedLanguage.id)) {
                    try {
                        // Show the view so the user can see the language pack to be installed
                        let viewlet = await paneCompositePartService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */);
                        (viewlet === null || viewlet === void 0 ? void 0 : viewlet.getViewPaneContainer()).search(`@id:${selectedLanguage.extensionId}`);
                        // Only actually install a language pack from Microsoft
                        if (((_a = selectedLanguage.galleryExtension) === null || _a === void 0 ? void 0 : _a.publisher.toLowerCase()) !== 'ms-ceintl') {
                            return;
                        }
                        await extensionManagementService.installFromGallery(selectedLanguage.galleryExtension);
                    }
                    catch (err) {
                        notificationService.error(err);
                        return;
                    }
                }
                if (await localeService.setLocale(selectedLanguage.id)) {
                    const restartDialog = await dialogService.confirm({
                        type: 'info',
                        message: (0, nls_1.localize)('relaunchDisplayLanguageMessage', "A restart is required for the change in display language to take effect."),
                        detail: (0, nls_1.localize)('relaunchDisplayLanguageDetail', "Press the restart button to restart {0} and change the display language.", productService.nameLong),
                        primaryButton: restart
                    });
                    if (restartDialog.confirmed) {
                        hostService.restart();
                    }
                }
            }));
            qp.show();
            qp.busy = true;
        }
    }
    exports.ConfigureDisplayLanguageAction = ConfigureDisplayLanguageAction;
    ConfigureDisplayLanguageAction.ID = 'workbench.action.configureLocale';
    ConfigureDisplayLanguageAction.LABEL = (0, nls_1.localize)('configureLocale', "Configure Display Language");
    class ClearDisplayLanguageAction extends actions_1.Action2 {
        constructor() {
            super({
                id: ClearDisplayLanguageAction.ID,
                title: { original: 'Clear Display Language Preference', value: ClearDisplayLanguageAction.LABEL },
                menu: {
                    id: actions_1.MenuId.CommandPalette
                }
            });
        }
        async run(accessor) {
            const localeService = accessor.get(locale_1.ILocaleService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const productService = accessor.get(productService_1.IProductService);
            const hostService = accessor.get(host_1.IHostService);
            if (await localeService.setLocale(undefined)) {
                const restartDialog = await dialogService.confirm({
                    type: 'info',
                    message: (0, nls_1.localize)('relaunchAfterClearDisplayLanguageMessage', "A restart is required for the change in display language to take effect."),
                    detail: (0, nls_1.localize)('relaunchAfterClearDisplayLanguageDetail', "Press the restart button to restart {0} and change the display language.", productService.nameLong),
                    primaryButton: restart
                });
                if (restartDialog.confirmed) {
                    hostService.restart();
                }
            }
        }
    }
    exports.ClearDisplayLanguageAction = ClearDisplayLanguageAction;
    ClearDisplayLanguageAction.ID = 'workbench.action.clearLocalePreference';
    ClearDisplayLanguageAction.LABEL = (0, nls_1.localize)('clearDisplayLanguage', "Clear Display Language Preference");
});
//# sourceMappingURL=localizationsActions.js.map