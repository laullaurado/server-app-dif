/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/services/search/common/search", "vs/workbench/services/search/common/searchService"], function (require, exports, extensions_1, search_1, searchService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(search_1.ISearchService, searchService_1.SearchService, true);
});
//# sourceMappingURL=searchService.js.map