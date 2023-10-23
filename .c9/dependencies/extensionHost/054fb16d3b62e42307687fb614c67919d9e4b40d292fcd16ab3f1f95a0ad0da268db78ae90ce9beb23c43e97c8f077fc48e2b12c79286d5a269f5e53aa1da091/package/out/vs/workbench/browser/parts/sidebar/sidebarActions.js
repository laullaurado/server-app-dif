/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/common/actions", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/css!./media/sidebarpart"], function (require, exports, nls_1, actions_1, layoutService_1, actions_2, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FocusSideBarAction = void 0;
    class FocusSideBarAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.focusSideBar',
                title: { value: (0, nls_1.localize)('focusSideBar', "Focus into Primary Side Bar"), original: 'Focus into Primary Side Bar' },
                category: actions_2.CATEGORIES.View,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: null,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 21 /* KeyCode.Digit0 */
                }
            });
        }
        async run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            // Show side bar
            if (!layoutService.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */)) {
                layoutService.setPartHidden(false, "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
                return;
            }
            // Focus into active viewlet
            const viewlet = paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
            if (viewlet) {
                viewlet.focus();
            }
        }
    }
    exports.FocusSideBarAction = FocusSideBarAction;
    (0, actions_1.registerAction2)(FocusSideBarAction);
});
//# sourceMappingURL=sidebarActions.js.map