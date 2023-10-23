/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/product/common/product", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/remote/electron-sandbox/remoteAuthorityResolverService"], function (require, exports, assert, product_1, remoteAuthorityResolver_1, remoteAuthorityResolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('RemoteAuthorityResolverService', () => {
        test('issue #147318: RemoteAuthorityResolverError keeps the same type', async () => {
            const productService = Object.assign({ _serviceBrand: undefined }, product_1.default);
            const service = new remoteAuthorityResolverService_1.RemoteAuthorityResolverService(productService);
            const result = service.resolveAuthority('test+x');
            service._setResolvedAuthorityError('test+x', new remoteAuthorityResolver_1.RemoteAuthorityResolverError('something', remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.TemporarilyNotAvailable));
            try {
                await result;
                assert.fail();
            }
            catch (err) {
                assert.strictEqual(remoteAuthorityResolver_1.RemoteAuthorityResolverError.isTemporarilyNotAvailable(err), true);
            }
        });
    });
});
//# sourceMappingURL=remoteAuthorityResolverService.test.js.map