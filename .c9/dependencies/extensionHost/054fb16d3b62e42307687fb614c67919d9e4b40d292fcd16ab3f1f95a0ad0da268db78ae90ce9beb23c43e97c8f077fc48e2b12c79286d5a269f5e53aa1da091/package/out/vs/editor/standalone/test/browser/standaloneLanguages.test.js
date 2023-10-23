/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/languages", "vs/editor/common/languages/supports/tokenization", "vs/editor/common/services/languageService", "vs/editor/standalone/browser/standaloneLanguages", "vs/platform/theme/browser/iconsStyleSheet", "vs/platform/theme/common/theme"], function (require, exports, assert, event_1, lifecycle_1, languages_1, tokenization_1, languageService_1, standaloneLanguages_1, iconsStyleSheet_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TokenizationSupport2Adapter', () => {
        const languageId = 'tttt';
        // const tokenMetadata = (LanguageId.PlainText << MetadataConsts.LANGUAGEID_OFFSET);
        class MockTokenTheme extends tokenization_1.TokenTheme {
            constructor() {
                super(null, null);
                this.counter = 0;
            }
            match(languageId, token) {
                return (((this.counter++) << 15 /* MetadataConsts.FOREGROUND_OFFSET */)
                    | (languageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */)) >>> 0;
            }
        }
        class MockThemeService {
            constructor() {
                this._builtInProductIconTheme = new iconsStyleSheet_1.UnthemedProductIconTheme();
                this.onDidColorThemeChange = new event_1.Emitter().event;
                this.onDidFileIconThemeChange = new event_1.Emitter().event;
                this.onDidProductIconThemeChange = new event_1.Emitter().event;
            }
            setTheme(themeName) {
                throw new Error('Not implemented');
            }
            setAutoDetectHighContrast(autoDetectHighContrast) {
                throw new Error('Not implemented');
            }
            defineTheme(themeName, themeData) {
                throw new Error('Not implemented');
            }
            getColorTheme() {
                return {
                    label: 'mock',
                    tokenTheme: new MockTokenTheme(),
                    themeName: theme_1.ColorScheme.LIGHT,
                    type: theme_1.ColorScheme.LIGHT,
                    getColor: (color, useDefault) => {
                        throw new Error('Not implemented');
                    },
                    defines: (color) => {
                        throw new Error('Not implemented');
                    },
                    getTokenStyleMetadata: (type, modifiers, modelLanguage) => {
                        return undefined;
                    },
                    semanticHighlighting: false,
                    tokenColorMap: []
                };
            }
            setColorMapOverride(colorMapOverride) {
            }
            getFileIconTheme() {
                return {
                    hasFileIcons: false,
                    hasFolderIcons: false,
                    hidesExplorerArrows: false
                };
            }
            getProductIconTheme() {
                return this._builtInProductIconTheme;
            }
        }
        class MockState {
            constructor() { }
            clone() {
                return this;
            }
            equals(other) {
                return this === other;
            }
        }
        MockState.INSTANCE = new MockState();
        function testBadTokensProvider(providerTokens, expectedClassicTokens, expectedModernTokens) {
            class BadTokensProvider {
                getInitialState() {
                    return MockState.INSTANCE;
                }
                tokenize(line, state) {
                    return {
                        tokens: providerTokens,
                        endState: MockState.INSTANCE
                    };
                }
            }
            const disposables = new lifecycle_1.DisposableStore();
            const languageService = disposables.add(new languageService_1.LanguageService());
            disposables.add(languageService.registerLanguage({ id: languageId }));
            const adapter = new standaloneLanguages_1.TokenizationSupportAdapter(languageId, new BadTokensProvider(), languageService, new MockThemeService());
            const actualClassicTokens = adapter.tokenize('whatever', true, MockState.INSTANCE);
            assert.deepStrictEqual(actualClassicTokens.tokens, expectedClassicTokens);
            const actualModernTokens = adapter.tokenizeEncoded('whatever', true, MockState.INSTANCE);
            const modernTokens = [];
            for (let i = 0; i < actualModernTokens.tokens.length; i++) {
                modernTokens[i] = actualModernTokens.tokens[i];
            }
            // Add the encoded language id to the expected tokens
            const encodedLanguageId = languageService.languageIdCodec.encodeLanguageId(languageId);
            const tokenLanguageMetadata = (encodedLanguageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */);
            for (let i = 1; i < expectedModernTokens.length; i += 2) {
                expectedModernTokens[i] |= tokenLanguageMetadata;
            }
            assert.deepStrictEqual(modernTokens, expectedModernTokens);
            disposables.dispose();
        }
        test('tokens always start at index 0', () => {
            testBadTokensProvider([
                { startIndex: 7, scopes: 'foo' },
                { startIndex: 0, scopes: 'bar' }
            ], [
                new languages_1.Token(0, 'foo', languageId),
                new languages_1.Token(0, 'bar', languageId),
            ], [
                0, (0 << 15 /* MetadataConsts.FOREGROUND_OFFSET */),
                0, (1 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)
            ]);
        });
        test('tokens always start after each other', () => {
            testBadTokensProvider([
                { startIndex: 0, scopes: 'foo' },
                { startIndex: 5, scopes: 'bar' },
                { startIndex: 3, scopes: 'foo' },
            ], [
                new languages_1.Token(0, 'foo', languageId),
                new languages_1.Token(5, 'bar', languageId),
                new languages_1.Token(5, 'foo', languageId),
            ], [
                0, (0 << 15 /* MetadataConsts.FOREGROUND_OFFSET */),
                5, (1 << 15 /* MetadataConsts.FOREGROUND_OFFSET */),
                5, (2 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)
            ]);
        });
    });
});
//# sourceMappingURL=standaloneLanguages.test.js.map