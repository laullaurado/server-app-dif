/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer"], function (require, exports, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DataTransferCache = void 0;
    class DataTransferCache {
        constructor() {
            this.requestIdPool = 0;
            this.dataTransfers = new Map();
        }
        add(dataTransfer) {
            const requestId = this.requestIdPool++;
            this.dataTransfers.set(requestId, [...dataTransfer.values()]);
            return {
                id: requestId,
                dispose: () => {
                    this.dataTransfers.delete(requestId);
                }
            };
        }
        async resolveDropFileData(requestId, dataItemIndex) {
            var _a;
            const entry = this.dataTransfers.get(requestId);
            if (!entry) {
                throw new Error('No data transfer found');
            }
            const file = (_a = entry[dataItemIndex]) === null || _a === void 0 ? void 0 : _a.asFile();
            if (!file) {
                throw new Error('No file item found in data transfer');
            }
            return buffer_1.VSBuffer.wrap(await file.data());
        }
        dispose() {
            this.dataTransfers.clear();
        }
    }
    exports.DataTransferCache = DataTransferCache;
});
//# sourceMappingURL=dataTransferCache.js.map