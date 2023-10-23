/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/extensions/common/extensions", "sinon", "vs/workbench/contrib/notebook/browser/notebookRendererMessagingServiceImpl", "assert", "vs/base/common/async"], function (require, exports, extensions_1, sinon_1, notebookRendererMessagingServiceImpl_1, assert, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookRendererMessaging', () => {
        let extService;
        let m;
        let sent = [];
        setup(() => {
            sent = [];
            extService = new extensions_1.NullExtensionService();
            m = new notebookRendererMessagingServiceImpl_1.NotebookRendererMessagingService(extService);
            m.onShouldPostMessage(e => sent.push(e));
        });
        test('activates on prepare', () => {
            const activate = (0, sinon_1.stub)(extService, 'activateByEvent').returns(Promise.resolve());
            m.prepare('foo');
            m.prepare('foo');
            m.prepare('foo');
            assert.deepStrictEqual(activate.args, [['onRenderer:foo']]);
        });
        test('buffers and then plays events', async () => {
            (0, sinon_1.stub)(extService, 'activateByEvent').returns(Promise.resolve());
            const scoped = m.getScoped('some-editor');
            scoped.postMessage('foo', 1);
            scoped.postMessage('foo', 2);
            assert.deepStrictEqual(sent, []);
            await (0, async_1.timeout)(0);
            const expected = [
                { editorId: 'some-editor', rendererId: 'foo', message: 1 },
                { editorId: 'some-editor', rendererId: 'foo', message: 2 }
            ];
            assert.deepStrictEqual(sent, expected);
            scoped.postMessage('foo', 3);
            assert.deepStrictEqual(sent, [
                ...expected,
                { editorId: 'some-editor', rendererId: 'foo', message: 3 }
            ]);
        });
    });
});
//# sourceMappingURL=notebookRendererMessagingService.test.js.map