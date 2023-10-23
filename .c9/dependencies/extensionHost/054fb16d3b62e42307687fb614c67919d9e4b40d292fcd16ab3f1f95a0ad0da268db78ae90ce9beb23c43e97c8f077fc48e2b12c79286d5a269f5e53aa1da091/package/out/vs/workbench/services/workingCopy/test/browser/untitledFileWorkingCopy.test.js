/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/stream", "vs/base/common/uri", "vs/workbench/services/workingCopy/common/untitledFileWorkingCopy", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, buffer_1, cancellation_1, event_1, lifecycle_1, network_1, resources_1, stream_1, uri_1, untitledFileWorkingCopy_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestUntitledFileWorkingCopyModelFactory = exports.TestUntitledFileWorkingCopyModel = void 0;
    class TestUntitledFileWorkingCopyModel extends lifecycle_1.Disposable {
        constructor(resource, contents) {
            super();
            this.resource = resource;
            this.contents = contents;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            this.throwOnSnapshot = false;
            this.versionId = 0;
            this.pushedStackElement = false;
        }
        fireContentChangeEvent(event) {
            this._onDidChangeContent.fire(event);
        }
        updateContents(newContents) {
            this.doUpdate(newContents);
        }
        setThrowOnSnapshot() {
            this.throwOnSnapshot = true;
        }
        async snapshot(token) {
            if (this.throwOnSnapshot) {
                throw new Error('Fail');
            }
            const stream = (0, buffer_1.newWriteableBufferStream)();
            stream.end(buffer_1.VSBuffer.fromString(this.contents));
            return stream;
        }
        async update(contents, token) {
            this.doUpdate((await (0, buffer_1.streamToBuffer)(contents)).toString());
        }
        doUpdate(newContents) {
            this.contents = newContents;
            this.versionId++;
            this._onDidChangeContent.fire({ isInitial: newContents.length === 0 });
        }
        pushStackElement() {
            this.pushedStackElement = true;
        }
        dispose() {
            this._onWillDispose.fire();
            super.dispose();
        }
    }
    exports.TestUntitledFileWorkingCopyModel = TestUntitledFileWorkingCopyModel;
    class TestUntitledFileWorkingCopyModelFactory {
        async createModel(resource, contents, token) {
            return new TestUntitledFileWorkingCopyModel(resource, (await (0, buffer_1.streamToBuffer)(contents)).toString());
        }
    }
    exports.TestUntitledFileWorkingCopyModelFactory = TestUntitledFileWorkingCopyModelFactory;
    suite('UntitledFileWorkingCopy', () => {
        const factory = new TestUntitledFileWorkingCopyModelFactory();
        let disposables;
        let resource = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'Untitled-1' });
        let instantiationService;
        let accessor;
        let workingCopy;
        function createWorkingCopy(uri = resource, hasAssociatedFilePath = false, initialValue = '') {
            return new untitledFileWorkingCopy_1.UntitledFileWorkingCopy('testUntitledWorkingCopyType', uri, (0, resources_1.basename)(uri), hasAssociatedFilePath, initialValue.length > 0 ? { value: (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString(initialValue)) } : undefined, factory, async (workingCopy) => { await workingCopy.revert(); return true; }, accessor.workingCopyService, accessor.workingCopyBackupService, accessor.logService);
        }
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            workingCopy = createWorkingCopy();
        });
        teardown(() => {
            workingCopy.dispose();
            disposables.dispose();
        });
        test('registers with working copy service', async () => {
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 1);
            workingCopy.dispose();
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 0);
        });
        test('dirty', async () => {
            var _a;
            assert.strictEqual(workingCopy.isDirty(), false);
            let changeDirtyCounter = 0;
            workingCopy.onDidChangeDirty(() => {
                changeDirtyCounter++;
            });
            let contentChangeCounter = 0;
            workingCopy.onDidChangeContent(() => {
                contentChangeCounter++;
            });
            await workingCopy.resolve();
            assert.strictEqual(workingCopy.isResolved(), true);
            // Dirty from: Model content change
            (_a = workingCopy.model) === null || _a === void 0 ? void 0 : _a.updateContents('hello dirty');
            assert.strictEqual(contentChangeCounter, 1);
            assert.strictEqual(workingCopy.isDirty(), true);
            assert.strictEqual(changeDirtyCounter, 1);
            await workingCopy.save();
            assert.strictEqual(workingCopy.isDirty(), false);
            assert.strictEqual(changeDirtyCounter, 2);
        });
        test('dirty - cleared when content event signals isEmpty', async () => {
            var _a, _b;
            assert.strictEqual(workingCopy.isDirty(), false);
            await workingCopy.resolve();
            (_a = workingCopy.model) === null || _a === void 0 ? void 0 : _a.updateContents('hello dirty');
            assert.strictEqual(workingCopy.isDirty(), true);
            (_b = workingCopy.model) === null || _b === void 0 ? void 0 : _b.fireContentChangeEvent({ isInitial: true });
            assert.strictEqual(workingCopy.isDirty(), false);
        });
        test('dirty - not cleared when content event signals isEmpty when associated resource', async () => {
            var _a, _b;
            workingCopy.dispose();
            workingCopy = createWorkingCopy(resource, true);
            await workingCopy.resolve();
            (_a = workingCopy.model) === null || _a === void 0 ? void 0 : _a.updateContents('hello dirty');
            assert.strictEqual(workingCopy.isDirty(), true);
            (_b = workingCopy.model) === null || _b === void 0 ? void 0 : _b.fireContentChangeEvent({ isInitial: true });
            assert.strictEqual(workingCopy.isDirty(), true);
        });
        test('revert', async () => {
            var _a;
            let revertCounter = 0;
            workingCopy.onDidRevert(() => {
                revertCounter++;
            });
            let disposeCounter = 0;
            workingCopy.onWillDispose(() => {
                disposeCounter++;
            });
            await workingCopy.resolve();
            (_a = workingCopy.model) === null || _a === void 0 ? void 0 : _a.updateContents('hello dirty');
            assert.strictEqual(workingCopy.isDirty(), true);
            await workingCopy.revert();
            assert.strictEqual(revertCounter, 1);
            assert.strictEqual(disposeCounter, 1);
            assert.strictEqual(workingCopy.isDirty(), false);
        });
        test('dispose', async () => {
            let disposeCounter = 0;
            workingCopy.onWillDispose(() => {
                disposeCounter++;
            });
            await workingCopy.resolve();
            workingCopy.dispose();
            assert.strictEqual(disposeCounter, 1);
        });
        test('backup', async () => {
            var _a;
            assert.strictEqual((await workingCopy.backup(cancellation_1.CancellationToken.None)).content, undefined);
            await workingCopy.resolve();
            (_a = workingCopy.model) === null || _a === void 0 ? void 0 : _a.updateContents('Hello Backup');
            const backup = await workingCopy.backup(cancellation_1.CancellationToken.None);
            let backupContents = undefined;
            if ((0, stream_1.isReadableStream)(backup.content)) {
                backupContents = (await (0, stream_1.consumeStream)(backup.content, chunks => buffer_1.VSBuffer.concat(chunks))).toString();
            }
            else if (backup.content) {
                backupContents = (0, stream_1.consumeReadable)(backup.content, chunks => buffer_1.VSBuffer.concat(chunks)).toString();
            }
            assert.strictEqual(backupContents, 'Hello Backup');
        });
        test('resolve - without contents', async () => {
            assert.strictEqual(workingCopy.isResolved(), false);
            assert.strictEqual(workingCopy.hasAssociatedFilePath, false);
            assert.strictEqual(workingCopy.model, undefined);
            await workingCopy.resolve();
            assert.strictEqual(workingCopy.isResolved(), true);
            assert.ok(workingCopy.model);
        });
        test('resolve - with initial contents', async () => {
            var _a, _b;
            workingCopy.dispose();
            workingCopy = createWorkingCopy(resource, false, 'Hello Initial');
            let contentChangeCounter = 0;
            workingCopy.onDidChangeContent(() => {
                contentChangeCounter++;
            });
            assert.strictEqual(workingCopy.isDirty(), true);
            await workingCopy.resolve();
            assert.strictEqual(workingCopy.isDirty(), true);
            assert.strictEqual((_a = workingCopy.model) === null || _a === void 0 ? void 0 : _a.contents, 'Hello Initial');
            assert.strictEqual(contentChangeCounter, 1);
            workingCopy.model.updateContents('Changed contents');
            await workingCopy.resolve(); // second resolve should be ignored
            assert.strictEqual((_b = workingCopy.model) === null || _b === void 0 ? void 0 : _b.contents, 'Changed contents');
        });
        test('backup - with initial contents uses those even if unresolved', async () => {
            workingCopy.dispose();
            workingCopy = createWorkingCopy(resource, false, 'Hello Initial');
            assert.strictEqual(workingCopy.isDirty(), true);
            const backup = (await workingCopy.backup(cancellation_1.CancellationToken.None)).content;
            if ((0, stream_1.isReadableStream)(backup)) {
                const value = await (0, buffer_1.streamToBuffer)(backup);
                assert.strictEqual(value.toString(), 'Hello Initial');
            }
            else if ((0, stream_1.isReadable)(backup)) {
                const value = (0, buffer_1.readableToBuffer)(backup);
                assert.strictEqual(value.toString(), 'Hello Initial');
            }
            else {
                assert.fail('Missing untitled backup');
            }
        });
        test('resolve - with associated resource', async () => {
            workingCopy.dispose();
            workingCopy = createWorkingCopy(resource, true);
            await workingCopy.resolve();
            assert.strictEqual(workingCopy.isDirty(), true);
            assert.strictEqual(workingCopy.hasAssociatedFilePath, true);
        });
        test('resolve - with backup', async () => {
            var _a, _b;
            await workingCopy.resolve();
            (_a = workingCopy.model) === null || _a === void 0 ? void 0 : _a.updateContents('Hello Backup');
            const backup = await workingCopy.backup(cancellation_1.CancellationToken.None);
            await accessor.workingCopyBackupService.backup(workingCopy, backup.content, undefined, backup.meta);
            assert.strictEqual(accessor.workingCopyBackupService.hasBackupSync(workingCopy), true);
            workingCopy.dispose();
            workingCopy = createWorkingCopy();
            let contentChangeCounter = 0;
            workingCopy.onDidChangeContent(() => {
                contentChangeCounter++;
            });
            await workingCopy.resolve();
            assert.strictEqual(workingCopy.isDirty(), true);
            assert.strictEqual((_b = workingCopy.model) === null || _b === void 0 ? void 0 : _b.contents, 'Hello Backup');
            assert.strictEqual(contentChangeCounter, 1);
        });
    });
});
//# sourceMappingURL=untitledFileWorkingCopy.test.js.map