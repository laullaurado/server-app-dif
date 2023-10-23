/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/dataTransfer", "vs/base/common/uri"], function (require, exports, dataTransfer_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createFileDataTransferItemFromFile = exports.toVSDataTransfer = void 0;
    function toVSDataTransfer(dataTransfer) {
        const vsDataTransfer = new dataTransfer_1.VSDataTransfer();
        for (const item of dataTransfer.items) {
            const type = item.type;
            if (item.kind === 'string') {
                const asStringValue = new Promise(resolve => item.getAsString(resolve));
                vsDataTransfer.append(type, (0, dataTransfer_1.createStringDataTransferItem)(asStringValue));
            }
            else if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) {
                    vsDataTransfer.append(type, createFileDataTransferItemFromFile(file));
                }
            }
        }
        return vsDataTransfer;
    }
    exports.toVSDataTransfer = toVSDataTransfer;
    function createFileDataTransferItemFromFile(file) {
        const uri = file.path ? uri_1.URI.parse(file.path) : undefined;
        return (0, dataTransfer_1.createFileDataTransferItem)(file.name, uri, async () => {
            return new Uint8Array(await file.arrayBuffer());
        });
    }
    exports.createFileDataTransferItemFromFile = createFileDataTransferItemFromFile;
});
//# sourceMappingURL=dnd.js.map