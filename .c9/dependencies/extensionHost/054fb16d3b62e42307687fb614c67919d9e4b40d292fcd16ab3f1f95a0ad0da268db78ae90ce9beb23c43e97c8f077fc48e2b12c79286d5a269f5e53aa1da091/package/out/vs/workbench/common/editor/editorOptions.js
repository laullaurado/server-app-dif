/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/editor"], function (require, exports, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.applyTextEditorOptions = void 0;
    function applyTextEditorOptions(options, editor, scrollType) {
        var _a, _b, _c;
        let applied = false;
        // Restore view state if any
        const viewState = massageEditorViewState(options);
        if ((0, editor_1.isTextEditorViewState)(viewState)) {
            editor.restoreViewState(viewState);
            applied = true;
        }
        // Restore selection if any
        if (options.selection) {
            const range = {
                startLineNumber: options.selection.startLineNumber,
                startColumn: options.selection.startColumn,
                endLineNumber: (_a = options.selection.endLineNumber) !== null && _a !== void 0 ? _a : options.selection.startLineNumber,
                endColumn: (_b = options.selection.endColumn) !== null && _b !== void 0 ? _b : options.selection.startColumn
            };
            // Apply selection with a source so that listeners can
            // distinguish this selection change from others.
            // If no source is provided, set a default source to
            // signal this navigation.
            editor.setSelection(range, (_c = options.selectionSource) !== null && _c !== void 0 ? _c : "code.navigation" /* TextEditorSelectionSource.NAVIGATION */);
            // Reveal selection
            if (options.selectionRevealType === 2 /* TextEditorSelectionRevealType.NearTop */) {
                editor.revealRangeNearTop(range, scrollType);
            }
            else if (options.selectionRevealType === 3 /* TextEditorSelectionRevealType.NearTopIfOutsideViewport */) {
                editor.revealRangeNearTopIfOutsideViewport(range, scrollType);
            }
            else if (options.selectionRevealType === 1 /* TextEditorSelectionRevealType.CenterIfOutsideViewport */) {
                editor.revealRangeInCenterIfOutsideViewport(range, scrollType);
            }
            else {
                editor.revealRangeInCenter(range, scrollType);
            }
            applied = true;
        }
        return applied;
    }
    exports.applyTextEditorOptions = applyTextEditorOptions;
    function massageEditorViewState(options) {
        // Without a selection or view state, just return immediately
        if (!options.selection || !options.viewState) {
            return options.viewState;
        }
        // Diff editor: since we have an explicit selection, clear the
        // cursor state from the modified side where the selection
        // applies. This avoids a redundant selection change event.
        const candidateDiffViewState = options.viewState;
        if (candidateDiffViewState.modified) {
            candidateDiffViewState.modified.cursorState = [];
            return candidateDiffViewState;
        }
        // Code editor: since we have an explicit selection, clear the
        // cursor state. This avoids a redundant selection change event.
        const candidateEditorViewState = options.viewState;
        if (candidateEditorViewState.cursorState) {
            candidateEditorViewState.cursorState = [];
        }
        return candidateEditorViewState;
    }
});
//# sourceMappingURL=editorOptions.js.map