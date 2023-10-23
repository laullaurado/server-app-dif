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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/host/browser/host", "vs/base/common/platform", "vs/platform/actions/common/actions", "vs/workbench/browser/parts/titlebar/titlebarPart", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/themeService", "vs/workbench/services/layout/browser/layoutService", "vs/platform/native/electron-sandbox/native", "vs/platform/window/common/window", "vs/platform/instantiation/common/instantiation", "vs/base/common/codicons", "vs/workbench/electron-sandbox/parts/titlebar/menubarControl"], function (require, exports, browser_1, dom_1, contextkey_1, configuration_1, storage_1, environmentService_1, host_1, platform_1, actions_1, titlebarPart_1, contextView_1, themeService_1, layoutService_1, native_1, window_1, instantiation_1, codicons_1, menubarControl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TitlebarPart = void 0;
    let TitlebarPart = class TitlebarPart extends titlebarPart_1.TitlebarPart {
        constructor(contextMenuService, configurationService, environmentService, instantiationService, themeService, storageService, layoutService, menuService, contextKeyService, hostService, nativeHostService) {
            super(contextMenuService, configurationService, environmentService, instantiationService, themeService, storageService, layoutService, menuService, contextKeyService, hostService);
            this.nativeHostService = nativeHostService;
            this.environmentService = environmentService;
        }
        getMacTitlebarSize() {
            const osVersion = this.environmentService.os.release;
            if (parseFloat(osVersion) >= 20) { // Big Sur increases title bar height
                return 28;
            }
            return 22;
        }
        get minimumHeight() { return platform_1.isMacintosh ? this.getMacTitlebarSize() / (0, browser_1.getZoomFactor)() : super.minimumHeight; }
        get maximumHeight() { return this.minimumHeight; }
        onUpdateAppIconDragBehavior() {
            const setting = this.configurationService.getValue('window.doubleClickIconToClose');
            if (setting && this.appIcon) {
                this.appIcon.style['-webkit-app-region'] = 'no-drag';
            }
            else if (this.appIcon) {
                this.appIcon.style['-webkit-app-region'] = 'drag';
            }
        }
        onDidChangeWindowMaximized(maximized) {
            if (this.maxRestoreControl) {
                if (maximized) {
                    this.maxRestoreControl.classList.remove(...codicons_1.Codicon.chromeMaximize.classNamesArray);
                    this.maxRestoreControl.classList.add(...codicons_1.Codicon.chromeRestore.classNamesArray);
                }
                else {
                    this.maxRestoreControl.classList.remove(...codicons_1.Codicon.chromeRestore.classNamesArray);
                    this.maxRestoreControl.classList.add(...codicons_1.Codicon.chromeMaximize.classNamesArray);
                }
            }
            if (this.resizer) {
                if (maximized) {
                    (0, dom_1.hide)(this.resizer);
                }
                else {
                    (0, dom_1.show)(this.resizer);
                }
            }
            this.adjustTitleMarginToCenter();
        }
        onMenubarFocusChanged(focused) {
            if ((platform_1.isWindows || platform_1.isLinux) && this.currentMenubarVisibility !== 'compact' && this.dragRegion) {
                if (focused) {
                    (0, dom_1.hide)(this.dragRegion);
                }
                else {
                    (0, dom_1.show)(this.dragRegion);
                }
            }
        }
        onMenubarVisibilityChanged(visible) {
            // Hide title when toggling menu bar
            if ((platform_1.isWindows || platform_1.isLinux) && this.currentMenubarVisibility === 'toggle' && visible) {
                // Hack to fix issue #52522 with layered webkit-app-region elements appearing under cursor
                if (this.dragRegion) {
                    (0, dom_1.hide)(this.dragRegion);
                    setTimeout(() => (0, dom_1.show)(this.dragRegion), 50);
                }
            }
            super.onMenubarVisibilityChanged(visible);
        }
        onConfigurationChanged(event) {
            super.onConfigurationChanged(event);
            if (event.affectsConfiguration('window.doubleClickIconToClose')) {
                if (this.appIcon) {
                    this.onUpdateAppIconDragBehavior();
                }
            }
        }
        installMenubar() {
            super.installMenubar();
            if (this.menubar) {
                return;
            }
            if (this.customMenubar) {
                this._register(this.customMenubar.onFocusStateChange(e => this.onMenubarFocusChanged(e)));
            }
        }
        createContentArea(parent) {
            const ret = super.createContentArea(parent);
            // Native menu controller
            if (platform_1.isMacintosh || (0, window_1.getTitleBarStyle)(this.configurationService) === 'native') {
                this._register(this.instantiationService.createInstance(menubarControl_1.NativeMenubarControl));
            }
            // App Icon (Native Windows/Linux)
            if (this.appIcon) {
                this.onUpdateAppIconDragBehavior();
                this._register((0, dom_1.addDisposableListener)(this.appIcon, dom_1.EventType.DBLCLICK, (e => {
                    this.nativeHostService.closeWindow();
                })));
            }
            // Draggable region that we can manipulate for #52522
            this.dragRegion = (0, dom_1.prepend)(this.rootContainer, (0, dom_1.$)('div.titlebar-drag-region'));
            // Window Controls (Native Windows/Linux)
            const hasWindowControlsOverlay = typeof navigator.windowControlsOverlay !== 'undefined';
            if (!platform_1.isMacintosh && (0, window_1.getTitleBarStyle)(this.configurationService) !== 'native' && !hasWindowControlsOverlay && this.windowControls) {
                // Minimize
                const minimizeIcon = (0, dom_1.append)(this.windowControls, (0, dom_1.$)('div.window-icon.window-minimize' + codicons_1.Codicon.chromeMinimize.cssSelector));
                this._register((0, dom_1.addDisposableListener)(minimizeIcon, dom_1.EventType.CLICK, e => {
                    this.nativeHostService.minimizeWindow();
                }));
                // Restore
                this.maxRestoreControl = (0, dom_1.append)(this.windowControls, (0, dom_1.$)('div.window-icon.window-max-restore'));
                this._register((0, dom_1.addDisposableListener)(this.maxRestoreControl, dom_1.EventType.CLICK, async (e) => {
                    const maximized = await this.nativeHostService.isMaximized();
                    if (maximized) {
                        return this.nativeHostService.unmaximizeWindow();
                    }
                    return this.nativeHostService.maximizeWindow();
                }));
                // Close
                const closeIcon = (0, dom_1.append)(this.windowControls, (0, dom_1.$)('div.window-icon.window-close' + codicons_1.Codicon.chromeClose.cssSelector));
                this._register((0, dom_1.addDisposableListener)(closeIcon, dom_1.EventType.CLICK, e => {
                    this.nativeHostService.closeWindow();
                }));
                // Resizer
                this.resizer = (0, dom_1.append)(this.rootContainer, (0, dom_1.$)('div.resizer'));
                this._register(this.layoutService.onDidChangeWindowMaximized(maximized => this.onDidChangeWindowMaximized(maximized)));
                this.onDidChangeWindowMaximized(this.layoutService.isWindowMaximized());
            }
            return ret;
        }
        updateStyles() {
            super.updateStyles();
            // WCO styles only supported on Windows currently
            if ((0, window_1.useWindowControlsOverlay)(this.configurationService, this.environmentService)) {
                if (!this.cachedWindowControlStyles ||
                    this.cachedWindowControlStyles.bgColor !== this.element.style.backgroundColor ||
                    this.cachedWindowControlStyles.fgColor !== this.element.style.color) {
                    this.nativeHostService.updateTitleBarOverlay(this.element.style.backgroundColor, this.element.style.color);
                }
            }
        }
    };
    TitlebarPart = __decorate([
        __param(0, contextView_1.IContextMenuService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, themeService_1.IThemeService),
        __param(5, storage_1.IStorageService),
        __param(6, layoutService_1.IWorkbenchLayoutService),
        __param(7, actions_1.IMenuService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, host_1.IHostService),
        __param(10, native_1.INativeHostService)
    ], TitlebarPart);
    exports.TitlebarPart = TitlebarPart;
});
//# sourceMappingURL=titlebarPart.js.map