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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/url/common/url", "vs/workbench/services/host/browser/host", "vs/workbench/services/extensions/common/extensions", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/actions/common/actions", "vs/platform/quickinput/common/quickInput", "vs/platform/progress/common/progress", "vs/platform/contextkey/common/contextkeys", "vs/platform/extensionManagement/common/extensionUrlTrust", "vs/base/common/cancellation", "vs/platform/telemetry/common/telemetry"], function (require, exports, nls_1, lifecycle_1, uri_1, configuration_1, dialogs_1, extensionManagement_1, extensionManagement_2, extensionManagementUtil_1, instantiation_1, notification_1, storage_1, url_1, host_1, extensions_1, extensions_2, extensions_3, platform_1, contributions_1, actions_1, quickInput_1, progress_1, contextkeys_1, extensionUrlTrust_1, cancellation_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtensionUrlHandler = void 0;
    const FIVE_MINUTES = 5 * 60 * 1000;
    const THIRTY_SECONDS = 30 * 1000;
    const URL_TO_HANDLE = 'extensionUrlHandler.urlToHandle';
    const USER_TRUSTED_EXTENSIONS_CONFIGURATION_KEY = 'extensions.confirmedUriHandlerExtensionIds';
    const USER_TRUSTED_EXTENSIONS_STORAGE_KEY = 'extensionUrlHandler.confirmedExtensions';
    function isExtensionId(value) {
        return /^[a-z0-9][a-z0-9\-]*\.[a-z0-9][a-z0-9\-]*$/i.test(value);
    }
    class UserTrustedExtensionIdStorage {
        constructor(storageService) {
            this.storageService = storageService;
        }
        get extensions() {
            const userTrustedExtensionIdsJson = this.storageService.get(USER_TRUSTED_EXTENSIONS_STORAGE_KEY, 0 /* StorageScope.GLOBAL */, '[]');
            try {
                return JSON.parse(userTrustedExtensionIdsJson);
            }
            catch (_a) {
                return [];
            }
        }
        has(id) {
            return this.extensions.indexOf(id) > -1;
        }
        add(id) {
            this.set([...this.extensions, id]);
        }
        set(ids) {
            this.storageService.store(USER_TRUSTED_EXTENSIONS_STORAGE_KEY, JSON.stringify(ids), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
        }
    }
    exports.IExtensionUrlHandler = (0, instantiation_1.createDecorator)('extensionUrlHandler');
    /**
     * This class handles URLs which are directed towards extensions.
     * If a URL is directed towards an inactive extension, it buffers it,
     * activates the extension and re-opens the URL once the extension registers
     * a URL handler. If the extension never registers a URL handler, the urls
     * will eventually be garbage collected.
     *
     * It also makes sure the user confirms opening URLs directed towards extensions.
     */
    let ExtensionUrlHandler = class ExtensionUrlHandler {
        constructor(urlService, extensionService, dialogService, notificationService, extensionManagementService, extensionEnablementService, hostService, galleryService, storageService, configurationService, progressService, telemetryService, extensionUrlTrustService) {
            this.extensionService = extensionService;
            this.dialogService = dialogService;
            this.notificationService = notificationService;
            this.extensionManagementService = extensionManagementService;
            this.extensionEnablementService = extensionEnablementService;
            this.hostService = hostService;
            this.galleryService = galleryService;
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.progressService = progressService;
            this.telemetryService = telemetryService;
            this.extensionUrlTrustService = extensionUrlTrustService;
            this.extensionHandlers = new Map();
            this.uriBuffer = new Map();
            this.userTrustedExtensionsStorage = new UserTrustedExtensionIdStorage(storageService);
            const interval = setInterval(() => this.garbageCollect(), THIRTY_SECONDS);
            const urlToHandleValue = this.storageService.get(URL_TO_HANDLE, 1 /* StorageScope.WORKSPACE */);
            if (urlToHandleValue) {
                this.storageService.remove(URL_TO_HANDLE, 1 /* StorageScope.WORKSPACE */);
                this.handleURL(uri_1.URI.revive(JSON.parse(urlToHandleValue)), { trusted: true });
            }
            this.disposable = (0, lifecycle_1.combinedDisposable)(urlService.registerHandler(this), (0, lifecycle_1.toDisposable)(() => clearInterval(interval)));
            const cache = ExtensionUrlBootstrapHandler.cache;
            setTimeout(() => cache.forEach(([uri, option]) => this.handleURL(uri, option)));
        }
        async handleURL(uri, options) {
            if (!isExtensionId(uri.authority)) {
                return false;
            }
            const extensionId = uri.authority;
            this.telemetryService.publicLog2('uri_invoked/start', { extensionId });
            const wasHandlerAvailable = this.extensionHandlers.has(extensions_2.ExtensionIdentifier.toKey(extensionId));
            const extension = await this.extensionService.getExtension(extensionId);
            if (!extension) {
                await this.handleUnhandledURL(uri, { id: extensionId }, options);
                return true;
            }
            const trusted = (options === null || options === void 0 ? void 0 : options.trusted)
                || ((options === null || options === void 0 ? void 0 : options.originalUrl) ? await this.extensionUrlTrustService.isExtensionUrlTrusted(extensionId, options.originalUrl) : false)
                || this.didUserTrustExtension(extensions_2.ExtensionIdentifier.toKey(extensionId));
            if (!trusted) {
                let uriString = uri.toString(false);
                if (uriString.length > 40) {
                    uriString = `${uriString.substring(0, 30)}...${uriString.substring(uriString.length - 5)}`;
                }
                const result = await this.dialogService.confirm({
                    message: (0, nls_1.localize)('confirmUrl', "Allow an extension to open this URI?", extensionId),
                    checkbox: {
                        label: (0, nls_1.localize)('rememberConfirmUrl', "Don't ask again for this extension."),
                    },
                    detail: `${extension.displayName || extension.name} (${extensionId}) wants to open a URI:\n\n${uriString}`,
                    primaryButton: (0, nls_1.localize)('open', "&&Open"),
                    type: 'question'
                });
                if (!result.confirmed) {
                    this.telemetryService.publicLog2('uri_invoked/cancel', { extensionId });
                    return true;
                }
                if (result.checkboxChecked) {
                    this.userTrustedExtensionsStorage.add(extensions_2.ExtensionIdentifier.toKey(extensionId));
                }
            }
            const handler = this.extensionHandlers.get(extensions_2.ExtensionIdentifier.toKey(extensionId));
            if (handler) {
                if (!wasHandlerAvailable) {
                    // forward it directly
                    return await this.handleURLByExtension(extensionId, handler, uri, options);
                }
                // let the ExtensionUrlHandler instance handle this
                return false;
            }
            // collect URI for eventual extension activation
            const timestamp = new Date().getTime();
            let uris = this.uriBuffer.get(extensions_2.ExtensionIdentifier.toKey(extensionId));
            if (!uris) {
                uris = [];
                this.uriBuffer.set(extensions_2.ExtensionIdentifier.toKey(extensionId), uris);
            }
            uris.push({ timestamp, uri });
            // activate the extension
            await this.extensionService.activateByEvent(`onUri:${extensions_2.ExtensionIdentifier.toKey(extensionId)}`);
            return true;
        }
        registerExtensionHandler(extensionId, handler) {
            this.extensionHandlers.set(extensions_2.ExtensionIdentifier.toKey(extensionId), handler);
            const uris = this.uriBuffer.get(extensions_2.ExtensionIdentifier.toKey(extensionId)) || [];
            for (const { uri } of uris) {
                this.handleURLByExtension(extensionId, handler, uri);
            }
            this.uriBuffer.delete(extensions_2.ExtensionIdentifier.toKey(extensionId));
        }
        unregisterExtensionHandler(extensionId) {
            this.extensionHandlers.delete(extensions_2.ExtensionIdentifier.toKey(extensionId));
        }
        async handleURLByExtension(extensionId, handler, uri, options) {
            this.telemetryService.publicLog2('uri_invoked/end', { extensionId: extensions_2.ExtensionIdentifier.toKey(extensionId) });
            return await handler.handleURL(uri, options);
        }
        async handleUnhandledURL(uri, extensionIdentifier, options) {
            var _a;
            const installedExtensions = await this.extensionManagementService.getInstalled();
            let extension = installedExtensions.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extensionIdentifier));
            // Extension is not installed
            if (!extension) {
                let galleryExtension;
                try {
                    galleryExtension = (_a = (await this.galleryService.getExtensions([extensionIdentifier], cancellation_1.CancellationToken.None))[0]) !== null && _a !== void 0 ? _a : undefined;
                }
                catch (err) {
                    return;
                }
                if (!galleryExtension) {
                    return;
                }
                this.telemetryService.publicLog2('uri_invoked/install_extension/start', { extensionId: extensionIdentifier.id });
                // Install the Extension and reload the window to handle.
                const result = await this.dialogService.confirm({
                    message: (0, nls_1.localize)('installAndHandle', "Extension '{0}' is not installed. Would you like to install the extension and open this URL?", galleryExtension.displayName || galleryExtension.name),
                    detail: `${galleryExtension.displayName || galleryExtension.name} (${extensionIdentifier.id}) wants to open a URL:\n\n${uri.toString()}`,
                    primaryButton: (0, nls_1.localize)('install and open', "&&Install and Open"),
                    type: 'question'
                });
                if (!result.confirmed) {
                    this.telemetryService.publicLog2('uri_invoked/install_extension/cancel', { extensionId: extensionIdentifier.id });
                    return;
                }
                this.telemetryService.publicLog2('uri_invoked/install_extension/accept', { extensionId: extensionIdentifier.id });
                try {
                    extension = await this.progressService.withProgress({
                        location: 15 /* ProgressLocation.Notification */,
                        title: (0, nls_1.localize)('Installing', "Installing Extension '{0}'...", galleryExtension.displayName || galleryExtension.name)
                    }, () => this.extensionManagementService.installFromGallery(galleryExtension));
                }
                catch (error) {
                    this.notificationService.error(error);
                    return;
                }
            }
            // Extension is installed but not enabled
            if (!this.extensionEnablementService.isEnabled(extension)) {
                this.telemetryService.publicLog2('uri_invoked/enable_extension/start', { extensionId: extensionIdentifier.id });
                const result = await this.dialogService.confirm({
                    message: (0, nls_1.localize)('enableAndHandle', "Extension '{0}' is disabled. Would you like to enable the extension and open the URL?", extension.manifest.displayName || extension.manifest.name),
                    detail: `${extension.manifest.displayName || extension.manifest.name} (${extensionIdentifier.id}) wants to open a URL:\n\n${uri.toString()}`,
                    primaryButton: (0, nls_1.localize)('enableAndReload', "&&Enable and Open"),
                    type: 'question'
                });
                if (!result.confirmed) {
                    this.telemetryService.publicLog2('uri_invoked/enable_extension/cancel', { extensionId: extensionIdentifier.id });
                    return;
                }
                this.telemetryService.publicLog2('uri_invoked/enable_extension/accept', { extensionId: extensionIdentifier.id });
                await this.extensionEnablementService.setEnablement([extension], 8 /* EnablementState.EnabledGlobally */);
            }
            if (this.extensionService.canAddExtension((0, extensions_1.toExtensionDescription)(extension))) {
                await this.waitUntilExtensionIsAdded(extensionIdentifier);
                await this.handleURL(uri, Object.assign(Object.assign({}, options), { trusted: true }));
            }
            /* Extension cannot be added and require window reload */
            else {
                this.telemetryService.publicLog2('uri_invoked/activate_extension/start', { extensionId: extensionIdentifier.id });
                const result = await this.dialogService.confirm({
                    message: (0, nls_1.localize)('reloadAndHandle', "Extension '{0}' is not loaded. Would you like to reload the window to load the extension and open the URL?", extension.manifest.displayName || extension.manifest.name),
                    detail: `${extension.manifest.displayName || extension.manifest.name} (${extensionIdentifier.id}) wants to open a URL:\n\n${uri.toString()}`,
                    primaryButton: (0, nls_1.localize)('reloadAndOpen', "&&Reload Window and Open"),
                    type: 'question'
                });
                if (!result.confirmed) {
                    this.telemetryService.publicLog2('uri_invoked/activate_extension/cancel', { extensionId: extensionIdentifier.id });
                    return;
                }
                this.telemetryService.publicLog2('uri_invoked/activate_extension/accept', { extensionId: extensionIdentifier.id });
                this.storageService.store(URL_TO_HANDLE, JSON.stringify(uri.toJSON()), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                await this.hostService.reload();
            }
        }
        async waitUntilExtensionIsAdded(extensionId) {
            if (!(await this.extensionService.getExtension(extensionId.id))) {
                await new Promise((c, e) => {
                    const disposable = this.extensionService.onDidChangeExtensions(async () => {
                        try {
                            if (await this.extensionService.getExtension(extensionId.id)) {
                                disposable.dispose();
                                c();
                            }
                        }
                        catch (error) {
                            e(error);
                        }
                    });
                });
            }
        }
        // forget about all uris buffered more than 5 minutes ago
        garbageCollect() {
            const now = new Date().getTime();
            const uriBuffer = new Map();
            this.uriBuffer.forEach((uris, extensionId) => {
                uris = uris.filter(({ timestamp }) => now - timestamp < FIVE_MINUTES);
                if (uris.length > 0) {
                    uriBuffer.set(extensionId, uris);
                }
            });
            this.uriBuffer = uriBuffer;
        }
        didUserTrustExtension(id) {
            if (this.userTrustedExtensionsStorage.has(id)) {
                return true;
            }
            return this.getConfirmedTrustedExtensionIdsFromConfiguration().indexOf(id) > -1;
        }
        getConfirmedTrustedExtensionIdsFromConfiguration() {
            const trustedExtensionIds = this.configurationService.getValue(USER_TRUSTED_EXTENSIONS_CONFIGURATION_KEY);
            if (!Array.isArray(trustedExtensionIds)) {
                return [];
            }
            return trustedExtensionIds;
        }
        dispose() {
            this.disposable.dispose();
            this.extensionHandlers.clear();
            this.uriBuffer.clear();
        }
    };
    ExtensionUrlHandler = __decorate([
        __param(0, url_1.IURLService),
        __param(1, extensions_1.IExtensionService),
        __param(2, dialogs_1.IDialogService),
        __param(3, notification_1.INotificationService),
        __param(4, extensionManagement_1.IExtensionManagementService),
        __param(5, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(6, host_1.IHostService),
        __param(7, extensionManagement_1.IExtensionGalleryService),
        __param(8, storage_1.IStorageService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, progress_1.IProgressService),
        __param(11, telemetry_1.ITelemetryService),
        __param(12, extensionUrlTrust_1.IExtensionUrlTrustService)
    ], ExtensionUrlHandler);
    (0, extensions_3.registerSingleton)(exports.IExtensionUrlHandler, ExtensionUrlHandler);
    /**
     * This class handles URLs before `ExtensionUrlHandler` is instantiated.
     * More info: https://github.com/microsoft/vscode/issues/73101
     */
    let ExtensionUrlBootstrapHandler = class ExtensionUrlBootstrapHandler {
        constructor(urlService) {
            ExtensionUrlBootstrapHandler.disposable = urlService.registerHandler(this);
        }
        static get cache() {
            ExtensionUrlBootstrapHandler.disposable.dispose();
            const result = ExtensionUrlBootstrapHandler._cache;
            ExtensionUrlBootstrapHandler._cache = [];
            return result;
        }
        async handleURL(uri, options) {
            if (!isExtensionId(uri.authority)) {
                return false;
            }
            ExtensionUrlBootstrapHandler._cache.push([uri, options]);
            return true;
        }
    };
    ExtensionUrlBootstrapHandler._cache = [];
    ExtensionUrlBootstrapHandler = __decorate([
        __param(0, url_1.IURLService)
    ], ExtensionUrlBootstrapHandler);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(ExtensionUrlBootstrapHandler, 2 /* LifecyclePhase.Ready */);
    class ManageAuthorizedExtensionURIsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.extensions.action.manageAuthorizedExtensionURIs',
                title: { value: (0, nls_1.localize)('manage', "Manage Authorized Extension URIs..."), original: 'Manage Authorized Extension URIs...' },
                category: { value: (0, nls_1.localize)('extensions', "Extensions"), original: 'Extensions' },
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkeys_1.IsWebContext.toNegated()
                }
            });
        }
        async run(accessor) {
            const storageService = accessor.get(storage_1.IStorageService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const storage = new UserTrustedExtensionIdStorage(storageService);
            const items = storage.extensions.map(label => ({ label, picked: true }));
            if (items.length === 0) {
                await quickInputService.pick([{ label: (0, nls_1.localize)('no', 'There are currently no authorized extension URIs.') }]);
                return;
            }
            const result = await quickInputService.pick(items, { canPickMany: true });
            if (!result) {
                return;
            }
            storage.set(result.map(item => item.label));
        }
    }
    (0, actions_1.registerAction2)(ManageAuthorizedExtensionURIsAction);
});
//# sourceMappingURL=extensionUrlHandler.js.map