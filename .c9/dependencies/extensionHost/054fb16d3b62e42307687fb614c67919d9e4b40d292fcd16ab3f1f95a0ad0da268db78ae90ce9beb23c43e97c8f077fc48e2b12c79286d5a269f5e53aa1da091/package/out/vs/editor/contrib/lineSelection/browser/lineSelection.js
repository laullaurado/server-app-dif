/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/cursor/cursorMoveCommands", "vs/editor/common/editorContextKeys", "vs/nls"], function (require, exports, editorExtensions_1, cursorMoveCommands_1, editorContextKeys_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExpandLineSelectionAction = void 0;
    class ExpandLineSelectionAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'expandLineSelection',
                label: nls.localize('expandLineSelection', "Expand Line Selection"),
                alias: 'Expand Line Selection',
                precondition: undefined,
                kbOpts: {
                    weight: 0 /* KeybindingWeight.EditorCore */,
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 42 /* KeyCode.KeyL */
                },
            });
        }
        run(_accessor, editor, args) {
            args = args || {};
            if (!editor.hasModel()) {
                return;
            }
            const viewModel = editor._getViewModel();
            viewModel.model.pushStackElement();
            viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, cursorMoveCommands_1.CursorMoveCommands.expandLineSelection(viewModel, viewModel.getCursorStates()));
            viewModel.revealPrimaryCursor(args.source, true);
        }
    }
    exports.ExpandLineSelectionAction = ExpandLineSelectionAction;
    (0, editorExtensions_1.registerEditorAction)(ExpandLineSelectionAction);
});
//# sourceMappingURL=lineSelection.js.map