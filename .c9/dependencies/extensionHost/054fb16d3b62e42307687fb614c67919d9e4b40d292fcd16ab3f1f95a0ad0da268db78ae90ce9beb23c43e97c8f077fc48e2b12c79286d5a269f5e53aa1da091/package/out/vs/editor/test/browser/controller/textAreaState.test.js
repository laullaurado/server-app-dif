/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/editor/browser/controller/textAreaState", "vs/editor/common/core/position", "vs/editor/common/core/selection", "vs/editor/test/common/testTextModel"], function (require, exports, assert, lifecycle_1, textAreaState_1, position_1, selection_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MockTextAreaWrapper = void 0;
    class MockTextAreaWrapper extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._value = '';
            this._selectionStart = 0;
            this._selectionEnd = 0;
        }
        getValue() {
            return this._value;
        }
        setValue(reason, value) {
            this._value = value;
            this._selectionStart = this._value.length;
            this._selectionEnd = this._value.length;
        }
        getSelectionStart() {
            return this._selectionStart;
        }
        getSelectionEnd() {
            return this._selectionEnd;
        }
        setSelectionRange(reason, selectionStart, selectionEnd) {
            if (selectionStart < 0) {
                selectionStart = 0;
            }
            if (selectionStart > this._value.length) {
                selectionStart = this._value.length;
            }
            if (selectionEnd < 0) {
                selectionEnd = 0;
            }
            if (selectionEnd > this._value.length) {
                selectionEnd = this._value.length;
            }
            this._selectionStart = selectionStart;
            this._selectionEnd = selectionEnd;
        }
    }
    exports.MockTextAreaWrapper = MockTextAreaWrapper;
    function equalsTextAreaState(a, b) {
        return (a.value === b.value
            && a.selectionStart === b.selectionStart
            && a.selectionEnd === b.selectionEnd
            && position_1.Position.equals(a.selectionStartPosition, b.selectionStartPosition)
            && position_1.Position.equals(a.selectionEndPosition, b.selectionEndPosition));
    }
    suite('TextAreaState', () => {
        function assertTextAreaState(actual, value, selectionStart, selectionEnd) {
            let desired = new textAreaState_1.TextAreaState(value, selectionStart, selectionEnd, null, null);
            assert.ok(equalsTextAreaState(desired, actual), desired.toString() + ' == ' + actual.toString());
        }
        test('fromTextArea', () => {
            let textArea = new MockTextAreaWrapper();
            textArea._value = 'Hello world!';
            textArea._selectionStart = 1;
            textArea._selectionEnd = 12;
            let actual = textAreaState_1.TextAreaState.readFromTextArea(textArea);
            assertTextAreaState(actual, 'Hello world!', 1, 12);
            assert.strictEqual(actual.value, 'Hello world!');
            assert.strictEqual(actual.selectionStart, 1);
            actual = actual.collapseSelection();
            assertTextAreaState(actual, 'Hello world!', 12, 12);
            textArea.dispose();
        });
        test('applyToTextArea', () => {
            let textArea = new MockTextAreaWrapper();
            textArea._value = 'Hello world!';
            textArea._selectionStart = 1;
            textArea._selectionEnd = 12;
            let state = new textAreaState_1.TextAreaState('Hi world!', 2, 2, null, null);
            state.writeToTextArea('test', textArea, false);
            assert.strictEqual(textArea._value, 'Hi world!');
            assert.strictEqual(textArea._selectionStart, 9);
            assert.strictEqual(textArea._selectionEnd, 9);
            state = new textAreaState_1.TextAreaState('Hi world!', 3, 3, null, null);
            state.writeToTextArea('test', textArea, false);
            assert.strictEqual(textArea._value, 'Hi world!');
            assert.strictEqual(textArea._selectionStart, 9);
            assert.strictEqual(textArea._selectionEnd, 9);
            state = new textAreaState_1.TextAreaState('Hi world!', 0, 2, null, null);
            state.writeToTextArea('test', textArea, true);
            assert.strictEqual(textArea._value, 'Hi world!');
            assert.strictEqual(textArea._selectionStart, 0);
            assert.strictEqual(textArea._selectionEnd, 2);
            textArea.dispose();
        });
        function testDeduceInput(prevState, value, selectionStart, selectionEnd, couldBeEmojiInput, expected, expectedCharReplaceCnt) {
            prevState = prevState || textAreaState_1.TextAreaState.EMPTY;
            let textArea = new MockTextAreaWrapper();
            textArea._value = value;
            textArea._selectionStart = selectionStart;
            textArea._selectionEnd = selectionEnd;
            let newState = textAreaState_1.TextAreaState.readFromTextArea(textArea);
            let actual = textAreaState_1.TextAreaState.deduceInput(prevState, newState, couldBeEmojiInput);
            assert.deepStrictEqual(actual, {
                text: expected,
                replacePrevCharCnt: expectedCharReplaceCnt,
                replaceNextCharCnt: 0,
                positionDelta: 0,
            });
            textArea.dispose();
        }
        test('extractNewText - no previous state with selection', () => {
            testDeduceInput(null, 'a', 0, 1, true, 'a', 0);
        });
        test('issue #2586: Replacing selected end-of-line with newline locks up the document', () => {
            testDeduceInput(new textAreaState_1.TextAreaState(']\n', 1, 2, null, null), ']\n', 2, 2, true, '\n', 0);
        });
        test('extractNewText - no previous state without selection', () => {
            testDeduceInput(null, 'a', 1, 1, true, 'a', 0);
        });
        test('extractNewText - typing does not cause a selection', () => {
            testDeduceInput(textAreaState_1.TextAreaState.EMPTY, 'a', 0, 1, true, 'a', 0);
        });
        test('extractNewText - had the textarea empty', () => {
            testDeduceInput(textAreaState_1.TextAreaState.EMPTY, 'a', 1, 1, true, 'a', 0);
        });
        test('extractNewText - had the entire line selected', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('Hello world!', 0, 12, null, null), 'H', 1, 1, true, 'H', 0);
        });
        test('extractNewText - had previous text 1', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('Hello world!', 12, 12, null, null), 'Hello world!a', 13, 13, true, 'a', 0);
        });
        test('extractNewText - had previous text 2', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('Hello world!', 0, 0, null, null), 'aHello world!', 1, 1, true, 'a', 0);
        });
        test('extractNewText - had previous text 3', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('Hello world!', 6, 11, null, null), 'Hello other!', 11, 11, true, 'other', 0);
        });
        test('extractNewText - IME', () => {
            testDeduceInput(textAreaState_1.TextAreaState.EMPTY, 'これは', 3, 3, true, 'これは', 0);
        });
        test('extractNewText - isInOverwriteMode', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('Hello world!', 0, 0, null, null), 'Aello world!', 1, 1, true, 'A', 0);
        });
        test('extractMacReplacedText - does nothing if there is selection', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('Hello world!', 5, 5, null, null), 'Hellö world!', 4, 5, true, 'ö', 0);
        });
        test('extractMacReplacedText - does nothing if there is more than one extra char', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('Hello world!', 5, 5, null, null), 'Hellöö world!', 5, 5, true, 'öö', 1);
        });
        test('extractMacReplacedText - does nothing if there is more than one changed char', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('Hello world!', 5, 5, null, null), 'Helöö world!', 5, 5, true, 'öö', 2);
        });
        test('extractMacReplacedText', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('Hello world!', 5, 5, null, null), 'Hellö world!', 5, 5, true, 'ö', 1);
        });
        test('issue #25101 - First key press ignored', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('a', 0, 1, null, null), 'a', 1, 1, true, 'a', 0);
        });
        test('issue #16520 - Cmd-d of single character followed by typing same character as has no effect', () => {
            testDeduceInput(new textAreaState_1.TextAreaState('x x', 0, 1, null, null), 'x x', 1, 1, true, 'x', 0);
        });
        function testDeduceAndroidCompositionInput(prevState, value, selectionStart, selectionEnd, expected, expectedReplacePrevCharCnt, expectedReplaceNextCharCnt, expectedPositionDelta) {
            prevState = prevState || textAreaState_1.TextAreaState.EMPTY;
            let textArea = new MockTextAreaWrapper();
            textArea._value = value;
            textArea._selectionStart = selectionStart;
            textArea._selectionEnd = selectionEnd;
            let newState = textAreaState_1.TextAreaState.readFromTextArea(textArea);
            let actual = textAreaState_1.TextAreaState.deduceAndroidCompositionInput(prevState, newState);
            assert.deepStrictEqual(actual, {
                text: expected,
                replacePrevCharCnt: expectedReplacePrevCharCnt,
                replaceNextCharCnt: expectedReplaceNextCharCnt,
                positionDelta: expectedPositionDelta,
            });
            textArea.dispose();
        }
        test('Android composition input 1', () => {
            testDeduceAndroidCompositionInput(new textAreaState_1.TextAreaState('Microsoft', 4, 4, null, null), 'Microsoft', 4, 4, '', 0, 0, 0);
        });
        test('Android composition input 2', () => {
            testDeduceAndroidCompositionInput(new textAreaState_1.TextAreaState('Microsoft', 4, 4, null, null), 'Microsoft', 0, 9, '', 0, 0, 5);
        });
        test('Android composition input 3', () => {
            testDeduceAndroidCompositionInput(new textAreaState_1.TextAreaState('Microsoft', 0, 9, null, null), 'Microsoft\'s', 11, 11, '\'s', 0, 0, 0);
        });
        test('Android backspace', () => {
            testDeduceAndroidCompositionInput(new textAreaState_1.TextAreaState('undefinedVariable', 2, 2, null, null), 'udefinedVariable', 1, 1, '', 1, 0, 0);
        });
        suite('PagedScreenReaderStrategy', () => {
            function testPagedScreenReaderStrategy(lines, selection, expected) {
                const model = (0, testTextModel_1.createTextModel)(lines.join('\n'));
                const actual = textAreaState_1.PagedScreenReaderStrategy.fromEditorSelection(textAreaState_1.TextAreaState.EMPTY, model, selection, 10, true);
                assert.ok(equalsTextAreaState(actual, expected));
                model.dispose();
            }
            test('simple', () => {
                testPagedScreenReaderStrategy([
                    'Hello world!'
                ], new selection_1.Selection(1, 13, 1, 13), new textAreaState_1.TextAreaState('Hello world!', 12, 12, new position_1.Position(1, 13), new position_1.Position(1, 13)));
                testPagedScreenReaderStrategy([
                    'Hello world!'
                ], new selection_1.Selection(1, 1, 1, 1), new textAreaState_1.TextAreaState('Hello world!', 0, 0, new position_1.Position(1, 1), new position_1.Position(1, 1)));
                testPagedScreenReaderStrategy([
                    'Hello world!'
                ], new selection_1.Selection(1, 1, 1, 6), new textAreaState_1.TextAreaState('Hello world!', 0, 5, new position_1.Position(1, 1), new position_1.Position(1, 6)));
            });
            test('multiline', () => {
                testPagedScreenReaderStrategy([
                    'Hello world!',
                    'How are you?'
                ], new selection_1.Selection(1, 1, 1, 1), new textAreaState_1.TextAreaState('Hello world!\nHow are you?', 0, 0, new position_1.Position(1, 1), new position_1.Position(1, 1)));
                testPagedScreenReaderStrategy([
                    'Hello world!',
                    'How are you?'
                ], new selection_1.Selection(2, 1, 2, 1), new textAreaState_1.TextAreaState('Hello world!\nHow are you?', 13, 13, new position_1.Position(2, 1), new position_1.Position(2, 1)));
            });
            test('page', () => {
                testPagedScreenReaderStrategy([
                    'L1\nL2\nL3\nL4\nL5\nL6\nL7\nL8\nL9\nL10\nL11\nL12\nL13\nL14\nL15\nL16\nL17\nL18\nL19\nL20\nL21'
                ], new selection_1.Selection(1, 1, 1, 1), new textAreaState_1.TextAreaState('L1\nL2\nL3\nL4\nL5\nL6\nL7\nL8\nL9\nL10\n', 0, 0, new position_1.Position(1, 1), new position_1.Position(1, 1)));
                testPagedScreenReaderStrategy([
                    'L1\nL2\nL3\nL4\nL5\nL6\nL7\nL8\nL9\nL10\nL11\nL12\nL13\nL14\nL15\nL16\nL17\nL18\nL19\nL20\nL21'
                ], new selection_1.Selection(11, 1, 11, 1), new textAreaState_1.TextAreaState('L11\nL12\nL13\nL14\nL15\nL16\nL17\nL18\nL19\nL20\n', 0, 0, new position_1.Position(11, 1), new position_1.Position(11, 1)));
                testPagedScreenReaderStrategy([
                    'L1\nL2\nL3\nL4\nL5\nL6\nL7\nL8\nL9\nL10\nL11\nL12\nL13\nL14\nL15\nL16\nL17\nL18\nL19\nL20\nL21'
                ], new selection_1.Selection(12, 1, 12, 1), new textAreaState_1.TextAreaState('L11\nL12\nL13\nL14\nL15\nL16\nL17\nL18\nL19\nL20\n', 4, 4, new position_1.Position(12, 1), new position_1.Position(12, 1)));
                testPagedScreenReaderStrategy([
                    'L1\nL2\nL3\nL4\nL5\nL6\nL7\nL8\nL9\nL10\nL11\nL12\nL13\nL14\nL15\nL16\nL17\nL18\nL19\nL20\nL21'
                ], new selection_1.Selection(21, 1, 21, 1), new textAreaState_1.TextAreaState('L21', 0, 0, new position_1.Position(21, 1), new position_1.Position(21, 1)));
            });
        });
    });
});
//# sourceMappingURL=textAreaState.test.js.map