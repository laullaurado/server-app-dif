define(["require", "exports", "assert", "vs/base/browser/indexedDB", "vs/base/test/common/testUtils"], function (require, exports, assert, indexedDB_1, testUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, testUtils_1.flakySuite)('IndexedDB', () => {
        let indexedDB;
        setup(async () => {
            indexedDB = await indexedDB_1.IndexedDB.create('vscode-indexeddb-test', 1, ['test-store']);
            await indexedDB.runInTransaction('test-store', 'readwrite', store => store.clear());
        });
        teardown(() => {
            if (indexedDB) {
                indexedDB.close();
            }
        });
        test('runInTransaction', async () => {
            await indexedDB.runInTransaction('test-store', 'readwrite', store => store.add('hello1', 'key1'));
            const value = await indexedDB.runInTransaction('test-store', 'readonly', store => store.get('key1'));
            assert.deepStrictEqual(value, 'hello1');
        });
        test('getKeyValues', async () => {
            await indexedDB.runInTransaction('test-store', 'readwrite', store => {
                const requests = [];
                requests.push(store.add('hello1', 'key1'));
                requests.push(store.add('hello2', 'key2'));
                requests.push(store.add(true, 'key3'));
                return requests;
            });
            function isValid(value) {
                return typeof value === 'string';
            }
            const keyValues = await indexedDB.getKeyValues('test-store', isValid);
            assert.strictEqual(keyValues.size, 2);
            assert.strictEqual(keyValues.get('key1'), 'hello1');
            assert.strictEqual(keyValues.get('key2'), 'hello2');
        });
        test('hasPendingTransactions', async () => {
            const promise = indexedDB.runInTransaction('test-store', 'readwrite', store => store.add('hello2', 'key2'));
            assert.deepStrictEqual(indexedDB.hasPendingTransactions(), true);
            await promise;
            assert.deepStrictEqual(indexedDB.hasPendingTransactions(), false);
        });
        test('close', async () => {
            const promise = indexedDB.runInTransaction('test-store', 'readwrite', store => store.add('hello3', 'key3'));
            indexedDB.close();
            assert.deepStrictEqual(indexedDB.hasPendingTransactions(), false);
            try {
                await promise;
                assert.fail('Transaction should be aborted');
            }
            catch (error) { }
        });
    });
});
//# sourceMappingURL=indexedDB.test.js.map