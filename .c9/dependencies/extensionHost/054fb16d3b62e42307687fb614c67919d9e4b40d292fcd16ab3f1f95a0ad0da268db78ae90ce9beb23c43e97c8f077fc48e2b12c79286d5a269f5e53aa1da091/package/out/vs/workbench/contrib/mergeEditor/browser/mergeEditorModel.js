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
define(["require", "exports", "vs/base/common/event", "vs/base/common/arrays", "vs/base/common/errors", "vs/editor/common/services/editorWorker", "vs/workbench/common/editor/editorModel", "vs/workbench/contrib/audioCues/browser/observable", "vs/workbench/contrib/mergeEditor/browser/model", "vs/workbench/contrib/mergeEditor/browser/utils"], function (require, exports, event_1, arrays_1, errors_1, editorWorker_1, editorModel_1, observable_1, model_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeEditorModel = exports.MergeEditorModelFactory = void 0;
    let MergeEditorModelFactory = class MergeEditorModelFactory {
        constructor(_editorWorkerService) {
            this._editorWorkerService = _editorWorkerService;
        }
        async create(base, input1, input1Detail, input1Description, input2, input2Detail, input2Description, result) {
            const baseToInput1DiffPromise = this._editorWorkerService.computeDiff(base.uri, input1.uri, false, 1000);
            const baseToInput2DiffPromise = this._editorWorkerService.computeDiff(base.uri, input2.uri, false, 1000);
            const baseToResultDiffPromise = this._editorWorkerService.computeDiff(base.uri, result.uri, false, 1000);
            const [baseToInput1Diff, baseToInput2Diff, baseToResultDiff] = await Promise.all([
                baseToInput1DiffPromise,
                baseToInput2DiffPromise,
                baseToResultDiffPromise
            ]);
            const changesInput1 = (baseToInput1Diff === null || baseToInput1Diff === void 0 ? void 0 : baseToInput1Diff.changes.map((c) => model_1.LineDiff.fromLineChange(c, base, input1))) || [];
            const changesInput2 = (baseToInput2Diff === null || baseToInput2Diff === void 0 ? void 0 : baseToInput2Diff.changes.map((c) => model_1.LineDiff.fromLineChange(c, base, input2))) || [];
            const changesResult = (baseToResultDiff === null || baseToResultDiff === void 0 ? void 0 : baseToResultDiff.changes.map((c) => model_1.LineDiff.fromLineChange(c, base, result))) || [];
            return new MergeEditorModel(InternalSymbol, base, input1, input1Detail, input1Description, input2, input2Detail, input2Description, result, changesInput1, changesInput2, changesResult, this._editorWorkerService);
        }
    };
    MergeEditorModelFactory = __decorate([
        __param(0, editorWorker_1.IEditorWorkerService)
    ], MergeEditorModelFactory);
    exports.MergeEditorModelFactory = MergeEditorModelFactory;
    const InternalSymbol = null;
    class MergeEditorModel extends editorModel_1.EditorModel {
        constructor(_symbol, base, input1, input1Detail, input1Description, input2, input2Detail, input2Description, result, input1LinesDiffs, input2LinesDiffs, resultDiffs, editorWorkerService) {
            super();
            this.base = base;
            this.input1 = input1;
            this.input1Detail = input1Detail;
            this.input1Description = input1Description;
            this.input2 = input2;
            this.input2Detail = input2Detail;
            this.input2Description = input2Description;
            this.result = result;
            this.input1LinesDiffs = input1LinesDiffs;
            this.input2LinesDiffs = input2LinesDiffs;
            this.editorWorkerService = editorWorkerService;
            this.modifiedBaseRanges = model_1.ModifiedBaseRange.fromDiffs(this.base, this.input1, this.input1LinesDiffs, this.input2, this.input2LinesDiffs);
            this.modifiedBaseRangeStateStores = new Map(this.modifiedBaseRanges.map(s => ([s, new observable_1.ObservableValue(model_1.ModifiedBaseRangeState.default, 'State')])));
            this.resultEdits = new ResultEdits(resultDiffs, this.base, this.result, this.editorWorkerService);
            this.resultEdits.onDidChange(() => {
                this.recomputeState();
            });
            this.recomputeState();
            this.resetUnknown();
        }
        recomputeState() {
            (0, observable_1.transaction)(tx => {
                const baseRangeWithStoreAndTouchingDiffs = (0, utils_1.leftJoin)(this.modifiedBaseRangeStateStores, this.resultEdits.diffs.get(), (baseRange, diff) => baseRange[0].baseRange.touches(diff.originalRange)
                    ? arrays_1.CompareResult.neitherLessOrGreaterThan
                    : model_1.LineRange.compareByStart(baseRange[0].baseRange, diff.originalRange));
                for (const row of baseRangeWithStoreAndTouchingDiffs) {
                    row.left[1].set(this.computeState(row.left[0], row.rights), tx);
                }
            });
        }
        resetUnknown() {
            (0, observable_1.transaction)(tx => {
                for (const range of this.modifiedBaseRanges) {
                    if (this.getState(range).get().conflicting) {
                        this.setState(range, model_1.ModifiedBaseRangeState.default, tx);
                    }
                }
            });
        }
        mergeNonConflictingDiffs() {
            (0, observable_1.transaction)((tx) => {
                for (const m of this.modifiedBaseRanges) {
                    if (m.isConflicting) {
                        continue;
                    }
                    this.setState(m, m.input1Diffs.length > 0
                        ? model_1.ModifiedBaseRangeState.default.withInput1(true)
                        : model_1.ModifiedBaseRangeState.default.withInput2(true), tx);
                }
            });
        }
        get resultDiffs() {
            return this.resultEdits.diffs;
        }
        computeState(baseRange, conflictingDiffs) {
            if (!conflictingDiffs) {
                conflictingDiffs = this.resultEdits.findTouchingDiffs(baseRange.baseRange);
            }
            if (conflictingDiffs.length === 0) {
                return model_1.ModifiedBaseRangeState.default;
            }
            const conflictingEdits = conflictingDiffs.map((d) => d.getLineEdit());
            function editsAgreeWithDiffs(diffs) {
                return (0, arrays_1.equals)(conflictingEdits, diffs.map((d) => d.getLineEdit()), (a, b) => a.equals(b));
            }
            if (editsAgreeWithDiffs(baseRange.input1Diffs)) {
                return model_1.ModifiedBaseRangeState.default.withInput1(true);
            }
            if (editsAgreeWithDiffs(baseRange.input2Diffs)) {
                return model_1.ModifiedBaseRangeState.default.withInput2(true);
            }
            return model_1.ModifiedBaseRangeState.conflicting;
        }
        getState(baseRange) {
            const existingState = this.modifiedBaseRangeStateStores.get(baseRange);
            if (!existingState) {
                throw new errors_1.BugIndicatingError('object must be from this instance');
            }
            return existingState;
        }
        setState(baseRange, state, transaction) {
            const existingState = this.modifiedBaseRangeStateStores.get(baseRange);
            if (!existingState) {
                throw new errors_1.BugIndicatingError('object must be from this instance');
            }
            const conflictingDiffs = this.resultEdits.findTouchingDiffs(baseRange.baseRange);
            if (conflictingDiffs) {
                this.resultEdits.removeDiffs(conflictingDiffs, transaction);
            }
            function getEdit(baseRange, state) {
                const diffs = new Array();
                if (state.input1) {
                    if (baseRange.input1CombinedDiff) {
                        diffs.push({ diff: baseRange.input1CombinedDiff, inputNumber: 1 });
                    }
                }
                if (state.input2) {
                    if (baseRange.input2CombinedDiff) {
                        diffs.push({ diff: baseRange.input2CombinedDiff, inputNumber: 2 });
                    }
                }
                if (state.input2First) {
                    diffs.reverse();
                }
                const firstDiff = diffs[0];
                const secondDiff = diffs[1];
                diffs.sort((0, arrays_1.compareBy)(d => d.diff.originalRange, model_1.LineRange.compareByStart));
                if (!firstDiff) {
                    return { edit: undefined, effectiveState: state };
                }
                if (!secondDiff) {
                    return { edit: firstDiff.diff.getLineEdit(), effectiveState: state };
                }
                // Two inserts
                if (firstDiff.diff.originalRange.lineCount === 0 &&
                    firstDiff.diff.originalRange.equals(secondDiff.diff.originalRange)) {
                    return {
                        edit: new model_1.LineEdit(firstDiff.diff.originalRange, firstDiff.diff
                            .getLineEdit()
                            .newLines.concat(secondDiff.diff.getLineEdit().newLines)),
                        effectiveState: state,
                    };
                }
                // Technically non-conflicting diffs
                if (diffs.length === 2 && diffs[0].diff.originalRange.endLineNumberExclusive === diffs[1].diff.originalRange.startLineNumber) {
                    return {
                        edit: new model_1.LineEdit(model_1.LineRange.join(diffs.map(d => d.diff.originalRange)), diffs.flatMap(d => d.diff.getLineEdit().newLines)),
                        effectiveState: state,
                    };
                }
                return { edit: firstDiff.diff.getLineEdit(), effectiveState: state };
            }
            const { edit, effectiveState } = getEdit(baseRange, state);
            existingState.set(effectiveState, transaction);
            if (edit) {
                this.resultEdits.applyEditRelativeToOriginal(edit, transaction);
            }
        }
        getResultRange(baseRange) {
            return this.resultEdits.getResultRange(baseRange);
        }
    }
    exports.MergeEditorModel = MergeEditorModel;
    class ResultEdits {
        constructor(diffs, baseTextModel, resultTextModel, _editorWorkerService) {
            this.baseTextModel = baseTextModel;
            this.resultTextModel = resultTextModel;
            this._editorWorkerService = _editorWorkerService;
            this.barrier = new utils_1.ReentrancyBarrier();
            this.onDidChangeEmitter = new event_1.Emitter();
            this.onDidChange = this.onDidChangeEmitter.event;
            this._diffs = new observable_1.ObservableValue([], 'diffs');
            this.diffs = this._diffs;
            diffs.sort((0, arrays_1.compareBy)((d) => d.originalRange.startLineNumber, arrays_1.numberComparator));
            this._diffs.set(diffs, undefined);
            resultTextModel.onDidChangeContent(e => {
                this.barrier.runExclusively(() => {
                    this._editorWorkerService.computeDiff(baseTextModel.uri, resultTextModel.uri, false, 1000).then(e => {
                        const diffs = (e === null || e === void 0 ? void 0 : e.changes.map((c) => model_1.LineDiff.fromLineChange(c, baseTextModel, resultTextModel))) || [];
                        this._diffs.set(diffs, undefined);
                        this.onDidChangeEmitter.fire(undefined);
                    });
                });
            });
        }
        removeDiffs(diffToRemoves, transaction) {
            diffToRemoves.sort((0, arrays_1.compareBy)((d) => d.originalRange.startLineNumber, arrays_1.numberComparator));
            diffToRemoves.reverse();
            let diffs = this._diffs.get();
            for (const diffToRemove of diffToRemoves) {
                // TODO improve performance
                const len = diffs.length;
                diffs = diffs.filter((d) => d !== diffToRemove);
                if (len === diffs.length) {
                    throw new errors_1.BugIndicatingError();
                }
                this.barrier.runExclusivelyOrThrow(() => {
                    diffToRemove.getReverseLineEdit().apply(this.resultTextModel);
                });
                diffs = diffs.map((d) => d.modifiedRange.isAfter(diffToRemove.modifiedRange)
                    ? new model_1.LineDiff(d.originalTextModel, d.originalRange, d.modifiedTextModel, d.modifiedRange.delta(diffToRemove.originalRange.lineCount - diffToRemove.modifiedRange.lineCount))
                    : d);
            }
            this._diffs.set(diffs, transaction);
        }
        /**
         * Edit must be conflict free.
         */
        applyEditRelativeToOriginal(edit, transaction) {
            let firstAfter = false;
            let delta = 0;
            const newDiffs = new Array();
            for (const diff of this._diffs.get()) {
                if (diff.originalRange.touches(edit.range)) {
                    throw new errors_1.BugIndicatingError('Edit must be conflict free.');
                }
                else if (diff.originalRange.isAfter(edit.range)) {
                    if (!firstAfter) {
                        firstAfter = true;
                        newDiffs.push(new model_1.LineDiff(this.baseTextModel, edit.range, this.resultTextModel, new model_1.LineRange(edit.range.startLineNumber + delta, edit.newLines.length)));
                    }
                    newDiffs.push(new model_1.LineDiff(diff.originalTextModel, diff.originalRange, diff.modifiedTextModel, diff.modifiedRange.delta(edit.newLines.length - edit.range.lineCount)));
                }
                else {
                    newDiffs.push(diff);
                }
                if (!firstAfter) {
                    delta += diff.modifiedRange.lineCount - diff.originalRange.lineCount;
                }
            }
            if (!firstAfter) {
                firstAfter = true;
                newDiffs.push(new model_1.LineDiff(this.baseTextModel, edit.range, this.resultTextModel, new model_1.LineRange(edit.range.startLineNumber + delta, edit.newLines.length)));
            }
            this.barrier.runExclusivelyOrThrow(() => {
                new model_1.LineEdit(edit.range.delta(delta), edit.newLines).apply(this.resultTextModel);
            });
            this._diffs.set(newDiffs, transaction);
        }
        findTouchingDiffs(baseRange) {
            return this.diffs.get().filter(d => d.originalRange.touches(baseRange));
        }
        getResultRange(baseRange) {
            let startOffset = 0;
            let lengthOffset = 0;
            for (const diff of this.diffs.get()) {
                if (diff.originalRange.endLineNumberExclusive <= baseRange.startLineNumber) {
                    startOffset += diff.resultingDeltaFromOriginalToModified;
                }
                else if (diff.originalRange.startLineNumber <= baseRange.endLineNumberExclusive) {
                    lengthOffset += diff.resultingDeltaFromOriginalToModified;
                }
                else {
                    break;
                }
            }
            return new model_1.LineRange(baseRange.startLineNumber + startOffset, baseRange.lineCount + lengthOffset);
        }
    }
});
//# sourceMappingURL=mergeEditorModel.js.map