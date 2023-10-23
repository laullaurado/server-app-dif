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
define(["require", "exports", "vs/nls", "vs/workbench/browser/part", "vs/base/browser/browser", "vs/platform/window/common/window", "vs/platform/contextview/browser/contextView", "vs/base/browser/mouseEvent", "vs/base/common/actions", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/workbench/services/environment/browser/environmentService", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/base/common/platform", "vs/base/common/color", "vs/base/browser/dom", "vs/workbench/browser/parts/titlebar/menubarControl", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/platform/storage/common/storage", "vs/workbench/services/layout/browser/layoutService", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/host/browser/host", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/base/browser/ui/toolbar/toolbar", "vs/workbench/browser/parts/titlebar/windowTitle", "vs/workbench/browser/parts/titlebar/commandCenterControl", "vs/css!./media/titlebarpart"], function (require, exports, nls_1, part_1, browser_1, window_1, contextView_1, mouseEvent_1, actions_1, configuration_1, lifecycle_1, environmentService_1, themeService_1, theme_1, platform_1, color_1, dom_1, menubarControl_1, instantiation_1, event_1, storage_1, layoutService_1, menuEntryActionViewItem_1, actions_2, contextkey_1, host_1, codicons_1, iconRegistry_1, toolbar_1, windowTitle_1, commandCenterControl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TitlebarPart = void 0;
    let TitlebarPart = class TitlebarPart extends part_1.Part {
        constructor(contextMenuService, configurationService, environmentService, instantiationService, themeService, storageService, layoutService, menuService, contextKeyService, hostService) {
            super("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */, { hasTitle: false }, themeService, storageService, layoutService);
            this.contextMenuService = contextMenuService;
            this.configurationService = configurationService;
            this.environmentService = environmentService;
            this.instantiationService = instantiationService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.hostService = hostService;
            //#region IView
            this.minimumWidth = 0;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            //#endregion
            this._onMenubarVisibilityChange = this._register(new event_1.Emitter());
            this.onMenubarVisibilityChange = this._onMenubarVisibilityChange.event;
            this._onDidChangeTitleMenuVisibility = new event_1.Emitter();
            this.onDidChangeTitleMenuVisibility = this._onDidChangeTitleMenuVisibility.event;
            this.titleDisposables = this._register(new lifecycle_1.DisposableStore());
            this.isInactive = false;
            this.windowTitle = this._register(instantiationService.createInstance(windowTitle_1.WindowTitle));
            this.contextMenu = this._register(menuService.createMenu(actions_2.MenuId.TitleBarContext, contextKeyService));
            this.titleBarStyle = (0, window_1.getTitleBarStyle)(this.configurationService);
            this.registerListeners();
        }
        get minimumHeight() { return 30 / (this.currentMenubarVisibility === 'hidden' || (0, browser_1.getZoomFactor)() < 1 ? (0, browser_1.getZoomFactor)() : 1); }
        get maximumHeight() { return this.minimumHeight; }
        updateProperties(properties) {
            this.windowTitle.updateProperties(properties);
        }
        get isCommandCenterVisible() {
            return this.configurationService.getValue(TitlebarPart.configCommandCenter);
        }
        registerListeners() {
            this._register(this.hostService.onDidChangeFocus(focused => focused ? this.onFocus() : this.onBlur()));
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationChanged(e)));
        }
        onBlur() {
            this.isInactive = true;
            this.updateStyles();
        }
        onFocus() {
            this.isInactive = false;
            this.updateStyles();
        }
        onConfigurationChanged(event) {
            if (this.titleBarStyle !== 'native' && (!platform_1.isMacintosh || platform_1.isWeb)) {
                if (event.affectsConfiguration('window.menuBarVisibility')) {
                    if (this.currentMenubarVisibility === 'compact') {
                        this.uninstallMenubar();
                    }
                    else {
                        this.installMenubar();
                    }
                }
            }
            if (this.titleBarStyle !== 'native' && this.layoutControls && event.affectsConfiguration('workbench.layoutControl.enabled')) {
                this.layoutControls.classList.toggle('show-layout-control', this.layoutControlEnabled);
            }
            if (event.affectsConfiguration(TitlebarPart.configCommandCenter)) {
                this.updateTitle();
                this.adjustTitleMarginToCenter();
                this._onDidChangeTitleMenuVisibility.fire();
            }
        }
        onMenubarVisibilityChanged(visible) {
            if (platform_1.isWeb || platform_1.isWindows || platform_1.isLinux) {
                this.adjustTitleMarginToCenter();
                this._onMenubarVisibilityChange.fire(visible);
            }
        }
        uninstallMenubar() {
            if (this.customMenubar) {
                this.customMenubar.dispose();
                this.customMenubar = undefined;
            }
            if (this.menubar) {
                this.menubar.remove();
                this.menubar = undefined;
            }
        }
        installMenubar() {
            // If the menubar is already installed, skip
            if (this.menubar) {
                return;
            }
            this.customMenubar = this._register(this.instantiationService.createInstance(menubarControl_1.CustomMenubarControl));
            this.menubar = this.rootContainer.insertBefore((0, dom_1.$)('div.menubar'), this.title);
            this.menubar.setAttribute('role', 'menubar');
            this.customMenubar.create(this.menubar);
            this._register(this.customMenubar.onVisibilityChange(e => this.onMenubarVisibilityChanged(e)));
        }
        updateTitle() {
            this.titleDisposables.clear();
            if (!this.isCommandCenterVisible) {
                // Text Title
                this.title.innerText = this.windowTitle.value;
                this.titleDisposables.add(this.windowTitle.onDidChange(() => {
                    this.title.innerText = this.windowTitle.value;
                    this.adjustTitleMarginToCenter();
                }));
            }
            else {
                // Menu Title
                const commandCenter = this.instantiationService.createInstance(commandCenterControl_1.CommandCenterControl, this.windowTitle);
                (0, dom_1.reset)(this.title, commandCenter.element);
                this.titleDisposables.add(commandCenter);
                this.titleDisposables.add(commandCenter.onDidChangeVisibility(this.adjustTitleMarginToCenter, this));
            }
        }
        createContentArea(parent) {
            var _a;
            this.element = parent;
            this.rootContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.titlebar-container'));
            // App Icon (Native Windows/Linux and Web)
            if (!platform_1.isMacintosh || platform_1.isWeb) {
                this.appIcon = (0, dom_1.prepend)(this.rootContainer, (0, dom_1.$)('a.window-appicon'));
                // Web-only home indicator and menu
                if (platform_1.isWeb) {
                    const homeIndicator = (_a = this.environmentService.options) === null || _a === void 0 ? void 0 : _a.homeIndicator;
                    if (homeIndicator) {
                        const icon = (0, iconRegistry_1.getIconRegistry)().getIcon(homeIndicator.icon) ? { id: homeIndicator.icon } : codicons_1.Codicon.code;
                        this.appIcon.setAttribute('href', homeIndicator.href);
                        this.appIcon.classList.add(...themeService_1.ThemeIcon.asClassNameArray(icon));
                        this.appIconBadge = document.createElement('div');
                        this.appIconBadge.classList.add('home-bar-icon-badge');
                        this.appIcon.appendChild(this.appIconBadge);
                    }
                }
            }
            // Menubar: install a custom menu bar depending on configuration
            // and when not in activity bar
            if (this.titleBarStyle !== 'native'
                && (!platform_1.isMacintosh || platform_1.isWeb)
                && this.currentMenubarVisibility !== 'compact') {
                this.installMenubar();
            }
            // Title
            this.title = (0, dom_1.append)(this.rootContainer, (0, dom_1.$)('div.window-title'));
            this.updateTitle();
            if (this.titleBarStyle !== 'native') {
                this.layoutControls = (0, dom_1.append)(this.rootContainer, (0, dom_1.$)('div.layout-controls-container'));
                this.layoutControls.classList.toggle('show-layout-control', this.layoutControlEnabled);
                this.layoutToolbar = new toolbar_1.ToolBar(this.layoutControls, this.contextMenuService, {
                    actionViewItemProvider: action => {
                        return (0, menuEntryActionViewItem_1.createActionViewItem)(this.instantiationService, action);
                    },
                    allowContextMenu: true
                });
                this._register((0, dom_1.addDisposableListener)(this.layoutControls, dom_1.EventType.CONTEXT_MENU, e => {
                    dom_1.EventHelper.stop(e);
                    this.onLayoutControlContextMenu(e, this.layoutControls);
                }));
                const menu = this._register(this.menuService.createMenu(actions_2.MenuId.LayoutControlMenu, this.contextKeyService));
                const updateLayoutMenu = () => {
                    if (!this.layoutToolbar) {
                        return;
                    }
                    const actions = [];
                    const toDispose = (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, undefined, { primary: [], secondary: actions });
                    this.layoutToolbar.setActions(actions);
                    toDispose.dispose();
                };
                menu.onDidChange(updateLayoutMenu);
                updateLayoutMenu();
            }
            this.windowControls = (0, dom_1.append)(this.element, (0, dom_1.$)('div.window-controls-container'));
            // Context menu on title
            [dom_1.EventType.CONTEXT_MENU, dom_1.EventType.MOUSE_DOWN].forEach(event => {
                this._register((0, dom_1.addDisposableListener)(this.title, event, e => {
                    if (e.type === dom_1.EventType.CONTEXT_MENU || e.metaKey) {
                        dom_1.EventHelper.stop(e);
                        this.onContextMenu(e);
                    }
                }));
            });
            // Since the title area is used to drag the window, we do not want to steal focus from the
            // currently active element. So we restore focus after a timeout back to where it was.
            this._register((0, dom_1.addDisposableListener)(this.element, dom_1.EventType.MOUSE_DOWN, e => {
                if (e.target && this.menubar && (0, dom_1.isAncestor)(e.target, this.menubar)) {
                    return;
                }
                if (e.target && this.layoutToolbar && (0, dom_1.isAncestor)(e.target, this.layoutToolbar.getElement())) {
                    return;
                }
                if (e.target && (0, dom_1.isAncestor)(e.target, this.title)) {
                    return;
                }
                const active = document.activeElement;
                setTimeout(() => {
                    if (active instanceof HTMLElement) {
                        active.focus();
                    }
                }, 0 /* need a timeout because we are in capture phase */);
            }, true /* use capture to know the currently active element properly */));
            this.updateStyles();
            return this.element;
        }
        updateStyles() {
            super.updateStyles();
            // Part container
            if (this.element) {
                if (this.isInactive) {
                    this.element.classList.add('inactive');
                }
                else {
                    this.element.classList.remove('inactive');
                }
                const titleBackground = this.getColor(this.isInactive ? theme_1.TITLE_BAR_INACTIVE_BACKGROUND : theme_1.TITLE_BAR_ACTIVE_BACKGROUND, (color, theme) => {
                    // LCD Rendering Support: the title bar part is a defining its own GPU layer.
                    // To benefit from LCD font rendering, we must ensure that we always set an
                    // opaque background color. As such, we compute an opaque color given we know
                    // the background color is the workbench background.
                    return color.isOpaque() ? color : color.makeOpaque((0, theme_1.WORKBENCH_BACKGROUND)(theme));
                }) || '';
                this.element.style.backgroundColor = titleBackground;
                if (this.appIconBadge) {
                    this.appIconBadge.style.backgroundColor = titleBackground;
                }
                if (titleBackground && color_1.Color.fromHex(titleBackground).isLighter()) {
                    this.element.classList.add('light');
                }
                else {
                    this.element.classList.remove('light');
                }
                const titleForeground = this.getColor(this.isInactive ? theme_1.TITLE_BAR_INACTIVE_FOREGROUND : theme_1.TITLE_BAR_ACTIVE_FOREGROUND);
                this.element.style.color = titleForeground || '';
                const titleBorder = this.getColor(theme_1.TITLE_BAR_BORDER);
                this.element.style.borderBottom = titleBorder ? `1px solid ${titleBorder}` : '';
            }
        }
        onContextMenu(e) {
            // Find target anchor
            const event = new mouseEvent_1.StandardMouseEvent(e);
            const anchor = { x: event.posx, y: event.posy };
            // Fill in contributed actions
            const actions = [];
            const actionsDisposable = (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(this.contextMenu, undefined, actions);
            // Show it
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => actions,
                onHide: () => (0, lifecycle_1.dispose)(actionsDisposable)
            });
        }
        onLayoutControlContextMenu(e, el) {
            // Find target anchor
            const event = new mouseEvent_1.StandardMouseEvent(e);
            const anchor = { x: event.posx, y: event.posy };
            const actions = [];
            actions.push((0, actions_1.toAction)({
                id: 'layoutControl.hide',
                label: (0, nls_1.localize)('layoutControl.hide', "Hide Layout Control"),
                run: () => {
                    this.configurationService.updateValue('workbench.layoutControl.enabled', false);
                }
            }));
            // Show it
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => actions,
                domForShadowRoot: el
            });
        }
        adjustTitleMarginToCenter() {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            const base = platform_1.isMacintosh ? ((_b = (_a = this.windowControls) === null || _a === void 0 ? void 0 : _a.clientWidth) !== null && _b !== void 0 ? _b : 0) : 0;
            const leftMarker = base + ((_d = (_c = this.appIcon) === null || _c === void 0 ? void 0 : _c.clientWidth) !== null && _d !== void 0 ? _d : 0) + ((_f = (_e = this.menubar) === null || _e === void 0 ? void 0 : _e.clientWidth) !== null && _f !== void 0 ? _f : 0) + 10;
            const rightMarker = base + this.rootContainer.clientWidth - ((_h = (_g = this.layoutControls) === null || _g === void 0 ? void 0 : _g.clientWidth) !== null && _h !== void 0 ? _h : 0) - 10;
            // Not enough space to center the titlebar within window,
            // Center between left and right controls
            if (leftMarker > (this.rootContainer.clientWidth + ((_k = (_j = this.windowControls) === null || _j === void 0 ? void 0 : _j.clientWidth) !== null && _k !== void 0 ? _k : 0) - this.title.clientWidth) / 2 ||
                rightMarker < (this.rootContainer.clientWidth + ((_m = (_l = this.windowControls) === null || _l === void 0 ? void 0 : _l.clientWidth) !== null && _m !== void 0 ? _m : 0) + this.title.clientWidth) / 2) {
                this.title.style.position = '';
                this.title.style.left = '';
                this.title.style.transform = '';
                return;
            }
            this.title.style.position = 'absolute';
            this.title.style.left = `calc(50% - ${this.title.clientWidth / 2}px)`;
        }
        get currentMenubarVisibility() {
            return (0, window_1.getMenuBarVisibility)(this.configurationService);
        }
        get layoutControlEnabled() {
            return this.configurationService.getValue('workbench.layoutControl.enabled');
        }
        updateLayout(dimension) {
            this.lastLayoutDimensions = dimension;
            if ((0, window_1.getTitleBarStyle)(this.configurationService) === 'custom') {
                // Prevent zooming behavior if any of the following conditions are met:
                // 1. Native macOS
                // 2. Menubar is hidden
                // 3. Shrinking below the window control size (zoom < 1)
                const zoomFactor = (0, browser_1.getZoomFactor)();
                this.element.style.setProperty('--zoom-factor', zoomFactor.toString());
                this.rootContainer.classList.toggle('counter-zoom', zoomFactor < 1 || (!platform_1.isWeb && platform_1.isMacintosh) || this.currentMenubarVisibility === 'hidden');
                (0, dom_1.runAtThisOrScheduleAtNextAnimationFrame)(() => this.adjustTitleMarginToCenter());
                if (this.customMenubar) {
                    const menubarDimension = new dom_1.Dimension(0, dimension.height);
                    this.customMenubar.layout(menubarDimension);
                }
            }
        }
        layout(width, height) {
            this.updateLayout(new dom_1.Dimension(width, height));
            super.layoutContents(width, height);
        }
        toJSON() {
            return {
                type: "workbench.parts.titlebar" /* Parts.TITLEBAR_PART */
            };
        }
    };
    TitlebarPart.configCommandCenter = 'window.experimental.commandCenter';
    TitlebarPart = __decorate([
        __param(0, contextView_1.IContextMenuService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, themeService_1.IThemeService),
        __param(5, storage_1.IStorageService),
        __param(6, layoutService_1.IWorkbenchLayoutService),
        __param(7, actions_2.IMenuService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, host_1.IHostService)
    ], TitlebarPart);
    exports.TitlebarPart = TitlebarPart;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const titlebarActiveFg = theme.getColor(theme_1.TITLE_BAR_ACTIVE_FOREGROUND);
        if (titlebarActiveFg) {
            collector.addRule(`
		.monaco-workbench .part.titlebar .window-controls-container .window-icon {
			color: ${titlebarActiveFg};
		}
		`);
        }
        const titlebarInactiveFg = theme.getColor(theme_1.TITLE_BAR_INACTIVE_FOREGROUND);
        if (titlebarInactiveFg) {
            collector.addRule(`
		.monaco-workbench .part.titlebar.inactive .window-controls-container .window-icon {
				color: ${titlebarInactiveFg};
			}
		`);
        }
    });
});
//# sourceMappingURL=titlebarPart.js.map