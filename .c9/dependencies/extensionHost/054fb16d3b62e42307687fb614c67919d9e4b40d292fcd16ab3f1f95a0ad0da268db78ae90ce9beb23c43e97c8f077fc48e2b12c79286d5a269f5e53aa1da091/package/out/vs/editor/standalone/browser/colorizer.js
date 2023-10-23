/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/tokens/lineTokens", "vs/editor/common/languages", "vs/editor/common/viewLayout/viewLineRenderer", "vs/editor/common/viewModel", "vs/editor/standalone/common/monarch/monarchLexer"], function (require, exports, strings, lineTokens_1, languages_1, viewLineRenderer_1, viewModel_1, monarchLexer_1) {
    "use strict";
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Colorizer = void 0;
    const ttPolicy = (_a = window.trustedTypes) === null || _a === void 0 ? void 0 : _a.createPolicy('standaloneColorizer', { createHTML: value => value });
    class Colorizer {
        static colorizeElement(themeService, languageService, domNode, options) {
            options = options || {};
            const theme = options.theme || 'vs';
            const mimeType = options.mimeType || domNode.getAttribute('lang') || domNode.getAttribute('data-lang');
            if (!mimeType) {
                console.error('Mode not detected');
                return Promise.resolve();
            }
            const languageId = languageService.getLanguageIdByMimeType(mimeType) || mimeType;
            themeService.setTheme(theme);
            const text = domNode.firstChild ? domNode.firstChild.nodeValue : '';
            domNode.className += ' ' + theme;
            const render = (str) => {
                var _a;
                const trustedhtml = (_a = ttPolicy === null || ttPolicy === void 0 ? void 0 : ttPolicy.createHTML(str)) !== null && _a !== void 0 ? _a : str;
                domNode.innerHTML = trustedhtml;
            };
            return this.colorize(languageService, text || '', languageId, options).then(render, (err) => console.error(err));
        }
        static async colorize(languageService, text, languageId, options) {
            const languageIdCodec = languageService.languageIdCodec;
            let tabSize = 4;
            if (options && typeof options.tabSize === 'number') {
                tabSize = options.tabSize;
            }
            if (strings.startsWithUTF8BOM(text)) {
                text = text.substr(1);
            }
            const lines = strings.splitLines(text);
            if (!languageService.isRegisteredLanguageId(languageId)) {
                return _fakeColorize(lines, tabSize, languageIdCodec);
            }
            const tokenizationSupport = await languages_1.TokenizationRegistry.getOrCreate(languageId);
            if (tokenizationSupport) {
                return _colorize(lines, tabSize, tokenizationSupport, languageIdCodec);
            }
            return _fakeColorize(lines, tabSize, languageIdCodec);
        }
        static colorizeLine(line, mightContainNonBasicASCII, mightContainRTL, tokens, tabSize = 4) {
            const isBasicASCII = viewModel_1.ViewLineRenderingData.isBasicASCII(line, mightContainNonBasicASCII);
            const containsRTL = viewModel_1.ViewLineRenderingData.containsRTL(line, isBasicASCII, mightContainRTL);
            const renderResult = (0, viewLineRenderer_1.renderViewLine2)(new viewLineRenderer_1.RenderLineInput(false, true, line, false, isBasicASCII, containsRTL, 0, tokens, [], tabSize, 0, 0, 0, 0, -1, 'none', false, false, null));
            return renderResult.html;
        }
        static colorizeModelLine(model, lineNumber, tabSize = 4) {
            const content = model.getLineContent(lineNumber);
            model.tokenization.forceTokenization(lineNumber);
            const tokens = model.tokenization.getLineTokens(lineNumber);
            const inflatedTokens = tokens.inflate();
            return this.colorizeLine(content, model.mightContainNonBasicASCII(), model.mightContainRTL(), inflatedTokens, tabSize);
        }
    }
    exports.Colorizer = Colorizer;
    function _colorize(lines, tabSize, tokenizationSupport, languageIdCodec) {
        return new Promise((c, e) => {
            const execute = () => {
                const result = _actualColorize(lines, tabSize, tokenizationSupport, languageIdCodec);
                if (tokenizationSupport instanceof monarchLexer_1.MonarchTokenizer) {
                    const status = tokenizationSupport.getLoadStatus();
                    if (status.loaded === false) {
                        status.promise.then(execute, e);
                        return;
                    }
                }
                c(result);
            };
            execute();
        });
    }
    function _fakeColorize(lines, tabSize, languageIdCodec) {
        let html = [];
        const defaultMetadata = ((0 /* FontStyle.None */ << 11 /* MetadataConsts.FONT_STYLE_OFFSET */)
            | (1 /* ColorId.DefaultForeground */ << 15 /* MetadataConsts.FOREGROUND_OFFSET */)
            | (2 /* ColorId.DefaultBackground */ << 24 /* MetadataConsts.BACKGROUND_OFFSET */)) >>> 0;
        const tokens = new Uint32Array(2);
        tokens[0] = 0;
        tokens[1] = defaultMetadata;
        for (let i = 0, length = lines.length; i < length; i++) {
            const line = lines[i];
            tokens[0] = line.length;
            const lineTokens = new lineTokens_1.LineTokens(tokens, line, languageIdCodec);
            const isBasicASCII = viewModel_1.ViewLineRenderingData.isBasicASCII(line, /* check for basic ASCII */ true);
            const containsRTL = viewModel_1.ViewLineRenderingData.containsRTL(line, isBasicASCII, /* check for RTL */ true);
            const renderResult = (0, viewLineRenderer_1.renderViewLine2)(new viewLineRenderer_1.RenderLineInput(false, true, line, false, isBasicASCII, containsRTL, 0, lineTokens, [], tabSize, 0, 0, 0, 0, -1, 'none', false, false, null));
            html = html.concat(renderResult.html);
            html.push('<br/>');
        }
        return html.join('');
    }
    function _actualColorize(lines, tabSize, tokenizationSupport, languageIdCodec) {
        let html = [];
        let state = tokenizationSupport.getInitialState();
        for (let i = 0, length = lines.length; i < length; i++) {
            const line = lines[i];
            const tokenizeResult = tokenizationSupport.tokenizeEncoded(line, true, state);
            lineTokens_1.LineTokens.convertToEndOffset(tokenizeResult.tokens, line.length);
            const lineTokens = new lineTokens_1.LineTokens(tokenizeResult.tokens, line, languageIdCodec);
            const isBasicASCII = viewModel_1.ViewLineRenderingData.isBasicASCII(line, /* check for basic ASCII */ true);
            const containsRTL = viewModel_1.ViewLineRenderingData.containsRTL(line, isBasicASCII, /* check for RTL */ true);
            const renderResult = (0, viewLineRenderer_1.renderViewLine2)(new viewLineRenderer_1.RenderLineInput(false, true, line, false, isBasicASCII, containsRTL, 0, lineTokens.inflate(), [], tabSize, 0, 0, 0, 0, -1, 'none', false, false, null));
            html = html.concat(renderResult.html);
            html.push('<br/>');
            state = tokenizeResult.endState;
        }
        return html.join('');
    }
});
//# sourceMappingURL=colorizer.js.map