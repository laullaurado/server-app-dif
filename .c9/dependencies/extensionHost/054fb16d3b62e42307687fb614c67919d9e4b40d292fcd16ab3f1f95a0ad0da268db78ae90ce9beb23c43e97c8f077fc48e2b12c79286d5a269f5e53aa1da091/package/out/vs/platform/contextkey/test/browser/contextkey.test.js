define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextkey/browser/contextKeyService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/serviceCollection", "vs/platform/instantiation/test/common/instantiationServiceMock"], function (require, exports, assert, lifecycle_1, uri_1, configuration_1, testConfigurationService_1, contextKeyService_1, contextkey_1, serviceCollection_1, instantiationServiceMock_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ContextKeyService', () => {
        test('updateParent', () => {
            const root = new contextKeyService_1.ContextKeyService(new testConfigurationService_1.TestConfigurationService());
            const parent1 = root.createScoped(document.createElement('div'));
            const parent2 = root.createScoped(document.createElement('div'));
            const child = parent1.createScoped(document.createElement('div'));
            parent1.createKey('testA', 1);
            parent1.createKey('testB', 2);
            parent1.createKey('testD', 0);
            parent2.createKey('testA', 3);
            parent2.createKey('testC', 4);
            parent2.createKey('testD', 0);
            let complete;
            let reject;
            const p = new Promise((_complete, _reject) => {
                complete = _complete;
                reject = _reject;
            });
            child.onDidChangeContext(e => {
                try {
                    assert.ok(e.affectsSome(new Set(['testA'])), 'testA changed');
                    assert.ok(e.affectsSome(new Set(['testB'])), 'testB changed');
                    assert.ok(e.affectsSome(new Set(['testC'])), 'testC changed');
                    assert.ok(!e.affectsSome(new Set(['testD'])), 'testD did not change');
                    assert.strictEqual(child.getContextKeyValue('testA'), 3);
                    assert.strictEqual(child.getContextKeyValue('testB'), undefined);
                    assert.strictEqual(child.getContextKeyValue('testC'), 4);
                    assert.strictEqual(child.getContextKeyValue('testD'), 0);
                }
                catch (err) {
                    reject(err);
                    return;
                }
                complete();
            });
            child.updateParent(parent2);
            return p;
        });
        test('issue #147732: URIs as context values', () => {
            const disposables = new lifecycle_1.DisposableStore();
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            const contextKeyService = disposables.add(new contextKeyService_1.ContextKeyService(configurationService));
            const instantiationService = new instantiationServiceMock_1.TestInstantiationService(new serviceCollection_1.ServiceCollection([configuration_1.IConfigurationService, configurationService], [contextkey_1.IContextKeyService, contextKeyService]));
            const uri = uri_1.URI.parse('test://abc');
            contextKeyService.createKey('notebookCellResource', undefined).set(uri.toString());
            instantiationService.invokeFunction(contextKeyService_1.setContext, 'jupyter.runByLineCells', JSON.parse(JSON.stringify([uri])));
            const expr = contextkey_1.ContextKeyExpr.in('notebookCellResource', 'jupyter.runByLineCells');
            assert.deepStrictEqual(contextKeyService.contextMatchesRules(expr), true);
        });
    });
});
//# sourceMappingURL=contextkey.test.js.map