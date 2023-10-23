/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects"], function (require, exports, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.shouldSynchronizeModel = exports.ApplyEditsResult = exports.SearchData = exports.ValidAnnotatedEditOperation = exports.ModelConstants = exports.PositionAffinity = exports.TrackedRangeStickiness = exports.FindMatch = exports.TextModelResolvedOptions = exports.EndOfLineSequence = exports.DefaultEndOfLine = exports.EndOfLinePreference = exports.InjectedTextCursorStops = exports.MinimapPosition = exports.OverviewRulerLane = void 0;
    /**
     * Vertical Lane in the overview ruler of the editor.
     */
    var OverviewRulerLane;
    (function (OverviewRulerLane) {
        OverviewRulerLane[OverviewRulerLane["Left"] = 1] = "Left";
        OverviewRulerLane[OverviewRulerLane["Center"] = 2] = "Center";
        OverviewRulerLane[OverviewRulerLane["Right"] = 4] = "Right";
        OverviewRulerLane[OverviewRulerLane["Full"] = 7] = "Full";
    })(OverviewRulerLane = exports.OverviewRulerLane || (exports.OverviewRulerLane = {}));
    /**
     * Position in the minimap to render the decoration.
     */
    var MinimapPosition;
    (function (MinimapPosition) {
        MinimapPosition[MinimapPosition["Inline"] = 1] = "Inline";
        MinimapPosition[MinimapPosition["Gutter"] = 2] = "Gutter";
    })(MinimapPosition = exports.MinimapPosition || (exports.MinimapPosition = {}));
    var InjectedTextCursorStops;
    (function (InjectedTextCursorStops) {
        InjectedTextCursorStops[InjectedTextCursorStops["Both"] = 0] = "Both";
        InjectedTextCursorStops[InjectedTextCursorStops["Right"] = 1] = "Right";
        InjectedTextCursorStops[InjectedTextCursorStops["Left"] = 2] = "Left";
        InjectedTextCursorStops[InjectedTextCursorStops["None"] = 3] = "None";
    })(InjectedTextCursorStops = exports.InjectedTextCursorStops || (exports.InjectedTextCursorStops = {}));
    /**
     * End of line character preference.
     */
    var EndOfLinePreference;
    (function (EndOfLinePreference) {
        /**
         * Use the end of line character identified in the text buffer.
         */
        EndOfLinePreference[EndOfLinePreference["TextDefined"] = 0] = "TextDefined";
        /**
         * Use line feed (\n) as the end of line character.
         */
        EndOfLinePreference[EndOfLinePreference["LF"] = 1] = "LF";
        /**
         * Use carriage return and line feed (\r\n) as the end of line character.
         */
        EndOfLinePreference[EndOfLinePreference["CRLF"] = 2] = "CRLF";
    })(EndOfLinePreference = exports.EndOfLinePreference || (exports.EndOfLinePreference = {}));
    /**
     * The default end of line to use when instantiating models.
     */
    var DefaultEndOfLine;
    (function (DefaultEndOfLine) {
        /**
         * Use line feed (\n) as the end of line character.
         */
        DefaultEndOfLine[DefaultEndOfLine["LF"] = 1] = "LF";
        /**
         * Use carriage return and line feed (\r\n) as the end of line character.
         */
        DefaultEndOfLine[DefaultEndOfLine["CRLF"] = 2] = "CRLF";
    })(DefaultEndOfLine = exports.DefaultEndOfLine || (exports.DefaultEndOfLine = {}));
    /**
     * End of line character preference.
     */
    var EndOfLineSequence;
    (function (EndOfLineSequence) {
        /**
         * Use line feed (\n) as the end of line character.
         */
        EndOfLineSequence[EndOfLineSequence["LF"] = 0] = "LF";
        /**
         * Use carriage return and line feed (\r\n) as the end of line character.
         */
        EndOfLineSequence[EndOfLineSequence["CRLF"] = 1] = "CRLF";
    })(EndOfLineSequence = exports.EndOfLineSequence || (exports.EndOfLineSequence = {}));
    class TextModelResolvedOptions {
        /**
         * @internal
         */
        constructor(src) {
            this._textModelResolvedOptionsBrand = undefined;
            this.tabSize = Math.max(1, src.tabSize | 0);
            this.indentSize = src.tabSize | 0;
            this.insertSpaces = Boolean(src.insertSpaces);
            this.defaultEOL = src.defaultEOL | 0;
            this.trimAutoWhitespace = Boolean(src.trimAutoWhitespace);
            this.bracketPairColorizationOptions = src.bracketPairColorizationOptions;
        }
        /**
         * @internal
         */
        equals(other) {
            return (this.tabSize === other.tabSize
                && this.indentSize === other.indentSize
                && this.insertSpaces === other.insertSpaces
                && this.defaultEOL === other.defaultEOL
                && this.trimAutoWhitespace === other.trimAutoWhitespace
                && (0, objects_1.equals)(this.bracketPairColorizationOptions, other.bracketPairColorizationOptions));
        }
        /**
         * @internal
         */
        createChangeEvent(newOpts) {
            return {
                tabSize: this.tabSize !== newOpts.tabSize,
                indentSize: this.indentSize !== newOpts.indentSize,
                insertSpaces: this.insertSpaces !== newOpts.insertSpaces,
                trimAutoWhitespace: this.trimAutoWhitespace !== newOpts.trimAutoWhitespace,
            };
        }
    }
    exports.TextModelResolvedOptions = TextModelResolvedOptions;
    class FindMatch {
        /**
         * @internal
         */
        constructor(range, matches) {
            this._findMatchBrand = undefined;
            this.range = range;
            this.matches = matches;
        }
    }
    exports.FindMatch = FindMatch;
    /**
     * Describes the behavior of decorations when typing/editing near their edges.
     * Note: Please do not edit the values, as they very carefully match `DecorationRangeBehavior`
     */
    var TrackedRangeStickiness;
    (function (TrackedRangeStickiness) {
        TrackedRangeStickiness[TrackedRangeStickiness["AlwaysGrowsWhenTypingAtEdges"] = 0] = "AlwaysGrowsWhenTypingAtEdges";
        TrackedRangeStickiness[TrackedRangeStickiness["NeverGrowsWhenTypingAtEdges"] = 1] = "NeverGrowsWhenTypingAtEdges";
        TrackedRangeStickiness[TrackedRangeStickiness["GrowsOnlyWhenTypingBefore"] = 2] = "GrowsOnlyWhenTypingBefore";
        TrackedRangeStickiness[TrackedRangeStickiness["GrowsOnlyWhenTypingAfter"] = 3] = "GrowsOnlyWhenTypingAfter";
    })(TrackedRangeStickiness = exports.TrackedRangeStickiness || (exports.TrackedRangeStickiness = {}));
    var PositionAffinity;
    (function (PositionAffinity) {
        /**
         * Prefers the left most position.
        */
        PositionAffinity[PositionAffinity["Left"] = 0] = "Left";
        /**
         * Prefers the right most position.
        */
        PositionAffinity[PositionAffinity["Right"] = 1] = "Right";
        /**
         * No preference.
        */
        PositionAffinity[PositionAffinity["None"] = 2] = "None";
        /**
         * If the given position is on injected text, prefers the position left of it.
        */
        PositionAffinity[PositionAffinity["LeftOfInjectedText"] = 3] = "LeftOfInjectedText";
        /**
         * If the given position is on injected text, prefers the position right of it.
        */
        PositionAffinity[PositionAffinity["RightOfInjectedText"] = 4] = "RightOfInjectedText";
    })(PositionAffinity = exports.PositionAffinity || (exports.PositionAffinity = {}));
    /**
     * @internal
     */
    var ModelConstants;
    (function (ModelConstants) {
        ModelConstants[ModelConstants["FIRST_LINE_DETECTION_LENGTH_LIMIT"] = 1000] = "FIRST_LINE_DETECTION_LENGTH_LIMIT";
    })(ModelConstants = exports.ModelConstants || (exports.ModelConstants = {}));
    /**
     * @internal
     */
    class ValidAnnotatedEditOperation {
        constructor(identifier, range, text, forceMoveMarkers, isAutoWhitespaceEdit, _isTracked) {
            this.identifier = identifier;
            this.range = range;
            this.text = text;
            this.forceMoveMarkers = forceMoveMarkers;
            this.isAutoWhitespaceEdit = isAutoWhitespaceEdit;
            this._isTracked = _isTracked;
        }
    }
    exports.ValidAnnotatedEditOperation = ValidAnnotatedEditOperation;
    /**
     * @internal
     */
    class SearchData {
        constructor(regex, wordSeparators, simpleSearch) {
            this.regex = regex;
            this.wordSeparators = wordSeparators;
            this.simpleSearch = simpleSearch;
        }
    }
    exports.SearchData = SearchData;
    /**
     * @internal
     */
    class ApplyEditsResult {
        constructor(reverseEdits, changes, trimAutoWhitespaceLineNumbers) {
            this.reverseEdits = reverseEdits;
            this.changes = changes;
            this.trimAutoWhitespaceLineNumbers = trimAutoWhitespaceLineNumbers;
        }
    }
    exports.ApplyEditsResult = ApplyEditsResult;
    /**
     * @internal
     */
    function shouldSynchronizeModel(model) {
        return (!model.isTooLargeForSyncing() && !model.isForSimpleWidget);
    }
    exports.shouldSynchronizeModel = shouldSynchronizeModel;
});
//# sourceMappingURL=model.js.map