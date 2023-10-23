/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/testing/common/testItemCollection"], function (require, exports, testItemCollection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getPrivateApiFor = exports.createPrivateApiFor = void 0;
    const eventPrivateApis = new WeakMap();
    const createPrivateApiFor = (impl, controllerId) => {
        const api = { controllerId };
        eventPrivateApis.set(impl, api);
        return api;
    };
    exports.createPrivateApiFor = createPrivateApiFor;
    /**
     * Gets the private API for a test item implementation. This implementation
     * is a managed object, but we keep a weakmap to avoid exposing any of the
     * internals to extensions.
     */
    const getPrivateApiFor = (impl) => {
        const api = eventPrivateApis.get(impl);
        if (!api) {
            throw new testItemCollection_1.InvalidTestItemError((impl === null || impl === void 0 ? void 0 : impl.id) || '<unknown>');
        }
        return api;
    };
    exports.getPrivateApiFor = getPrivateApiFor;
});
//# sourceMappingURL=extHostTestingPrivateApi.js.map