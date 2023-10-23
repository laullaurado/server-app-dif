/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/contrib/audioCues/browser/observable", "vs/workbench/contrib/mergeEditor/browser/model"], function (require, exports, lifecycle_1, observable_1, model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorGutter = void 0;
    class EditorGutter extends lifecycle_1.Disposable {
        constructor(_editor, _domNode, itemProvider) {
            super();
            this._editor = _editor;
            this._domNode = _domNode;
            this.itemProvider = itemProvider;
            this.scrollTop = (0, observable_1.observableFromEvent)(this._editor.onDidScrollChange, (e) => this._editor.getScrollTop());
            this.modelAttached = (0, observable_1.observableFromEvent)(this._editor.onDidChangeModel, (e) => this._editor.hasModel());
            this.viewZoneChanges = new observable_1.ObservableValue(0, 'counter');
            this.views = new Map();
            this._domNode.className = 'gutter';
            this._register((0, observable_1.autorun)((reader) => this.render(reader), 'Render'));
            this._editor.onDidChangeViewZones(e => {
                this.viewZoneChanges.set(this.viewZoneChanges.get() + 1, undefined);
            });
        }
        render(reader) {
            if (!this.modelAttached.read(reader)) {
                return;
            }
            this.viewZoneChanges.read(reader);
            const scrollTop = this.scrollTop.read(reader);
            const visibleRanges = this._editor.getVisibleRanges();
            const unusedIds = new Set(this.views.keys());
            if (visibleRanges.length > 0) {
                const visibleRange = visibleRanges[0];
                const visibleRange2 = new model_1.LineRange(visibleRange.startLineNumber, visibleRange.endLineNumber - visibleRange.startLineNumber);
                const gutterItems = this.itemProvider.getIntersectingGutterItems(visibleRange2, reader);
                const lineHeight = this._editor.getOptions().get(60 /* EditorOption.lineHeight */);
                for (const gutterItem of gutterItems) {
                    if (!gutterItem.range.touches(visibleRange2)) {
                        continue;
                    }
                    unusedIds.delete(gutterItem.id);
                    let view = this.views.get(gutterItem.id);
                    if (!view) {
                        const viewDomNode = document.createElement('div');
                        viewDomNode.className = 'gutter-item';
                        this._domNode.appendChild(viewDomNode);
                        const itemView = this.itemProvider.createView(gutterItem, viewDomNode);
                        view = new ManagedGutterItemView(itemView, viewDomNode);
                        this.views.set(gutterItem.id, view);
                    }
                    else {
                        view.gutterItemView.update(gutterItem);
                    }
                    const top = (gutterItem.range.startLineNumber === 1
                        ? -lineHeight
                        : this._editor.getTopForLineNumber(gutterItem.range.startLineNumber - 1)) -
                        scrollTop +
                        lineHeight;
                    const bottom = (gutterItem.range.endLineNumberExclusive <= this._editor.getModel().getLineCount()
                        ? this._editor.getTopForLineNumber(gutterItem.range.endLineNumberExclusive)
                        : this._editor.getTopForLineNumber(gutterItem.range.endLineNumberExclusive - 1) + lineHeight) - scrollTop;
                    const height = bottom - top;
                    view.domNode.style.top = `${top}px`;
                    view.domNode.style.height = `${height}px`;
                    view.gutterItemView.layout(top, height, 0, -1);
                }
            }
            for (const id of unusedIds) {
                const view = this.views.get(id);
                view.gutterItemView.dispose();
                this._domNode.removeChild(view.domNode);
                this.views.delete(id);
            }
        }
    }
    exports.EditorGutter = EditorGutter;
    class ManagedGutterItemView {
        constructor(gutterItemView, domNode) {
            this.gutterItemView = gutterItemView;
            this.domNode = domNode;
        }
    }
});
//# sourceMappingURL=editorGutter.js.map