/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/marshalling", "vs/workbench/contrib/mergeEditor/browser/mergeEditorInput"], function (require, exports, errors_1, marshalling_1, mergeEditorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeEditorSerializer = void 0;
    class MergeEditorSerializer {
        canSerialize() {
            return true;
        }
        serialize(editor) {
            return JSON.stringify(editor.toJSON());
        }
        deserialize(instantiationService, raw) {
            try {
                const data = (0, marshalling_1.parse)(raw);
                return instantiationService.createInstance(mergeEditorInput_1.MergeEditorInput, data.anchestor, new mergeEditorInput_1.MergeEditorInputData(data.inputOne.uri, data.inputOne.detail, data.inputOne.description), new mergeEditorInput_1.MergeEditorInputData(data.inputTwo.uri, data.inputTwo.detail, data.inputTwo.description), data.result);
            }
            catch (err) {
                (0, errors_1.onUnexpectedError)(err);
                return undefined;
            }
        }
    }
    exports.MergeEditorSerializer = MergeEditorSerializer;
});
//# sourceMappingURL=mergeEditorSerializer.js.map