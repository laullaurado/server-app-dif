/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "os", "path", "vs/base/test/node/testUtils", "vs/server/node/serverConnectionToken"], function (require, exports, assert, fs, os, path, testUtils_1, serverConnectionToken_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('parseServerConnectionToken', () => {
        function isError(r) {
            return (r instanceof serverConnectionToken_1.ServerConnectionTokenParseError);
        }
        function assertIsError(r) {
            assert.strictEqual(isError(r), true);
        }
        test('no arguments generates a token that is mandatory', async () => {
            const result = await (0, serverConnectionToken_1.parseServerConnectionToken)({}, async () => 'defaultTokenValue');
            assert.ok(!(result instanceof serverConnectionToken_1.ServerConnectionTokenParseError));
            assert.ok(result.type === 2 /* ServerConnectionTokenType.Mandatory */);
        });
        test('no arguments with --compatibility generates a token that is not mandatory', async () => {
            const result = await (0, serverConnectionToken_1.parseServerConnectionToken)({ 'compatibility': '1.63' }, async () => 'defaultTokenValue');
            assert.ok(!(result instanceof serverConnectionToken_1.ServerConnectionTokenParseError));
            assert.ok(result.type === 1 /* ServerConnectionTokenType.Optional */);
            assert.strictEqual(result.value, 'defaultTokenValue');
        });
        test('--without-connection-token', async () => {
            const result = await (0, serverConnectionToken_1.parseServerConnectionToken)({ 'without-connection-token': true }, async () => 'defaultTokenValue');
            assert.ok(!(result instanceof serverConnectionToken_1.ServerConnectionTokenParseError));
            assert.ok(result.type === 0 /* ServerConnectionTokenType.None */);
        });
        test('--without-connection-token --connection-token results in error', async () => {
            assertIsError(await (0, serverConnectionToken_1.parseServerConnectionToken)({ 'without-connection-token': true, 'connection-token': '0' }, async () => 'defaultTokenValue'));
        });
        test('--without-connection-token --connection-token-file results in error', async () => {
            assertIsError(await (0, serverConnectionToken_1.parseServerConnectionToken)({ 'without-connection-token': true, 'connection-token-file': '0' }, async () => 'defaultTokenValue'));
        });
        test('--connection-token-file --connection-token results in error', async () => {
            assertIsError(await (0, serverConnectionToken_1.parseServerConnectionToken)({ 'connection-token-file': '0', 'connection-token': '0' }, async () => 'defaultTokenValue'));
        });
        test('--connection-token-file', async function () {
            this.timeout(10000);
            const testDir = (0, testUtils_1.getRandomTestPath)(os.tmpdir(), 'vsctests', 'server-connection-token');
            fs.mkdirSync(testDir, { recursive: true });
            const filename = path.join(testDir, 'connection-token-file');
            const connectionToken = `12345-123-abc`;
            fs.writeFileSync(filename, connectionToken);
            const result = await (0, serverConnectionToken_1.parseServerConnectionToken)({ 'connection-token-file': filename }, async () => 'defaultTokenValue');
            assert.ok(!(result instanceof serverConnectionToken_1.ServerConnectionTokenParseError));
            assert.ok(result.type === 2 /* ServerConnectionTokenType.Mandatory */);
            assert.strictEqual(result.value, connectionToken);
            fs.rmSync(testDir, { recursive: true, force: true });
        });
        test('--connection-token', async () => {
            const connectionToken = `12345-123-abc`;
            const result = await (0, serverConnectionToken_1.parseServerConnectionToken)({ 'connection-token': connectionToken }, async () => 'defaultTokenValue');
            assert.ok(!(result instanceof serverConnectionToken_1.ServerConnectionTokenParseError));
            assert.ok(result.type === 2 /* ServerConnectionTokenType.Mandatory */);
            assert.strictEqual(result.value, connectionToken);
        });
        test('--connection-token --compatibility marks a as not mandatory', async () => {
            const connectionToken = `12345-123-abc`;
            const result = await (0, serverConnectionToken_1.parseServerConnectionToken)({ 'connection-token': connectionToken, 'compatibility': '1.63' }, async () => 'defaultTokenValue');
            assert.ok(!(result instanceof serverConnectionToken_1.ServerConnectionTokenParseError));
            assert.ok(result.type === 1 /* ServerConnectionTokenType.Optional */);
            assert.strictEqual(result.value, connectionToken);
        });
    });
});
//# sourceMappingURL=serverConnectionToken.test.js.map