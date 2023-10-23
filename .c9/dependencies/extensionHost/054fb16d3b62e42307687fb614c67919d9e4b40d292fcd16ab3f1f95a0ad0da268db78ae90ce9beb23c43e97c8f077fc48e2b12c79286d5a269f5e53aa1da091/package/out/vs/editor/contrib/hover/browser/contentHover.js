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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/hover/hoverWidget", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/languages", "vs/editor/contrib/hover/browser/hoverOperation", "vs/editor/contrib/hover/browser/hoverTypes", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/editor/contrib/suggest/browser/suggest", "vs/base/common/async", "vs/editor/common/editorContextKeys"], function (require, exports, dom, hoverWidget_1, arrays_1, lifecycle_1, position_1, range_1, textModel_1, languages_1, hoverOperation_1, hoverTypes_1, contextkey_1, instantiation_1, keybinding_1, suggest_1, async_1, editorContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContentHoverWidget = exports.ContentHoverController = void 0;
    const $ = dom.$;
    let ContentHoverController = class ContentHoverController extends lifecycle_1.Disposable {
        constructor(_editor, _instantiationService, _keybindingService) {
            super();
            this._editor = _editor;
            this._instantiationService = _instantiationService;
            this._keybindingService = _keybindingService;
            this._widget = this._register(this._instantiationService.createInstance(ContentHoverWidget, this._editor));
            this._decorations = this._editor.createDecorationsCollection();
            this._messages = [];
            this._messagesAreComplete = false;
            // Instantiate participants and sort them by `hoverOrdinal` which is relevant for rendering order.
            this._participants = [];
            for (const participant of hoverTypes_1.HoverParticipantRegistry.getAll()) {
                this._participants.push(this._instantiationService.createInstance(participant, this._editor));
            }
            this._participants.sort((p1, p2) => p1.hoverOrdinal - p2.hoverOrdinal);
            this._computer = new ContentHoverComputer(this._editor, this._participants);
            this._hoverOperation = this._register(new hoverOperation_1.HoverOperation(this._editor, this._computer));
            this._register(this._hoverOperation.onResult((result) => {
                this._withResult(result.value, result.isComplete, result.hasLoadingMessage);
            }));
            this._register(this._decorations.onDidChange(() => this._onModelDecorationsChanged()));
            this._register(dom.addStandardDisposableListener(this._widget.getDomNode(), 'keydown', (e) => {
                if (e.equals(9 /* KeyCode.Escape */)) {
                    this.hide();
                }
            }));
            this._register(languages_1.TokenizationRegistry.onDidChange(() => {
                if (this._widget.position && this._computer.anchor && this._messages.length > 0) {
                    this._widget.clear();
                    this._renderMessages(this._computer.anchor, this._messages);
                }
            }));
        }
        _onModelDecorationsChanged() {
            if (this._widget.position) {
                // The decorations have changed and the hover is visible,
                // we need to recompute the displayed text
                this._hoverOperation.cancel();
                if (!this._widget.isColorPickerVisible) { // TODO@Michel ensure that displayed text for other decorations is computed even if color picker is in place
                    this._hoverOperation.start(0 /* HoverStartMode.Delayed */);
                }
            }
        }
        maybeShowAt(mouseEvent) {
            const anchorCandidates = [];
            for (const participant of this._participants) {
                if (participant.suggestHoverAnchor) {
                    const anchor = participant.suggestHoverAnchor(mouseEvent);
                    if (anchor) {
                        anchorCandidates.push(anchor);
                    }
                }
            }
            const target = mouseEvent.target;
            if (target.type === 6 /* MouseTargetType.CONTENT_TEXT */) {
                anchorCandidates.push(new hoverTypes_1.HoverRangeAnchor(0, target.range));
            }
            if (target.type === 7 /* MouseTargetType.CONTENT_EMPTY */) {
                const epsilon = this._editor.getOption(45 /* EditorOption.fontInfo */).typicalHalfwidthCharacterWidth / 2;
                if (!target.detail.isAfterLines && typeof target.detail.horizontalDistanceToText === 'number' && target.detail.horizontalDistanceToText < epsilon) {
                    // Let hover kick in even when the mouse is technically in the empty area after a line, given the distance is small enough
                    anchorCandidates.push(new hoverTypes_1.HoverRangeAnchor(0, target.range));
                }
            }
            if (anchorCandidates.length === 0) {
                return false;
            }
            anchorCandidates.sort((a, b) => b.priority - a.priority);
            this._startShowingAt(anchorCandidates[0], 0 /* HoverStartMode.Delayed */, false);
            return true;
        }
        startShowingAtRange(range, mode, focus) {
            this._startShowingAt(new hoverTypes_1.HoverRangeAnchor(0, range), mode, focus);
        }
        _startShowingAt(anchor, mode, focus) {
            if (this._computer.anchor && this._computer.anchor.equals(anchor)) {
                // We have to show the widget at the exact same range as before, so no work is needed
                return;
            }
            this._hoverOperation.cancel();
            if (this._widget.position) {
                // The range might have changed, but the hover is visible
                // Instead of hiding it completely, filter out messages that are still in the new range and
                // kick off a new computation
                if (!this._computer.anchor || !anchor.canAdoptVisibleHover(this._computer.anchor, this._widget.position)) {
                    this.hide();
                }
                else {
                    const filteredMessages = this._messages.filter((m) => m.isValidForHoverAnchor(anchor));
                    if (filteredMessages.length === 0) {
                        this.hide();
                    }
                    else if (filteredMessages.length === this._messages.length && this._messagesAreComplete) {
                        // no change
                        return;
                    }
                    else {
                        this._renderMessages(anchor, filteredMessages);
                    }
                }
            }
            this._computer.anchor = anchor;
            this._computer.shouldFocus = focus;
            this._hoverOperation.start(mode);
        }
        hide() {
            this._computer.anchor = null;
            this._hoverOperation.cancel();
            this._widget.hide();
        }
        isColorPickerVisible() {
            return this._widget.isColorPickerVisible;
        }
        containsNode(node) {
            return this._widget.getDomNode().contains(node);
        }
        _addLoadingMessage(result) {
            if (this._computer.anchor) {
                for (const participant of this._participants) {
                    if (participant.createLoadingMessage) {
                        const loadingMessage = participant.createLoadingMessage(this._computer.anchor);
                        if (loadingMessage) {
                            return result.slice(0).concat([loadingMessage]);
                        }
                    }
                }
            }
            return result;
        }
        _withResult(result, isComplete, hasLoadingMessage) {
            this._messages = (hasLoadingMessage ? this._addLoadingMessage(result) : result);
            this._messagesAreComplete = isComplete;
            if (this._computer.anchor && this._messages.length > 0) {
                this._renderMessages(this._computer.anchor, this._messages);
            }
            else if (isComplete) {
                this.hide();
            }
        }
        _renderMessages(anchor, messages) {
            // update column from which to show
            let renderColumn = 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */;
            let highlightRange = messages[0].range;
            let forceShowAtRange = null;
            for (const msg of messages) {
                renderColumn = Math.min(renderColumn, msg.range.startColumn);
                highlightRange = range_1.Range.plusRange(highlightRange, msg.range);
                if (msg.forceShowAtRange) {
                    forceShowAtRange = msg.range;
                }
            }
            const disposables = new lifecycle_1.DisposableStore();
            const statusBar = disposables.add(new EditorHoverStatusBar(this._keybindingService));
            const fragment = document.createDocumentFragment();
            let colorPicker = null;
            const context = {
                fragment,
                statusBar,
                setColorPicker: (widget) => colorPicker = widget,
                onContentsChanged: () => this._widget.onContentsChanged(),
                hide: () => this.hide()
            };
            for (const participant of this._participants) {
                const hoverParts = messages.filter(msg => msg.owner === participant);
                if (hoverParts.length > 0) {
                    disposables.add(participant.renderHoverParts(context, hoverParts));
                }
            }
            if (statusBar.hasContent) {
                fragment.appendChild(statusBar.hoverElement);
            }
            if (fragment.hasChildNodes()) {
                if (highlightRange) {
                    this._decorations.set([{
                            range: highlightRange,
                            options: ContentHoverController._DECORATION_OPTIONS
                        }]);
                    disposables.add((0, lifecycle_1.toDisposable)(() => {
                        this._decorations.clear();
                    }));
                }
                this._widget.showAt(fragment, new ContentHoverVisibleData(colorPicker, forceShowAtRange ? forceShowAtRange.getStartPosition() : new position_1.Position(anchor.range.startLineNumber, renderColumn), forceShowAtRange ? forceShowAtRange : highlightRange, this._editor.getOption(54 /* EditorOption.hover */).above, this._computer.shouldFocus, disposables));
            }
            else {
                disposables.dispose();
            }
        }
    };
    ContentHoverController._DECORATION_OPTIONS = textModel_1.ModelDecorationOptions.register({
        description: 'content-hover-highlight',
        className: 'hoverHighlight'
    });
    ContentHoverController = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, keybinding_1.IKeybindingService)
    ], ContentHoverController);
    exports.ContentHoverController = ContentHoverController;
    class ContentHoverVisibleData {
        constructor(colorPicker, showAtPosition, showAtRange, preferAbove, stoleFocus, disposables) {
            this.colorPicker = colorPicker;
            this.showAtPosition = showAtPosition;
            this.showAtRange = showAtRange;
            this.preferAbove = preferAbove;
            this.stoleFocus = stoleFocus;
            this.disposables = disposables;
        }
    }
    let ContentHoverWidget = class ContentHoverWidget extends lifecycle_1.Disposable {
        constructor(_editor, _contextKeyService) {
            super();
            this._editor = _editor;
            this._contextKeyService = _contextKeyService;
            this.allowEditorOverflow = true;
            this._hoverVisibleKey = editorContextKeys_1.EditorContextKeys.hoverVisible.bindTo(this._contextKeyService);
            this._hover = this._register(new hoverWidget_1.HoverWidget());
            this._visibleData = null;
            this._register(this._editor.onDidLayoutChange(() => this._layout()));
            this._register(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(45 /* EditorOption.fontInfo */)) {
                    this._updateFont();
                }
            }));
            this._setVisibleData(null);
            this._layout();
            this._editor.addContentWidget(this);
        }
        /**
         * Returns `null` if the hover is not visible.
         */
        get position() {
            var _a, _b;
            return (_b = (_a = this._visibleData) === null || _a === void 0 ? void 0 : _a.showAtPosition) !== null && _b !== void 0 ? _b : null;
        }
        get isColorPickerVisible() {
            var _a;
            return Boolean((_a = this._visibleData) === null || _a === void 0 ? void 0 : _a.colorPicker);
        }
        dispose() {
            this._editor.removeContentWidget(this);
            if (this._visibleData) {
                this._visibleData.disposables.dispose();
            }
            super.dispose();
        }
        getId() {
            return ContentHoverWidget.ID;
        }
        getDomNode() {
            return this._hover.containerDomNode;
        }
        getPosition() {
            if (!this._visibleData) {
                return null;
            }
            let preferAbove = this._visibleData.preferAbove;
            if (!preferAbove && this._contextKeyService.getContextKeyValue(suggest_1.Context.Visible.key)) {
                // Prefer rendering above if the suggest widget is visible
                preferAbove = true;
            }
            return {
                position: this._visibleData.showAtPosition,
                range: this._visibleData.showAtRange,
                preference: (preferAbove
                    ? [1 /* ContentWidgetPositionPreference.ABOVE */, 2 /* ContentWidgetPositionPreference.BELOW */]
                    : [2 /* ContentWidgetPositionPreference.BELOW */, 1 /* ContentWidgetPositionPreference.ABOVE */]),
            };
        }
        _setVisibleData(visibleData) {
            if (this._visibleData) {
                this._visibleData.disposables.dispose();
            }
            this._visibleData = visibleData;
            this._hoverVisibleKey.set(!!this._visibleData);
            this._hover.containerDomNode.classList.toggle('hidden', !this._visibleData);
        }
        _layout() {
            const height = Math.max(this._editor.getLayoutInfo().height / 4, 250);
            const { fontSize, lineHeight } = this._editor.getOption(45 /* EditorOption.fontInfo */);
            this._hover.contentsDomNode.style.fontSize = `${fontSize}px`;
            this._hover.contentsDomNode.style.lineHeight = `${lineHeight / fontSize}`;
            this._hover.contentsDomNode.style.maxHeight = `${height}px`;
            this._hover.contentsDomNode.style.maxWidth = `${Math.max(this._editor.getLayoutInfo().width * 0.66, 500)}px`;
        }
        _updateFont() {
            const codeClasses = Array.prototype.slice.call(this._hover.contentsDomNode.getElementsByClassName('code'));
            codeClasses.forEach(node => this._editor.applyFontInfo(node));
        }
        showAt(node, visibleData) {
            this._setVisibleData(visibleData);
            this._hover.contentsDomNode.textContent = '';
            this._hover.contentsDomNode.appendChild(node);
            this._hover.contentsDomNode.style.paddingBottom = '';
            this._updateFont();
            this._editor.layoutContentWidget(this);
            this.onContentsChanged();
            // Simply force a synchronous render on the editor
            // such that the widget does not really render with left = '0px'
            this._editor.render();
            // See https://github.com/microsoft/vscode/issues/140339
            // TODO: Doing a second layout of the hover after force rendering the editor
            this._editor.layoutContentWidget(this);
            this.onContentsChanged();
            if (visibleData.stoleFocus) {
                this._hover.containerDomNode.focus();
            }
            if (visibleData.colorPicker) {
                visibleData.colorPicker.layout();
            }
        }
        hide() {
            if (this._visibleData) {
                const stoleFocus = this._visibleData.stoleFocus;
                this._setVisibleData(null);
                this._editor.layoutContentWidget(this);
                if (stoleFocus) {
                    this._editor.focus();
                }
            }
        }
        onContentsChanged() {
            this._hover.onContentsChanged();
            const scrollDimensions = this._hover.scrollbar.getScrollDimensions();
            const hasHorizontalScrollbar = (scrollDimensions.scrollWidth > scrollDimensions.width);
            if (hasHorizontalScrollbar) {
                // There is just a horizontal scrollbar
                const extraBottomPadding = `${this._hover.scrollbar.options.horizontalScrollbarSize}px`;
                if (this._hover.contentsDomNode.style.paddingBottom !== extraBottomPadding) {
                    this._hover.contentsDomNode.style.paddingBottom = extraBottomPadding;
                    this._editor.layoutContentWidget(this);
                    this._hover.onContentsChanged();
                }
            }
        }
        clear() {
            this._hover.contentsDomNode.textContent = '';
        }
    };
    ContentHoverWidget.ID = 'editor.contrib.contentHoverWidget';
    ContentHoverWidget = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], ContentHoverWidget);
    exports.ContentHoverWidget = ContentHoverWidget;
    let EditorHoverStatusBar = class EditorHoverStatusBar extends lifecycle_1.Disposable {
        constructor(_keybindingService) {
            super();
            this._keybindingService = _keybindingService;
            this._hasContent = false;
            this.hoverElement = $('div.hover-row.status-bar');
            this.actionsElement = dom.append(this.hoverElement, $('div.actions'));
        }
        get hasContent() {
            return this._hasContent;
        }
        addAction(actionOptions) {
            const keybinding = this._keybindingService.lookupKeybinding(actionOptions.commandId);
            const keybindingLabel = keybinding ? keybinding.getLabel() : null;
            this._hasContent = true;
            return this._register(hoverWidget_1.HoverAction.render(this.actionsElement, actionOptions, keybindingLabel));
        }
        append(element) {
            const result = dom.append(this.actionsElement, element);
            this._hasContent = true;
            return result;
        }
    };
    EditorHoverStatusBar = __decorate([
        __param(0, keybinding_1.IKeybindingService)
    ], EditorHoverStatusBar);
    class ContentHoverComputer {
        constructor(_editor, _participants) {
            this._editor = _editor;
            this._participants = _participants;
            this._anchor = null;
            this._shouldFocus = false;
        }
        get anchor() { return this._anchor; }
        set anchor(value) { this._anchor = value; }
        get shouldFocus() { return this._shouldFocus; }
        set shouldFocus(value) { this._shouldFocus = value; }
        static _getLineDecorations(editor, anchor) {
            if (anchor.type !== 1 /* HoverAnchorType.Range */) {
                return [];
            }
            const model = editor.getModel();
            const lineNumber = anchor.range.startLineNumber;
            if (lineNumber > model.getLineCount()) {
                // invalid line
                return [];
            }
            const maxColumn = model.getLineMaxColumn(lineNumber);
            return editor.getLineDecorations(lineNumber).filter((d) => {
                if (d.options.isWholeLine) {
                    return true;
                }
                const startColumn = (d.range.startLineNumber === lineNumber) ? d.range.startColumn : 1;
                const endColumn = (d.range.endLineNumber === lineNumber) ? d.range.endColumn : maxColumn;
                if (d.options.showIfCollapsed) {
                    // Relax check around `showIfCollapsed` decorations to also include +/- 1 character
                    if (startColumn > anchor.range.startColumn + 1 || anchor.range.endColumn - 1 > endColumn) {
                        return false;
                    }
                }
                else {
                    if (startColumn > anchor.range.startColumn || anchor.range.endColumn > endColumn) {
                        return false;
                    }
                }
                return true;
            });
        }
        computeAsync(token) {
            const anchor = this._anchor;
            if (!this._editor.hasModel() || !anchor) {
                return async_1.AsyncIterableObject.EMPTY;
            }
            const lineDecorations = ContentHoverComputer._getLineDecorations(this._editor, anchor);
            return async_1.AsyncIterableObject.merge(this._participants.map((participant) => {
                if (!participant.computeAsync) {
                    return async_1.AsyncIterableObject.EMPTY;
                }
                return participant.computeAsync(anchor, lineDecorations, token);
            }));
        }
        computeSync() {
            if (!this._editor.hasModel() || !this._anchor) {
                return [];
            }
            const lineDecorations = ContentHoverComputer._getLineDecorations(this._editor, this._anchor);
            let result = [];
            for (const participant of this._participants) {
                result = result.concat(participant.computeSync(this._anchor, lineDecorations));
            }
            return (0, arrays_1.coalesce)(result);
        }
    }
});
//# sourceMappingURL=contentHover.js.map