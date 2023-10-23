/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/editor/common/core/selection", "vs/editor/common/core/range", "vs/editor/test/browser/testCodeEditor", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/language"], function (require, exports, assert, lifecycle_1, selection_1, range_1, testCodeEditor_1, languageConfigurationRegistry_1, language_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('CodeEditorWidget', () => {
        test('onDidChangeModelDecorations', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor, viewModel) => {
                const disposables = new lifecycle_1.DisposableStore();
                let invoked = false;
                disposables.add(editor.onDidChangeModelDecorations((e) => {
                    invoked = true;
                }));
                viewModel.model.deltaDecorations([], [{ range: new range_1.Range(1, 1, 1, 1), options: { description: 'test' } }]);
                assert.deepStrictEqual(invoked, true);
                disposables.dispose();
            });
        });
        test('onDidChangeModelLanguage', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor, viewModel, instantiationService) => {
                const languageService = instantiationService.get(language_1.ILanguageService);
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add(languageService.registerLanguage({ id: 'testMode' }));
                let invoked = false;
                disposables.add(editor.onDidChangeModelLanguage((e) => {
                    invoked = true;
                }));
                viewModel.model.setMode('testMode');
                assert.deepStrictEqual(invoked, true);
                disposables.dispose();
            });
        });
        test('onDidChangeModelLanguageConfiguration', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor, viewModel, instantiationService) => {
                const languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
                const languageService = instantiationService.get(language_1.ILanguageService);
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add(languageService.registerLanguage({ id: 'testMode' }));
                viewModel.model.setMode('testMode');
                let invoked = false;
                disposables.add(editor.onDidChangeModelLanguageConfiguration((e) => {
                    invoked = true;
                }));
                disposables.add(languageConfigurationService.register('testMode', {
                    brackets: [['(', ')']]
                }));
                assert.deepStrictEqual(invoked, true);
                disposables.dispose();
            });
        });
        test('onDidChangeModelContent', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor, viewModel) => {
                const disposables = new lifecycle_1.DisposableStore();
                let invoked = false;
                disposables.add(editor.onDidChangeModelContent((e) => {
                    invoked = true;
                }));
                viewModel.type('hello', 'test');
                assert.deepStrictEqual(invoked, true);
                disposables.dispose();
            });
        });
        test('onDidChangeModelOptions', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor, viewModel) => {
                const disposables = new lifecycle_1.DisposableStore();
                let invoked = false;
                disposables.add(editor.onDidChangeModelOptions((e) => {
                    invoked = true;
                }));
                viewModel.model.updateOptions({
                    tabSize: 3
                });
                assert.deepStrictEqual(invoked, true);
                disposables.dispose();
            });
        });
        test('issue #145872 - Model change events are emitted before the selection updates', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor, viewModel) => {
                const disposables = new lifecycle_1.DisposableStore();
                let observedSelection = null;
                disposables.add(editor.onDidChangeModelContent((e) => {
                    observedSelection = editor.getSelection();
                }));
                viewModel.type('hello', 'test');
                assert.deepStrictEqual(observedSelection, new selection_1.Selection(1, 6, 1, 6));
                disposables.dispose();
            });
        });
        test('monaco-editor issue #2774 - Wrong order of events onDidChangeModelContent and onDidChangeCursorSelection on redo', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor, viewModel) => {
                const disposables = new lifecycle_1.DisposableStore();
                const calls = [];
                disposables.add(editor.onDidChangeModelContent((e) => {
                    calls.push(`contentchange(${e.changes.reduce((aggr, c) => [...aggr, c.text, c.rangeOffset, c.rangeLength], []).join(', ')})`);
                }));
                disposables.add(editor.onDidChangeCursorSelection((e) => {
                    calls.push(`cursorchange(${e.selection.positionLineNumber}, ${e.selection.positionColumn})`);
                }));
                viewModel.type('a', 'test');
                viewModel.model.undo();
                viewModel.model.redo();
                assert.deepStrictEqual(calls, [
                    'contentchange(a, 0, 0)',
                    'cursorchange(1, 2)',
                    'contentchange(, 0, 1)',
                    'cursorchange(1, 1)',
                    'contentchange(a, 0, 0)',
                    'cursorchange(1, 2)'
                ]);
                disposables.dispose();
            });
        });
        test('issue #146174: Events delivered out of order when adding decorations in content change listener (1 of 2)', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor, viewModel) => {
                const disposables = new lifecycle_1.DisposableStore();
                const calls = [];
                disposables.add(editor.onDidChangeModelContent((e) => {
                    calls.push(`listener1 - contentchange(${e.changes.reduce((aggr, c) => [...aggr, c.text, c.rangeOffset, c.rangeLength], []).join(', ')})`);
                }));
                disposables.add(editor.onDidChangeCursorSelection((e) => {
                    calls.push(`listener1 - cursorchange(${e.selection.positionLineNumber}, ${e.selection.positionColumn})`);
                }));
                disposables.add(editor.onDidChangeModelContent((e) => {
                    calls.push(`listener2 - contentchange(${e.changes.reduce((aggr, c) => [...aggr, c.text, c.rangeOffset, c.rangeLength], []).join(', ')})`);
                }));
                disposables.add(editor.onDidChangeCursorSelection((e) => {
                    calls.push(`listener2 - cursorchange(${e.selection.positionLineNumber}, ${e.selection.positionColumn})`);
                }));
                viewModel.type('a', 'test');
                assert.deepStrictEqual(calls, ([
                    'listener1 - contentchange(a, 0, 0)',
                    'listener2 - contentchange(a, 0, 0)',
                    'listener1 - cursorchange(1, 2)',
                    'listener2 - cursorchange(1, 2)',
                ]));
                disposables.dispose();
            });
        });
        test('issue #146174: Events delivered out of order when adding decorations in content change listener (2 of 2)', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor, viewModel) => {
                const disposables = new lifecycle_1.DisposableStore();
                const calls = [];
                disposables.add(editor.onDidChangeModelContent((e) => {
                    calls.push(`listener1 - contentchange(${e.changes.reduce((aggr, c) => [...aggr, c.text, c.rangeOffset, c.rangeLength], []).join(', ')})`);
                    editor.deltaDecorations([], [{ range: new range_1.Range(1, 1, 1, 1), options: { description: 'test' } }]);
                }));
                disposables.add(editor.onDidChangeCursorSelection((e) => {
                    calls.push(`listener1 - cursorchange(${e.selection.positionLineNumber}, ${e.selection.positionColumn})`);
                }));
                disposables.add(editor.onDidChangeModelContent((e) => {
                    calls.push(`listener2 - contentchange(${e.changes.reduce((aggr, c) => [...aggr, c.text, c.rangeOffset, c.rangeLength], []).join(', ')})`);
                }));
                disposables.add(editor.onDidChangeCursorSelection((e) => {
                    calls.push(`listener2 - cursorchange(${e.selection.positionLineNumber}, ${e.selection.positionColumn})`);
                }));
                viewModel.type('a', 'test');
                assert.deepStrictEqual(calls, ([
                    'listener1 - contentchange(a, 0, 0)',
                    'listener2 - contentchange(a, 0, 0)',
                    'listener1 - cursorchange(1, 2)',
                    'listener2 - cursorchange(1, 2)',
                ]));
                disposables.dispose();
            });
        });
    });
});
//# sourceMappingURL=codeEditorWidget.test.js.map