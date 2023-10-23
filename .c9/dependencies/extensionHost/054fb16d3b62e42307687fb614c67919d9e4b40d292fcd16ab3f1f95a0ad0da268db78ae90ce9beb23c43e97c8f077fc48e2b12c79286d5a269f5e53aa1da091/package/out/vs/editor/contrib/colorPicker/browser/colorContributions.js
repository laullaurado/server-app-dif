/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/contrib/colorPicker/browser/colorDetector", "vs/editor/contrib/colorPicker/browser/colorHoverParticipant", "vs/editor/contrib/hover/browser/hover", "vs/editor/contrib/hover/browser/hoverTypes"], function (require, exports, lifecycle_1, editorExtensions_1, range_1, colorDetector_1, colorHoverParticipant_1, hover_1, hoverTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColorContribution = void 0;
    class ColorContribution extends lifecycle_1.Disposable {
        constructor(_editor) {
            super();
            this._editor = _editor;
            this._register(_editor.onMouseDown((e) => this.onMouseDown(e)));
        }
        dispose() {
            super.dispose();
        }
        onMouseDown(mouseEvent) {
            const target = mouseEvent.target;
            if (target.type !== 6 /* MouseTargetType.CONTENT_TEXT */) {
                return;
            }
            if (!target.detail.injectedText) {
                return;
            }
            if (target.detail.injectedText.options.attachedData !== colorDetector_1.ColorDecorationInjectedTextMarker) {
                return;
            }
            if (!target.range) {
                return;
            }
            const hoverController = this._editor.getContribution(hover_1.ModesHoverController.ID);
            if (!hoverController) {
                return;
            }
            if (!hoverController.isColorPickerVisible()) {
                const range = new range_1.Range(target.range.startLineNumber, target.range.startColumn + 1, target.range.endLineNumber, target.range.endColumn + 1);
                hoverController.showContentHover(range, 1 /* HoverStartMode.Immediate */, false);
            }
        }
    }
    exports.ColorContribution = ColorContribution;
    ColorContribution.ID = 'editor.contrib.colorContribution';
    ColorContribution.RECOMPUTE_TIME = 1000; // ms
    (0, editorExtensions_1.registerEditorContribution)(ColorContribution.ID, ColorContribution);
    hoverTypes_1.HoverParticipantRegistry.register(colorHoverParticipant_1.ColorHoverParticipant);
});
//# sourceMappingURL=colorContributions.js.map