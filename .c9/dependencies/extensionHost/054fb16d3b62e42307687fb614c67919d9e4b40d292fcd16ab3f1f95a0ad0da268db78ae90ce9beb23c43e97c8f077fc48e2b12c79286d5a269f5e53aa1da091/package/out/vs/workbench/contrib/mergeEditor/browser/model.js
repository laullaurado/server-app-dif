/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/editor/common/core/range"], function (require, exports, arrays_1, errors_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModifiedBaseRangeState = exports.ModifiedBaseRange = exports.LineDiff = exports.LineRange = exports.LineEdits = exports.LineEdit = void 0;
    /**
     * Represents an edit, expressed in whole lines:
     * At {@link LineRange.startLineNumber}, delete {@link LineRange.lineCount} many lines and insert {@link newLines}.
    */
    class LineEdit {
        constructor(range, newLines) {
            this.range = range;
            this.newLines = newLines;
        }
        equals(other) {
            return this.range.equals(other.range) && (0, arrays_1.equals)(this.newLines, other.newLines);
        }
        apply(model) {
            new LineEdits([this]).apply(model);
        }
    }
    exports.LineEdit = LineEdit;
    class LineEdits {
        constructor(edits) {
            this.edits = edits;
        }
        apply(model) {
            model.pushEditOperations(null, this.edits.map((e) => {
                if (e.range.endLineNumberExclusive <= model.getLineCount()) {
                    return {
                        range: new range_1.Range(e.range.startLineNumber, 1, e.range.endLineNumberExclusive, 1),
                        text: e.newLines.map(s => s + '\n').join(''),
                    };
                }
                if (e.range.startLineNumber === 1) {
                    return {
                        range: new range_1.Range(1, 1, model.getLineCount(), Number.MAX_SAFE_INTEGER),
                        text: e.newLines.join('\n'),
                    };
                }
                return {
                    range: new range_1.Range(e.range.startLineNumber - 1, Number.MAX_SAFE_INTEGER, model.getLineCount(), Number.MAX_SAFE_INTEGER),
                    text: e.newLines.map(s => '\n' + s).join(''),
                };
            }), () => null);
        }
    }
    exports.LineEdits = LineEdits;
    class LineRange {
        constructor(startLineNumber, lineCount) {
            this.startLineNumber = startLineNumber;
            this.lineCount = lineCount;
            if (lineCount < 0) {
                throw new errors_1.BugIndicatingError();
            }
        }
        static join(ranges) {
            if (ranges.length === 0) {
                return undefined;
            }
            let startLineNumber = Number.MAX_SAFE_INTEGER;
            let endLineNumber = 0;
            for (const range of ranges) {
                startLineNumber = Math.min(startLineNumber, range.startLineNumber);
                endLineNumber = Math.max(endLineNumber, range.startLineNumber + range.lineCount);
            }
            return new LineRange(startLineNumber, endLineNumber - startLineNumber);
        }
        join(other) {
            return new LineRange(Math.min(this.startLineNumber, other.startLineNumber), Math.max(this.endLineNumberExclusive, other.endLineNumberExclusive) - this.startLineNumber);
        }
        get endLineNumberExclusive() {
            return this.startLineNumber + this.lineCount;
        }
        get isEmpty() {
            return this.lineCount === 0;
        }
        /**
         * Returns false if there is at least one line between `this` and `other`.
        */
        touches(other) {
            return (this.endLineNumberExclusive >= other.startLineNumber &&
                other.endLineNumberExclusive >= this.startLineNumber);
        }
        isAfter(modifiedRange) {
            return this.startLineNumber >= modifiedRange.endLineNumberExclusive;
        }
        delta(lineDelta) {
            return new LineRange(this.startLineNumber + lineDelta, this.lineCount);
        }
        toString() {
            return `[${this.startLineNumber},${this.endLineNumberExclusive})`;
        }
        equals(originalRange) {
            return this.startLineNumber === originalRange.startLineNumber && this.lineCount === originalRange.lineCount;
        }
        contains(lineNumber) {
            return this.startLineNumber <= lineNumber && lineNumber < this.endLineNumberExclusive;
        }
        deltaEnd(delta) {
            return new LineRange(this.startLineNumber, this.lineCount + delta);
        }
        getLines(model) {
            const result = new Array(this.lineCount);
            for (let i = 0; i < this.lineCount; i++) {
                result[i] = model.getLineContent(this.startLineNumber + i);
            }
            return result;
        }
    }
    exports.LineRange = LineRange;
    LineRange.compareByStart = (0, arrays_1.compareBy)(l => l.startLineNumber, arrays_1.numberComparator);
    class LineDiff {
        constructor(originalTextModel, originalRange, modifiedTextModel, modifiedRange) {
            this.originalTextModel = originalTextModel;
            this.originalRange = originalRange;
            this.modifiedTextModel = modifiedTextModel;
            this.modifiedRange = modifiedRange;
        }
        static fromLineChange(lineChange, originalTextModel, modifiedTextModel) {
            let originalRange;
            if (lineChange.originalEndLineNumber === 0) {
                // Insertion
                originalRange = new LineRange(lineChange.originalStartLineNumber + 1, 0);
            }
            else {
                originalRange = new LineRange(lineChange.originalStartLineNumber, lineChange.originalEndLineNumber - lineChange.originalStartLineNumber + 1);
            }
            let modifiedRange;
            if (lineChange.modifiedEndLineNumber === 0) {
                // Insertion
                modifiedRange = new LineRange(lineChange.modifiedStartLineNumber + 1, 0);
            }
            else {
                modifiedRange = new LineRange(lineChange.modifiedStartLineNumber, lineChange.modifiedEndLineNumber - lineChange.modifiedStartLineNumber + 1);
            }
            return new LineDiff(originalTextModel, originalRange, modifiedTextModel, modifiedRange);
        }
        static hull(lineDiffs) {
            if (lineDiffs.length === 0) {
                return undefined;
            }
            return new LineDiff(lineDiffs[0].originalTextModel, LineRange.join(lineDiffs.map((d) => d.originalRange)), lineDiffs[0].modifiedTextModel, LineRange.join(lineDiffs.map((d) => d.modifiedRange)));
        }
        static alignOriginalRange(lineDiffs) {
            if (lineDiffs.length === 0) {
                return [];
            }
            const originalRange = LineRange.join(lineDiffs.map((d) => d.originalRange));
            return lineDiffs.map(l => {
                const startDelta = originalRange.startLineNumber - l.originalRange.startLineNumber;
                const endDelta = originalRange.endLineNumberExclusive - l.originalRange.endLineNumberExclusive;
                return new LineDiff(l.originalTextModel, originalRange, l.modifiedTextModel, new LineRange(l.modifiedRange.startLineNumber + startDelta, l.modifiedRange.lineCount - startDelta + endDelta));
            });
        }
        get resultingDeltaFromOriginalToModified() {
            return this.modifiedRange.endLineNumberExclusive - this.originalRange.endLineNumberExclusive;
        }
        ensureSameOriginalModel(other) {
            if (this.originalTextModel !== other.originalTextModel) {
                // Both changes must refer to the same original model
                throw new errors_1.BugIndicatingError();
            }
        }
        conflicts(other) {
            this.ensureSameOriginalModel(other);
            return this.originalRange.touches(other.originalRange);
        }
        isStrictBefore(other) {
            this.ensureSameOriginalModel(other);
            return this.originalRange.endLineNumberExclusive <= other.originalRange.startLineNumber;
        }
        getLineEdit() {
            return new LineEdit(this.originalRange, this.getModifiedLines());
        }
        getReverseLineEdit() {
            return new LineEdit(this.modifiedRange, this.getOriginalLines());
        }
        getModifiedLines() {
            return this.modifiedRange.getLines(this.modifiedTextModel);
        }
        getOriginalLines() {
            return this.originalRange.getLines(this.originalTextModel);
        }
    }
    exports.LineDiff = LineDiff;
    /**
     * Describes modifications in input 1 and input 2 for a specific range in base.
     *
     * The UI offers a mechanism to either apply all changes from input 1 or input 2 or both.
     *
     * Immutable.
    */
    class ModifiedBaseRange {
        constructor(baseTextModel, input1TextModel, input1Diffs, input1DeltaLineCount, input2TextModel, input2Diffs, input2DeltaLineCount) {
            this.baseTextModel = baseTextModel;
            this.input1TextModel = input1TextModel;
            this.input1Diffs = input1Diffs;
            this.input2TextModel = input2TextModel;
            this.input2Diffs = input2Diffs;
            this.input1CombinedDiff = LineDiff.hull(this.input1Diffs);
            this.input2CombinedDiff = LineDiff.hull(this.input2Diffs);
            if (this.input1Diffs.length === 0 && this.input2Diffs.length === 0) {
                throw new errors_1.BugIndicatingError('must have at least one diff');
            }
            const input1Diff = this.input1CombinedDiff ||
                new LineDiff(baseTextModel, this.input2CombinedDiff.originalRange, input1TextModel, this.input2CombinedDiff.originalRange.delta(input1DeltaLineCount));
            const input2Diff = this.input2CombinedDiff ||
                new LineDiff(baseTextModel, this.input1CombinedDiff.originalRange, input1TextModel, this.input1CombinedDiff.originalRange.delta(input2DeltaLineCount));
            const results = LineDiff.alignOriginalRange([input1Diff, input2Diff]);
            this.baseRange = results[0].originalRange;
            this.input1Range = results[0].modifiedRange;
            this.input2Range = results[1].modifiedRange;
        }
        /**
         * diffs1 and diffs2 together with the conflict relation form a bipartite graph.
         * This method computes strongly connected components of that graph while maintaining the side of each diff.
        */
        static fromDiffs(baseTextModel, input1TextModel, diffs1, input2TextModel, diffs2) {
            const compareByStartLineNumber = (0, arrays_1.compareBy)((d) => d.originalRange.startLineNumber, arrays_1.numberComparator);
            const diffs = diffs1
                .map((diff) => ({ source: 0, diff }))
                .concat(diffs2.map((diff) => ({ source: 1, diff })));
            diffs.sort((0, arrays_1.compareBy)(d => d.diff, compareByStartLineNumber));
            const currentDiffs = [
                new Array(),
                new Array(),
            ];
            let deltaFromBaseToInput = [0, 0];
            const result = new Array();
            function pushAndReset() {
                if (currentDiffs[0].length === 0 && currentDiffs[1].length === 0) {
                    return;
                }
                result.push(new ModifiedBaseRange(baseTextModel, input1TextModel, currentDiffs[0], deltaFromBaseToInput[0], input2TextModel, currentDiffs[1], deltaFromBaseToInput[1]));
                currentDiffs[0] = [];
                currentDiffs[1] = [];
            }
            let currentRange;
            for (const diff of diffs) {
                const range = diff.diff.originalRange;
                if (currentRange && !currentRange.touches(range)) {
                    pushAndReset();
                }
                deltaFromBaseToInput[diff.source] = diff.diff.resultingDeltaFromOriginalToModified;
                currentRange = currentRange ? currentRange.join(range) : range;
                currentDiffs[diff.source].push(diff.diff);
            }
            pushAndReset();
            return result;
        }
        getInputRange(inputNumber) {
            return inputNumber === 1 ? this.input1Range : this.input2Range;
        }
        getInputDiffs(inputNumber) {
            return inputNumber === 1 ? this.input1Diffs : this.input2Diffs;
        }
        get isConflicting() {
            return this.input1Diffs.length > 0 && this.input2Diffs.length > 0;
        }
    }
    exports.ModifiedBaseRange = ModifiedBaseRange;
    class ModifiedBaseRangeState {
        constructor(input1, input2, input2First, conflicting) {
            this.input1 = input1;
            this.input2 = input2;
            this.input2First = input2First;
            this.conflicting = conflicting;
        }
        getInput(inputNumber) {
            if (this.conflicting) {
                return undefined;
            }
            if (inputNumber === 1) {
                return this.input1;
            }
            else {
                return this.input2;
            }
        }
        withInputValue(inputNumber, value) {
            return inputNumber === 1 ? this.withInput1(value) : this.withInput2(value);
        }
        withInput1(value) {
            return new ModifiedBaseRangeState(value, this.input2, value !== this.input2 ? this.input2 : this.input2First, false);
        }
        withInput2(value) {
            return new ModifiedBaseRangeState(this.input1, value, value !== this.input1 ? value : this.input2First, false);
        }
        toggleInput1() {
            return this.withInput1(!this.input1);
        }
        toggleInput2() {
            return this.withInput2(!this.input2);
        }
        get isEmpty() {
            return !this.input1 && !this.input2;
        }
        toString() {
            const arr = [];
            if (this.input1) {
                arr.push('1');
            }
            if (this.input2) {
                arr.push('2');
            }
            if (this.input2First) {
                arr.reverse();
            }
            return arr.join(',');
        }
    }
    exports.ModifiedBaseRangeState = ModifiedBaseRangeState;
    ModifiedBaseRangeState.default = new ModifiedBaseRangeState(false, false, false, false);
    ModifiedBaseRangeState.conflicting = new ModifiedBaseRangeState(false, false, false, true);
});
/*
export class LineMappings {
    public static fromDiffs(
        diffs1: readonly LineDiff[],
        diffs2: readonly LineDiff[],
        inputLineCount: number,
    ): LineMappings {
        const compareByStartLineNumber = compareBy<LineDiff, number>(
            (d) => d.originalRange.startLineNumber,
            numberComparator
        );

        const diffs = diffs1
            .map((diff) => ({ source: 0 as 0 | 1, diff }))
            .concat(diffs2.map((diff) => ({ source: 1 as const, diff })));

        diffs.sort(compareBy(d => d.diff, compareByStartLineNumber));

        const currentDiffs = [
            new Array<LineDiff>(),
            new Array<LineDiff>(),
        ];
        let deltaFromBaseToInput = [0, 0];

        const result = new Array<ModifiedBaseRange>();

        function pushAndReset() {
            result.push(LineMapping.create(
                baseTextModel,
                input1TextModel,
                currentDiffs[0],
                deltaFromBaseToInput[0],
                input2TextModel,
                currentDiffs[1],
                deltaFromBaseToInput[1],
            ));
            currentDiffs[0] = [];
            currentDiffs[1] = [];
        }

        let currentRange: LineRange | undefined;

        for (const diff of diffs) {
            const range = diff.diff.originalRange;
            if (currentRange && !currentRange.touches(range)) {
                pushAndReset();
            }
            deltaFromBaseToInput[diff.source] = diff.diff.resultingDeltaFromOriginalToModified;
            currentRange = currentRange ? currentRange.join(range) : range;
            currentDiffs[diff.source].push(diff.diff);
        }
        pushAndReset();

        return result;
    }

    constructor(private readonly lineMappings: LineMapping[]) {}
}

// A lightweight ModifiedBaseRange. Maybe they can be united?
export class LineMapping {
    public static create(input: LineDiff, ): LineMapping {

    }

    constructor(
        public readonly inputRange: LineRange,
        public readonly resultRange: LineRange
    ) { }
}
*/
//# sourceMappingURL=model.js.map