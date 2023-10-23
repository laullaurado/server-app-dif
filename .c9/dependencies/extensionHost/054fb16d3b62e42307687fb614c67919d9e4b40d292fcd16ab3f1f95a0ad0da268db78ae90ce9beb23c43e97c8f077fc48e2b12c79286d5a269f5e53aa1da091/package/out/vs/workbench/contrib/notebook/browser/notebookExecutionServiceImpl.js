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
define(["require", "exports", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/log/common/log", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService"], function (require, exports, nls, commands_1, log_1, workspaceTrust_1, coreActions_1, notebookCommon_1, notebookExecutionStateService_1, notebookKernelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookExecutionService = void 0;
    let NotebookExecutionService = class NotebookExecutionService {
        constructor(_commandService, _notebookKernelService, _workspaceTrustRequestService, _logService, _notebookExecutionStateService) {
            this._commandService = _commandService;
            this._notebookKernelService = _notebookKernelService;
            this._workspaceTrustRequestService = _workspaceTrustRequestService;
            this._logService = _logService;
            this._notebookExecutionStateService = _notebookExecutionStateService;
        }
        async executeNotebookCells(notebook, cells) {
            const cellsArr = Array.from(cells);
            this._logService.debug(`NotebookExecutionService#executeNotebookCells ${JSON.stringify(cellsArr.map(c => c.handle))}`);
            const message = nls.localize('notebookRunTrust', "Executing a notebook cell will run code from this workspace.");
            const trust = await this._workspaceTrustRequestService.requestWorkspaceTrust({ message });
            if (!trust) {
                return;
            }
            // create cell executions
            const cellExecutions = [];
            for (const cell of cellsArr) {
                const cellExe = this._notebookExecutionStateService.getCellExecution(cell.uri);
                if (cell.cellKind !== notebookCommon_1.CellKind.Code || !!cellExe) {
                    continue;
                }
                cellExecutions.push([cell, this._notebookExecutionStateService.createCellExecution(notebook.uri, cell.handle)]);
            }
            let kernel = this._notebookKernelService.getSelectedOrSuggestedKernel(notebook);
            if (!kernel) {
                kernel = await this.resolveSourceActions(notebook);
            }
            if (!kernel) {
                await this._commandService.executeCommand(coreActions_1.SELECT_KERNEL_ID);
                kernel = this._notebookKernelService.getSelectedOrSuggestedKernel(notebook);
            }
            if (!kernel) {
                // clear all pending cell executions
                cellExecutions.forEach(cellExe => cellExe[1].complete({}));
                return;
            }
            // filter cell executions based on selected kernel
            const validCellExecutions = [];
            for (const [cell, cellExecution] of cellExecutions) {
                if (!kernel.supportedLanguages.includes(cell.language)) {
                    cellExecution.complete({});
                }
                else {
                    validCellExecutions.push(cellExecution);
                }
            }
            // request execution
            if (validCellExecutions.length > 0) {
                this._notebookKernelService.selectKernelForNotebook(kernel, notebook);
                await kernel.executeNotebookCellsRequest(notebook.uri, validCellExecutions.map(c => c.cellHandle));
                // the connecting state can change before the kernel resolves executeNotebookCellsRequest
                const unconfirmed = validCellExecutions.filter(exe => exe.state === notebookCommon_1.NotebookCellExecutionState.Unconfirmed);
                if (unconfirmed.length) {
                    this._logService.debug(`NotebookExecutionService#executeNotebookCells completing unconfirmed executions ${JSON.stringify(unconfirmed.map(exe => exe.cellHandle))}`);
                    unconfirmed.forEach(exe => exe.complete({}));
                }
            }
        }
        async resolveSourceActions(notebook) {
            let kernel;
            const info = this._notebookKernelService.getMatchingKernel(notebook);
            if (info.all.length === 0) {
                // no kernel at all
                const sourceActions = this._notebookKernelService.getSourceActions();
                if (sourceActions.length === 1) {
                    await sourceActions[0].runAction();
                    kernel = this._notebookKernelService.getSelectedOrSuggestedKernel(notebook);
                }
            }
            return kernel;
        }
        async cancelNotebookCellHandles(notebook, cells) {
            const cellsArr = Array.from(cells);
            this._logService.debug(`NotebookExecutionService#cancelNotebookCellHandles ${JSON.stringify(cellsArr)}`);
            const kernel = this._notebookKernelService.getSelectedOrSuggestedKernel(notebook);
            if (kernel) {
                await kernel.cancelNotebookCellExecution(notebook.uri, cellsArr);
            }
        }
        async cancelNotebookCells(notebook, cells) {
            this.cancelNotebookCellHandles(notebook, Array.from(cells, cell => cell.handle));
        }
        dispose() {
            var _a;
            (_a = this._activeProxyKernelExecutionToken) === null || _a === void 0 ? void 0 : _a.dispose(true);
        }
    };
    NotebookExecutionService = __decorate([
        __param(0, commands_1.ICommandService),
        __param(1, notebookKernelService_1.INotebookKernelService),
        __param(2, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(3, log_1.ILogService),
        __param(4, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], NotebookExecutionService);
    exports.NotebookExecutionService = NotebookExecutionService;
});
//# sourceMappingURL=notebookExecutionServiceImpl.js.map