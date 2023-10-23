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
define(["require", "exports", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/common/actions", "vs/nls", "vs/platform/theme/common/themeService", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/css!./notebookKernelActionViewItem"], function (require, exports, actionViewItems_1, actions_1, nls_1, themeService_1, notebookIcons_1, notebookKernelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebooKernelActionViewItem = void 0;
    let NotebooKernelActionViewItem = class NotebooKernelActionViewItem extends actionViewItems_1.ActionViewItem {
        constructor(actualAction, _editor, _notebookKernelService) {
            super(undefined, new actions_1.Action('fakeAction', undefined, themeService_1.ThemeIcon.asClassName(notebookIcons_1.selectKernelIcon), true, (event) => actualAction.run(event)), { label: false, icon: true });
            this._editor = _editor;
            this._notebookKernelService = _notebookKernelService;
            this._register(_editor.onDidChangeModel(this._update, this));
            this._register(_notebookKernelService.onDidChangeNotebookAffinity(this._update, this));
            this._register(_notebookKernelService.onDidChangeSelectedNotebooks(this._update, this));
            this._register(_notebookKernelService.onDidChangeSourceActions(this._update, this));
        }
        render(container) {
            this._update();
            super.render(container);
            container.classList.add('kernel-action-view-item');
            this._kernelLabel = document.createElement('a');
            container.appendChild(this._kernelLabel);
            this.updateLabel();
        }
        updateLabel() {
            if (this._kernelLabel) {
                this._kernelLabel.classList.add('kernel-label');
                this._kernelLabel.innerText = this._action.label;
                this._kernelLabel.title = this._action.tooltip;
            }
        }
        _update() {
            const notebook = this._editor.textModel;
            if (!notebook) {
                this._resetAction();
                return;
            }
            const runningActions = this._notebookKernelService.getRunningSourceActions();
            if (runningActions.length) {
                return this._updateActionFromSourceAction(runningActions[0] /** TODO handle multiple actions state */, true);
            }
            const info = this._notebookKernelService.getMatchingKernel(notebook);
            if (info.all.length === 0) {
                return this._updateActionsFromSourceActions();
            }
            this._updateActionFromKernelInfo(info);
        }
        _updateActionFromSourceAction(sourceAction, running) {
            const action = sourceAction.action;
            this.action.class = running ? themeService_1.ThemeIcon.asClassName(themeService_1.ThemeIcon.modify(notebookIcons_1.executingStateIcon, 'spin')) : themeService_1.ThemeIcon.asClassName(notebookIcons_1.selectKernelIcon);
            this.updateClass();
            this._action.label = action.label;
            this._action.enabled = true;
        }
        _updateActionsFromSourceActions() {
            this._action.enabled = true;
            const sourceActions = this._notebookKernelService.getSourceActions();
            if (sourceActions.length === 1) {
                // exact one action
                this._updateActionFromSourceAction(sourceActions[0], false);
            }
            else {
                this._action.class = themeService_1.ThemeIcon.asClassName(notebookIcons_1.selectKernelIcon);
                this._action.label = (0, nls_1.localize)('select', "Select Kernel");
                this._action.tooltip = '';
            }
        }
        _updateActionFromKernelInfo(info) {
            var _a, _b, _c;
            this._action.enabled = true;
            this._action.class = themeService_1.ThemeIcon.asClassName(notebookIcons_1.selectKernelIcon);
            const selectedOrSuggested = (_a = info.selected) !== null && _a !== void 0 ? _a : (info.suggestions.length === 1 ? info.suggestions[0] : undefined);
            if (selectedOrSuggested) {
                // selected or suggested kernel
                this._action.label = this._generateKenrelLabel(selectedOrSuggested);
                this._action.tooltip = (_c = (_b = selectedOrSuggested.description) !== null && _b !== void 0 ? _b : selectedOrSuggested.detail) !== null && _c !== void 0 ? _c : '';
                if (!info.selected) {
                    // special UI for selected kernel?
                }
            }
            else {
                // many kernels or no kernels
                this._action.label = (0, nls_1.localize)('select', "Select Kernel");
                this._action.tooltip = '';
            }
        }
        _generateKenrelLabel(kernel) {
            return kernel.label;
        }
        _resetAction() {
            this._action.enabled = false;
            this._action.label = '';
            this._action.class = '';
        }
    };
    NotebooKernelActionViewItem = __decorate([
        __param(2, notebookKernelService_1.INotebookKernelService)
    ], NotebooKernelActionViewItem);
    exports.NotebooKernelActionViewItem = NotebooKernelActionViewItem;
});
//# sourceMappingURL=notebookKernelActionViewItem.js.map