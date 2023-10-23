/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VSDataTransfer = exports.createFileDataTransferItem = exports.createStringDataTransferItem = void 0;
    function createStringDataTransferItem(stringOrPromise) {
        return {
            asString: async () => stringOrPromise,
            asFile: () => undefined,
            value: typeof stringOrPromise === 'string' ? stringOrPromise : undefined,
        };
    }
    exports.createStringDataTransferItem = createStringDataTransferItem;
    function createFileDataTransferItem(fileName, uri, data) {
        return {
            asString: async () => '',
            asFile: () => ({ name: fileName, uri, data }),
            value: undefined,
        };
    }
    exports.createFileDataTransferItem = createFileDataTransferItem;
    class VSDataTransfer {
        constructor() {
            this._entries = new Map();
        }
        get size() {
            return this._entries.size;
        }
        has(mimeType) {
            return this._entries.has(this.toKey(mimeType));
        }
        get(mimeType) {
            var _a;
            return (_a = this._entries.get(this.toKey(mimeType))) === null || _a === void 0 ? void 0 : _a[0];
        }
        append(mimeType, value) {
            const existing = this._entries.get(mimeType);
            if (existing) {
                existing.push(value);
            }
            else {
                this._entries.set(this.toKey(mimeType), [value]);
            }
        }
        replace(mimeType, value) {
            this._entries.set(this.toKey(mimeType), [value]);
        }
        delete(mimeType) {
            this._entries.delete(this.toKey(mimeType));
        }
        *entries() {
            for (const [mine, items] of this._entries.entries()) {
                for (const item of items) {
                    yield [mine, item];
                }
            }
        }
        values() {
            return Array.from(this._entries.values()).flat();
        }
        forEach(f) {
            for (const [mime, item] of this.entries()) {
                f(item, mime);
            }
        }
        toKey(mimeType) {
            return mimeType.toLowerCase();
        }
    }
    exports.VSDataTransfer = VSDataTransfer;
});
//# sourceMappingURL=dataTransfer.js.map