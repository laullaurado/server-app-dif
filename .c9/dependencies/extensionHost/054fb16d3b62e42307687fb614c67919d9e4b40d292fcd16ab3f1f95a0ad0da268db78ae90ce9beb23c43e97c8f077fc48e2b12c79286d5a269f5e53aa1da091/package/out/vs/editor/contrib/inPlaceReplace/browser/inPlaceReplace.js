/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/editor/contrib/editorState/browser/editorState", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/editorContextKeys", "vs/editor/common/model/textModel", "vs/editor/common/services/editorWorker", "vs/editor/common/core/editorColorRegistry", "vs/nls", "vs/platform/theme/common/themeService", "./inPlaceReplaceCommand"], function (require, exports, async_1, errors_1, editorState_1, editorExtensions_1, range_1, selection_1, editorContextKeys_1, textModel_1, editorWorker_1, editorColorRegistry_1, nls, themeService_1, inPlaceReplaceCommand_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let InPlaceReplaceController = class InPlaceReplaceController {
        constructor(editor, editorWorkerService) {
            this.editor = editor;
            this.editorWorkerService = editorWorkerService;
            this.decorations = this.editor.createDecorationsCollection();
        }
        static get(editor) {
            return editor.getContribution(InPlaceReplaceController.ID);
        }
        dispose() {
        }
        run(source, up) {
            // cancel any pending request
            if (this.currentRequest) {
                this.currentRequest.cancel();
            }
            const editorSelection = this.editor.getSelection();
            const model = this.editor.getModel();
            if (!model || !editorSelection) {
                return undefined;
            }
            let selection = editorSelection;
            if (selection.startLineNumber !== selection.endLineNumber) {
                // Can't accept multiline selection
                return undefined;
            }
            const state = new editorState_1.EditorState(this.editor, 1 /* CodeEditorStateFlag.Value */ | 4 /* CodeEditorStateFlag.Position */);
            const modelURI = model.uri;
            if (!this.editorWorkerService.canNavigateValueSet(modelURI)) {
                return Promise.resolve(undefined);
            }
            this.currentRequest = (0, async_1.createCancelablePromise)(token => this.editorWorkerService.navigateValueSet(modelURI, selection, up));
            return this.currentRequest.then(result => {
                if (!result || !result.range || !result.value) {
                    // No proper result
                    return;
                }
                if (!state.validate(this.editor)) {
                    // state has changed
                    return;
                }
                // Selection
                let editRange = range_1.Range.lift(result.range);
                let highlightRange = result.range;
                let diff = result.value.length - (selection.endColumn - selection.startColumn);
                // highlight
                highlightRange = {
                    startLineNumber: highlightRange.startLineNumber,
                    startColumn: highlightRange.startColumn,
                    endLineNumber: highlightRange.endLineNumber,
                    endColumn: highlightRange.startColumn + result.value.length
                };
                if (diff > 1) {
                    selection = new selection_1.Selection(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn + diff - 1);
                }
                // Insert new text
                const command = new inPlaceReplaceCommand_1.InPlaceReplaceCommand(editRange, selection, result.value);
                this.editor.pushUndoStop();
                this.editor.executeCommand(source, command);
                this.editor.pushUndoStop();
                // add decoration
                this.decorations.set([{
                        range: highlightRange,
                        options: InPlaceReplaceController.DECORATION
                    }]);
                // remove decoration after delay
                if (this.decorationRemover) {
                    this.decorationRemover.cancel();
                }
                this.decorationRemover = (0, async_1.timeout)(350);
                this.decorationRemover.then(() => this.decorations.clear()).catch(errors_1.onUnexpectedError);
            }).catch(errors_1.onUnexpectedError);
        }
    };
    InPlaceReplaceController.ID = 'editor.contrib.inPlaceReplaceController';
    InPlaceReplaceController.DECORATION = textModel_1.ModelDecorationOptions.register({
        description: 'in-place-replace',
        className: 'valueSetReplacement'
    });
    InPlaceReplaceController = __decorate([
        __param(1, editorWorker_1.IEditorWorkerService)
    ], InPlaceReplaceController);
    class InPlaceReplaceUp extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.inPlaceReplace.up',
                label: nls.localize('InPlaceReplaceAction.previous.label', "Replace with Previous Value"),
                alias: 'Replace with Previous Value',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 82 /* KeyCode.Comma */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const controller = InPlaceReplaceController.get(editor);
            if (!controller) {
                return Promise.resolve(undefined);
            }
            return controller.run(this.id, true);
        }
    }
    class InPlaceReplaceDown extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.inPlaceReplace.down',
                label: nls.localize('InPlaceReplaceAction.next.label', "Replace with Next Value"),
                alias: 'Replace with Next Value',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 84 /* KeyCode.Period */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const controller = InPlaceReplaceController.get(editor);
            if (!controller) {
                return Promise.resolve(undefined);
            }
            return controller.run(this.id, false);
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(InPlaceReplaceController.ID, InPlaceReplaceController);
    (0, editorExtensions_1.registerEditorAction)(InPlaceReplaceUp);
    (0, editorExtensions_1.registerEditorAction)(InPlaceReplaceDown);
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const border = theme.getColor(editorColorRegistry_1.editorBracketMatchBorder);
        if (border) {
            collector.addRule(`.monaco-editor.vs .valueSetReplacement { outline: solid 2px ${border}; }`);
        }
    });
});
//# sourceMappingURL=inPlaceReplace.js.map