/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/mime"], function (require, exports, assert, mime_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Mime', () => {
        test('normalize', () => {
            assert.strictEqual((0, mime_1.normalizeMimeType)('invalid'), 'invalid');
            assert.strictEqual((0, mime_1.normalizeMimeType)('invalid', true), undefined);
            assert.strictEqual((0, mime_1.normalizeMimeType)('Text/plain'), 'text/plain');
            assert.strictEqual((0, mime_1.normalizeMimeType)('Text/pläin'), 'text/pläin');
            assert.strictEqual((0, mime_1.normalizeMimeType)('Text/plain;UPPER'), 'text/plain;UPPER');
            assert.strictEqual((0, mime_1.normalizeMimeType)('Text/plain;lower'), 'text/plain;lower');
        });
    });
});
//# sourceMappingURL=mime.test.js.map