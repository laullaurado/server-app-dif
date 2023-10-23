/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.INotebookExecutionService = exports.CellExecutionUpdateType = void 0;
    var CellExecutionUpdateType;
    (function (CellExecutionUpdateType) {
        CellExecutionUpdateType[CellExecutionUpdateType["Output"] = 1] = "Output";
        CellExecutionUpdateType[CellExecutionUpdateType["OutputItems"] = 2] = "OutputItems";
        CellExecutionUpdateType[CellExecutionUpdateType["ExecutionState"] = 3] = "ExecutionState";
    })(CellExecutionUpdateType = exports.CellExecutionUpdateType || (exports.CellExecutionUpdateType = {}));
    exports.INotebookExecutionService = (0, instantiation_1.createDecorator)('INotebookExecutionService');
});
//# sourceMappingURL=notebookExecutionService.js.map