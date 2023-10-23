/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/extensions/common/extensions", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostDocuments", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/common/extHostNotebook", "vs/workbench/api/common/extHostNotebookDocuments", "vs/workbench/api/common/extHostNotebookKernels", "vs/workbench/api/common/extHostTypes", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/proxyIdentifier", "vs/workbench/api/test/common/testRPCProtocol", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, async_1, lifecycle_1, uri_1, uuid_1, extensions_1, log_1, extHost_protocol_1, extHostCommands_1, extHostDocuments_1, extHostDocumentsAndEditors_1, extHostNotebook_1, extHostNotebookDocuments_1, extHostNotebookKernels_1, extHostTypes_1, notebookCommon_1, notebookExecutionService_1, extensions_2, proxyIdentifier_1, testRPCProtocol_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookKernel', function () {
        let rpcProtocol;
        let extHostNotebookKernels;
        let notebook;
        let extHostDocumentsAndEditors;
        let extHostDocuments;
        let extHostNotebooks;
        let extHostNotebookDocuments;
        let extHostCommands;
        const notebookUri = uri_1.URI.parse('test:///notebook.file');
        const kernelData = new Map();
        const disposables = new lifecycle_1.DisposableStore();
        const cellExecuteCreate = [];
        const cellExecuteUpdates = [];
        const cellExecuteComplete = [];
        teardown(function () {
            disposables.clear();
        });
        setup(async function () {
            cellExecuteCreate.length = 0;
            cellExecuteUpdates.length = 0;
            cellExecuteComplete.length = 0;
            kernelData.clear();
            rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadCommands, new class extends (0, workbenchTestServices_1.mock)() {
                $registerCommand() { }
            });
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadNotebookKernels, new class extends (0, workbenchTestServices_1.mock)() {
                async $addKernel(handle, data) {
                    kernelData.set(handle, data);
                }
                $removeKernel(handle) {
                    kernelData.delete(handle);
                }
                $updateKernel(handle, data) {
                    assert.strictEqual(kernelData.has(handle), true);
                    kernelData.set(handle, Object.assign(Object.assign({}, kernelData.get(handle)), data));
                }
                $createExecution(handle, controllerId, uri, cellHandle) {
                    cellExecuteCreate.push({ notebook: uri, cell: cellHandle });
                }
                $updateExecution(handle, data) {
                    cellExecuteUpdates.push(...data.value);
                }
                $completeExecution(handle, data) {
                    cellExecuteComplete.push(data.value);
                }
            });
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadNotebookDocuments, new class extends (0, workbenchTestServices_1.mock)() {
            });
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadNotebook, new class extends (0, workbenchTestServices_1.mock)() {
                async $registerNotebookProvider() { }
                async $unregisterNotebookProvider() { }
            });
            extHostDocumentsAndEditors = new extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors(rpcProtocol, new log_1.NullLogService());
            extHostDocuments = new extHostDocuments_1.ExtHostDocuments(rpcProtocol, extHostDocumentsAndEditors);
            const extHostStoragePaths = new class extends (0, workbenchTestServices_1.mock)() {
                workspaceValue() {
                    return uri_1.URI.from({ scheme: 'test', path: (0, uuid_1.generateUuid)() });
                }
            };
            extHostCommands = new extHostCommands_1.ExtHostCommands(rpcProtocol, new log_1.NullLogService());
            extHostNotebooks = new extHostNotebook_1.ExtHostNotebookController(rpcProtocol, extHostCommands, extHostDocumentsAndEditors, extHostDocuments, extHostStoragePaths);
            extHostNotebookDocuments = new extHostNotebookDocuments_1.ExtHostNotebookDocuments(extHostNotebooks);
            extHostNotebooks.$acceptDocumentAndEditorsDelta(new proxyIdentifier_1.SerializableObjectWithBuffers({
                addedDocuments: [{
                        uri: notebookUri,
                        viewType: 'test',
                        versionId: 0,
                        cells: [{
                                handle: 0,
                                uri: notebookCommon_1.CellUri.generate(notebookUri, 0),
                                source: ['### Heading'],
                                eol: '\n',
                                language: 'markdown',
                                cellKind: notebookCommon_1.CellKind.Markup,
                                outputs: [],
                            }, {
                                handle: 1,
                                uri: notebookCommon_1.CellUri.generate(notebookUri, 1),
                                source: ['console.log("aaa")', 'console.log("bbb")'],
                                eol: '\n',
                                language: 'javascript',
                                cellKind: notebookCommon_1.CellKind.Code,
                                outputs: [],
                            }],
                    }],
                addedEditors: [{
                        documentUri: notebookUri,
                        id: '_notebook_editor_0',
                        selections: [{ start: 0, end: 1 }],
                        visibleRanges: []
                    }]
            }));
            extHostNotebooks.$acceptDocumentAndEditorsDelta(new proxyIdentifier_1.SerializableObjectWithBuffers({ newActiveEditor: '_notebook_editor_0' }));
            notebook = extHostNotebooks.notebookDocuments[0];
            disposables.add(notebook);
            disposables.add(extHostDocuments);
            extHostNotebookKernels = new extHostNotebookKernels_1.ExtHostNotebookKernels(rpcProtocol, new class extends (0, workbenchTestServices_1.mock)() {
            }, extHostNotebooks, extHostCommands, new log_1.NullLogService());
        });
        test('create/dispose kernel', async function () {
            const kernel = extHostNotebookKernels.createNotebookController(extensions_2.nullExtensionDescription, 'foo', '*', 'Foo');
            assert.throws(() => kernel.id = 'dd');
            assert.throws(() => kernel.notebookType = 'dd');
            assert.ok(kernel);
            assert.strictEqual(kernel.id, 'foo');
            assert.strictEqual(kernel.label, 'Foo');
            assert.strictEqual(kernel.notebookType, '*');
            await rpcProtocol.sync();
            assert.strictEqual(kernelData.size, 1);
            let [first] = kernelData.values();
            assert.strictEqual(first.id, 'nullExtensionDescription/foo');
            assert.strictEqual(extensions_1.ExtensionIdentifier.equals(first.extensionId, extensions_2.nullExtensionDescription.identifier), true);
            assert.strictEqual(first.label, 'Foo');
            assert.strictEqual(first.notebookType, '*');
            kernel.dispose();
            await rpcProtocol.sync();
            assert.strictEqual(kernelData.size, 0);
        });
        test('update kernel', async function () {
            const kernel = extHostNotebookKernels.createNotebookController(extensions_2.nullExtensionDescription, 'foo', '*', 'Foo');
            await rpcProtocol.sync();
            assert.ok(kernel);
            let [first] = kernelData.values();
            assert.strictEqual(first.id, 'nullExtensionDescription/foo');
            assert.strictEqual(first.label, 'Foo');
            kernel.label = 'Far';
            assert.strictEqual(kernel.label, 'Far');
            await rpcProtocol.sync();
            [first] = kernelData.values();
            assert.strictEqual(first.id, 'nullExtensionDescription/foo');
            assert.strictEqual(first.label, 'Far');
        });
        test('execute - simple createNotebookCellExecution', function () {
            const kernel = extHostNotebookKernels.createNotebookController(extensions_2.nullExtensionDescription, 'foo', '*', 'Foo');
            extHostNotebookKernels.$acceptNotebookAssociation(0, notebook.uri, true);
            const cell1 = notebook.apiNotebook.cellAt(0);
            const task = kernel.createNotebookCellExecution(cell1);
            task.start();
            task.end(undefined);
        });
        test('createNotebookCellExecution, must be selected/associated', function () {
            const kernel = extHostNotebookKernels.createNotebookController(extensions_2.nullExtensionDescription, 'foo', '*', 'Foo');
            assert.throws(() => {
                kernel.createNotebookCellExecution(notebook.apiNotebook.cellAt(0));
            });
            extHostNotebookKernels.$acceptNotebookAssociation(0, notebook.uri, true);
            kernel.createNotebookCellExecution(notebook.apiNotebook.cellAt(0));
        });
        test('createNotebookCellExecution, cell must be alive', function () {
            const kernel = extHostNotebookKernels.createNotebookController(extensions_2.nullExtensionDescription, 'foo', '*', 'Foo');
            const cell1 = notebook.apiNotebook.cellAt(0);
            extHostNotebookKernels.$acceptNotebookAssociation(0, notebook.uri, true);
            extHostNotebookDocuments.$acceptModelChanged(notebook.uri, new proxyIdentifier_1.SerializableObjectWithBuffers({
                versionId: 12,
                rawEvents: [{
                        kind: notebookCommon_1.NotebookCellsChangeType.ModelChange,
                        changes: [[0, notebook.apiNotebook.cellCount, []]]
                    }]
            }), true);
            assert.strictEqual(cell1.index, -1);
            assert.throws(() => {
                kernel.createNotebookCellExecution(cell1);
            });
        });
        test('interrupt handler, cancellation', async function () {
            let interruptCallCount = 0;
            let tokenCancelCount = 0;
            const kernel = extHostNotebookKernels.createNotebookController(extensions_2.nullExtensionDescription, 'foo', '*', 'Foo');
            kernel.interruptHandler = () => { interruptCallCount += 1; };
            extHostNotebookKernels.$acceptNotebookAssociation(0, notebook.uri, true);
            const cell1 = notebook.apiNotebook.cellAt(0);
            const task = kernel.createNotebookCellExecution(cell1);
            task.token.onCancellationRequested(() => tokenCancelCount += 1);
            await extHostNotebookKernels.$cancelCells(0, notebook.uri, [0]);
            assert.strictEqual(interruptCallCount, 1);
            assert.strictEqual(tokenCancelCount, 0);
            await extHostNotebookKernels.$cancelCells(0, notebook.uri, [0]);
            assert.strictEqual(interruptCallCount, 2);
            assert.strictEqual(tokenCancelCount, 0);
        });
        test('set outputs on cancel', async function () {
            const kernel = extHostNotebookKernels.createNotebookController(extensions_2.nullExtensionDescription, 'foo', '*', 'Foo');
            extHostNotebookKernels.$acceptNotebookAssociation(0, notebook.uri, true);
            const cell1 = notebook.apiNotebook.cellAt(0);
            const task = kernel.createNotebookCellExecution(cell1);
            task.start();
            const b = new async_1.Barrier();
            task.token.onCancellationRequested(async () => {
                await task.replaceOutput(new extHostTypes_1.NotebookCellOutput([extHostTypes_1.NotebookCellOutputItem.text('canceled')]));
                task.end(true);
                b.open(); // use barrier to signal that cancellation has happened
            });
            cellExecuteUpdates.length = 0;
            await extHostNotebookKernels.$cancelCells(0, notebook.uri, [0]);
            await b.wait();
            assert.strictEqual(cellExecuteUpdates.length > 0, true);
            let found = false;
            for (let edit of cellExecuteUpdates) {
                if (edit.editType === notebookExecutionService_1.CellExecutionUpdateType.Output) {
                    assert.strictEqual(edit.append, false);
                    assert.strictEqual(edit.outputs.length, 1);
                    assert.strictEqual(edit.outputs[0].items.length, 1);
                    assert.deepStrictEqual(Array.from(edit.outputs[0].items[0].valueBytes.buffer), Array.from(new TextEncoder().encode('canceled')));
                    found = true;
                }
            }
            assert.ok(found);
        });
        test('set outputs on interrupt', async function () {
            const kernel = extHostNotebookKernels.createNotebookController(extensions_2.nullExtensionDescription, 'foo', '*', 'Foo');
            extHostNotebookKernels.$acceptNotebookAssociation(0, notebook.uri, true);
            const cell1 = notebook.apiNotebook.cellAt(0);
            const task = kernel.createNotebookCellExecution(cell1);
            task.start();
            kernel.interruptHandler = async (_notebook) => {
                assert.ok(notebook.apiNotebook === _notebook);
                await task.replaceOutput(new extHostTypes_1.NotebookCellOutput([extHostTypes_1.NotebookCellOutputItem.text('interrupted')]));
                task.end(true);
            };
            cellExecuteUpdates.length = 0;
            await extHostNotebookKernels.$cancelCells(0, notebook.uri, [0]);
            assert.strictEqual(cellExecuteUpdates.length > 0, true);
            let found = false;
            for (let edit of cellExecuteUpdates) {
                if (edit.editType === notebookExecutionService_1.CellExecutionUpdateType.Output) {
                    assert.strictEqual(edit.append, false);
                    assert.strictEqual(edit.outputs.length, 1);
                    assert.strictEqual(edit.outputs[0].items.length, 1);
                    assert.deepStrictEqual(Array.from(edit.outputs[0].items[0].valueBytes.buffer), Array.from(new TextEncoder().encode('interrupted')));
                    found = true;
                }
            }
            assert.ok(found);
        });
    });
});
//# sourceMappingURL=extHostNotebookKernel.test.js.map