/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network"], function (require, exports, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getRemoteServerRootPath = exports.getRemoteName = exports.getRemoteAuthority = void 0;
    function getRemoteAuthority(uri) {
        return uri.scheme === network_1.Schemas.vscodeRemote ? uri.authority : undefined;
    }
    exports.getRemoteAuthority = getRemoteAuthority;
    function getRemoteName(authority) {
        if (!authority) {
            return undefined;
        }
        const pos = authority.indexOf('+');
        if (pos < 0) {
            // e.g. localhost:8000
            return authority;
        }
        return authority.substr(0, pos);
    }
    exports.getRemoteName = getRemoteName;
    /**
     * The root path to use when accessing the remote server. The path contains the quality and commit of the current build.
     * @param product
     * @returns
     */
    function getRemoteServerRootPath(product) {
        var _a, _b;
        return `/${(_a = product.quality) !== null && _a !== void 0 ? _a : 'oss'}-${(_b = product.commit) !== null && _b !== void 0 ? _b : 'dev'}`;
    }
    exports.getRemoteServerRootPath = getRemoteServerRootPath;
});
//# sourceMappingURL=remoteHosts.js.map