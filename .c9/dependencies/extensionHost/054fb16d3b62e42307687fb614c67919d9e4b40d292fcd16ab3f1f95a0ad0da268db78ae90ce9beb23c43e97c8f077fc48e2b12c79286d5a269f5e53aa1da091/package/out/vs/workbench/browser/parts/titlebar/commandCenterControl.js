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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/browser/ui/toolbar/toolbar", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/types", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/quickinput/common/quickInput", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme", "vs/workbench/services/hover/browser/hover"], function (require, exports, dom_1, actionViewItems_1, iconLabels_1, toolbar_1, actions_1, codicons_1, event_1, lifecycle_1, types_1, nls_1, menuEntryActionViewItem_1, actions_2, configuration_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, quickInput_1, colors, theme_1, hover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommandCenterControl = void 0;
    let CommandCenterControl = class CommandCenterControl {
        constructor(windowTitle, contextMenuService, contextKeyService, instantiationService, menuService, quickInputService, hoverService, configurationService, keybindingService) {
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidChangeVisibility = new event_1.Emitter();
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this.element = document.createElement('div');
            this.element.classList.add('command-center');
            const hoverDelegate = new class {
                constructor() {
                    this._lastHoverHideTime = 0;
                    this.showHover = hoverService.showHover.bind(hoverService);
                    this.placement = 'element';
                }
                get delay() {
                    return Date.now() - this._lastHoverHideTime < 200
                        ? 0 // show instantly when a hover was recently shown
                        : configurationService.getValue('workbench.hover.delay');
                }
                onDidHideHover() {
                    this._lastHoverHideTime = Date.now();
                }
            };
            const titleToolbar = new toolbar_1.ToolBar(this.element, contextMenuService, {
                actionViewItemProvider: (action) => {
                    if (action instanceof actions_2.MenuItemAction && action.id === 'workbench.action.quickOpen') {
                        class InputLikeViewItem extends menuEntryActionViewItem_1.MenuEntryActionViewItem {
                            constructor() {
                                super(...arguments);
                                this.workspaceTitle = document.createElement('span');
                            }
                            render(container) {
                                super.render(container);
                                container.classList.add('quickopen');
                                (0, types_1.assertType)(this.label);
                                this.label.classList.add('search');
                                const searchIcon = (0, iconLabels_1.renderIcon)(codicons_1.Codicon.search);
                                searchIcon.classList.add('search-icon');
                                this.workspaceTitle.classList.add('search-label');
                                this._updateFromWindowTitle();
                                (0, dom_1.reset)(this.label, searchIcon, this.workspaceTitle);
                                this._renderAllQuickPickItem(container);
                                this._store.add(windowTitle.onDidChange(this._updateFromWindowTitle, this));
                            }
                            _updateFromWindowTitle() {
                                var _a;
                                // label: just workspace name and optional decorations
                                const { prefix, suffix } = windowTitle.getTitleDecorations();
                                let label = windowTitle.workspaceName;
                                if (prefix) {
                                    label = (0, nls_1.localize)('label1', "{0} {1}", prefix, label);
                                }
                                if (suffix) {
                                    label = (0, nls_1.localize)('label2', "{0} {1}", label, suffix);
                                }
                                this.workspaceTitle.innerText = label;
                                // tooltip: full windowTitle
                                const kb = (_a = keybindingService.lookupKeybinding(action.id)) === null || _a === void 0 ? void 0 : _a.getLabel();
                                const title = kb
                                    ? (0, nls_1.localize)('title', "Search {0} ({1}) \u2014 {2}", windowTitle.workspaceName, kb, windowTitle.value)
                                    : (0, nls_1.localize)('title2', "Search {0} \u2014 {1}", windowTitle.workspaceName, windowTitle.value);
                                this._applyUpdateTooltip(title);
                            }
                            _renderAllQuickPickItem(parent) {
                                const container = document.createElement('span');
                                container.classList.add('all-options');
                                parent.appendChild(container);
                                const action = new actions_1.Action('all', (0, nls_1.localize)('all', "Show Search Modes..."), codicons_1.Codicon.chevronDown.classNames, true, () => {
                                    quickInputService.quickAccess.show('?');
                                });
                                const dropdown = new actionViewItems_1.ActionViewItem(undefined, action, { icon: true, label: false, hoverDelegate });
                                dropdown.render(container);
                                this._store.add(dropdown);
                                this._store.add(action);
                            }
                        }
                        return instantiationService.createInstance(InputLikeViewItem, action, { hoverDelegate });
                    }
                    return (0, menuEntryActionViewItem_1.createActionViewItem)(instantiationService, action, { hoverDelegate });
                }
            });
            const menu = this._disposables.add(menuService.createMenu(actions_2.MenuId.CommandCenter, contextKeyService));
            const menuDisposables = this._disposables.add(new lifecycle_1.DisposableStore());
            const menuUpdater = () => {
                menuDisposables.clear();
                const actions = [];
                menuDisposables.add((0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, undefined, actions));
                titleToolbar.setActions(actions);
            };
            menuUpdater();
            this._disposables.add(menu.onDidChange(menuUpdater));
            this._disposables.add(quickInputService.onShow(this._setVisibility.bind(this, false)));
            this._disposables.add(quickInputService.onHide(this._setVisibility.bind(this, true)));
        }
        _setVisibility(show) {
            this.element.classList.toggle('hide', !show);
            this._onDidChangeVisibility.fire();
        }
        dispose() {
            this._disposables.dispose();
        }
    };
    CommandCenterControl = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, actions_2.IMenuService),
        __param(5, quickInput_1.IQuickInputService),
        __param(6, hover_1.IHoverService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, keybinding_1.IKeybindingService)
    ], CommandCenterControl);
    exports.CommandCenterControl = CommandCenterControl;
    // --- theme colors
    // foreground (inactive and active)
    colors.registerColor('commandCenter.foreground', { dark: theme_1.TITLE_BAR_ACTIVE_FOREGROUND, hcDark: theme_1.TITLE_BAR_ACTIVE_FOREGROUND, light: theme_1.TITLE_BAR_ACTIVE_FOREGROUND, hcLight: theme_1.TITLE_BAR_ACTIVE_FOREGROUND }, (0, nls_1.localize)('commandCenter-foreground', "Foreground color of the command center"), false);
    colors.registerColor('commandCenter.activeForeground', { dark: theme_1.MENUBAR_SELECTION_FOREGROUND, hcDark: theme_1.MENUBAR_SELECTION_FOREGROUND, light: theme_1.MENUBAR_SELECTION_FOREGROUND, hcLight: theme_1.MENUBAR_SELECTION_FOREGROUND }, (0, nls_1.localize)('commandCenter-activeForeground', "Active foreground color of the command center"), false);
    // background (inactive and active)
    colors.registerColor('commandCenter.background', { dark: null, hcDark: null, light: null, hcLight: null }, (0, nls_1.localize)('commandCenter-background', "Background color of the command center"), false);
    const activeBackground = colors.registerColor('commandCenter.activeBackground', { dark: theme_1.MENUBAR_SELECTION_BACKGROUND, hcDark: theme_1.MENUBAR_SELECTION_BACKGROUND, light: theme_1.MENUBAR_SELECTION_BACKGROUND, hcLight: theme_1.MENUBAR_SELECTION_BACKGROUND }, (0, nls_1.localize)('commandCenter-activeBackground', "Active background color of the command center"), false);
    // border: defaults to active background
    colors.registerColor('commandCenter.border', { dark: activeBackground, hcDark: colors.inputBorder, light: activeBackground, hcLight: colors.inputBorder }, (0, nls_1.localize)('commandCenter-border', "Border color of the command center"), false);
});
//# sourceMappingURL=commandCenterControl.js.map