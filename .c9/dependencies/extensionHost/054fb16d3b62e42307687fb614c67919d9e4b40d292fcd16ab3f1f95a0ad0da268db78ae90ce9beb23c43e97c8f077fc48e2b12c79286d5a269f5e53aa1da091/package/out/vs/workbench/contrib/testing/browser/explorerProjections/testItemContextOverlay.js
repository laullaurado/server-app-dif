/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testingContextKeys"], function (require, exports, testProfileService_1, testId_1, testingContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getTestItemContextOverlay = void 0;
    const getTestItemContextOverlay = (test, capabilities) => {
        if (!test) {
            return [];
        }
        const testId = testId_1.TestId.fromString(test.item.extId);
        return [
            [testingContextKeys_1.TestingContextKeys.testItemExtId.key, testId.localId],
            [testingContextKeys_1.TestingContextKeys.controllerId.key, test.controllerId],
            [testingContextKeys_1.TestingContextKeys.testItemHasUri.key, !!test.item.uri],
            ...(0, testProfileService_1.capabilityContextKeys)(capabilities),
        ];
    };
    exports.getTestItemContextOverlay = getTestItemContextOverlay;
});
//# sourceMappingURL=testItemContextOverlay.js.map