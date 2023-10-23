/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/emmet/browser/emmetActions", "vs/editor/test/browser/testCodeEditor", "assert", "vs/base/common/lifecycle", "vs/editor/common/languages/language"], function (require, exports, emmetActions_1, testCodeEditor_1, assert, lifecycle_1, language_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MockGrammarContributions {
        constructor(scopeName) {
            this.scopeName = scopeName;
        }
        getGrammar(mode) {
            return this.scopeName;
        }
    }
    suite('Emmet', () => {
        test('Get language mode and parent mode for emmet', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([], {}, (editor, viewModel, instantiationService) => {
                const languageService = instantiationService.get(language_1.ILanguageService);
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add(languageService.registerLanguage({ id: 'markdown' }));
                disposables.add(languageService.registerLanguage({ id: 'handlebars' }));
                disposables.add(languageService.registerLanguage({ id: 'nunjucks' }));
                disposables.add(languageService.registerLanguage({ id: 'laravel-blade' }));
                function testIsEnabled(mode, scopeName, expectedLanguage, expectedParentLanguage) {
                    const model = editor.getModel();
                    if (!model) {
                        assert.fail('Editor model not found');
                    }
                    model.setMode(mode);
                    let langOutput = emmetActions_1.EmmetEditorAction.getLanguage(editor, new MockGrammarContributions(scopeName));
                    if (!langOutput) {
                        assert.fail('langOutput not found');
                    }
                    assert.strictEqual(langOutput.language, expectedLanguage);
                    assert.strictEqual(langOutput.parentMode, expectedParentLanguage);
                }
                // syntaxes mapped using the scope name of the grammar
                testIsEnabled('markdown', 'text.html.markdown', 'markdown', 'html');
                testIsEnabled('handlebars', 'text.html.handlebars', 'handlebars', 'html');
                testIsEnabled('nunjucks', 'text.html.nunjucks', 'nunjucks', 'html');
                testIsEnabled('laravel-blade', 'text.html.php.laravel-blade', 'laravel-blade', 'html');
                // languages that have different Language Id and scopeName
                // testIsEnabled('razor', 'text.html.cshtml', 'razor', 'html');
                // testIsEnabled('HTML (Eex)', 'text.html.elixir', 'boo', 'html');
                disposables.dispose();
            });
        });
    });
});
//# sourceMappingURL=emmetAction.test.js.map