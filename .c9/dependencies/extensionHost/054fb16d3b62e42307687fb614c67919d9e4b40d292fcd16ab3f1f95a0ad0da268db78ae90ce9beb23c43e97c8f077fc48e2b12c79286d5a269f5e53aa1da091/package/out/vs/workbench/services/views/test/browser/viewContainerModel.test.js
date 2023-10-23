/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "sinon", "vs/workbench/common/views", "vs/base/common/lifecycle", "vs/base/common/arrays", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/browser/contextKeyService", "vs/workbench/services/views/browser/viewDescriptorService", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/descriptors", "vs/platform/storage/common/storage", "vs/base/common/event", "vs/workbench/services/views/common/viewContainerModel"], function (require, exports, assert, sinon, views_1, lifecycle_1, arrays_1, workbenchTestServices_1, contextkey_1, contextKeyService_1, viewDescriptorService_1, platform_1, descriptors_1, storage_1, event_1, viewContainerModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ViewContainerRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
    const ViewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    class ViewDescriptorSequence {
        constructor(model) {
            this.disposables = [];
            this.elements = [...model.visibleViewDescriptors];
            model.onDidAddVisibleViewDescriptors(added => added.forEach(({ viewDescriptor, index }) => this.elements.splice(index, 0, viewDescriptor)), null, this.disposables);
            model.onDidRemoveVisibleViewDescriptors(removed => removed.sort((a, b) => b.index - a.index).forEach(({ index }) => this.elements.splice(index, 1)), null, this.disposables);
            model.onDidMoveVisibleViewDescriptors(({ from, to }) => (0, arrays_1.move)(this.elements, from.index, to.index), null, this.disposables);
        }
        dispose() {
            this.disposables = (0, lifecycle_1.dispose)(this.disposables);
        }
    }
    suite('ViewContainerModel', () => {
        let container;
        let disposableStore;
        let contextKeyService;
        let viewDescriptorService;
        let storageService;
        setup(() => {
            disposableStore = new lifecycle_1.DisposableStore();
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposableStore);
            contextKeyService = instantiationService.createInstance(contextKeyService_1.ContextKeyService);
            instantiationService.stub(contextkey_1.IContextKeyService, contextKeyService);
            storageService = instantiationService.get(storage_1.IStorageService);
            viewDescriptorService = instantiationService.createInstance(viewDescriptorService_1.ViewDescriptorService);
        });
        teardown(() => {
            disposableStore.dispose();
            ViewsRegistry.deregisterViews(ViewsRegistry.getViews(container), container);
            ViewContainerRegistry.deregisterViewContainer(container);
        });
        test('empty model', function () {
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0);
        });
        test('register/unregister', () => {
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            const target = disposableStore.add(new ViewDescriptorSequence(testObject));
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0);
            assert.strictEqual(target.elements.length, 0);
            const viewDescriptor = {
                id: 'view1',
                ctorDescriptor: null,
                name: 'Test View 1'
            };
            ViewsRegistry.registerViews([viewDescriptor], container);
            assert.strictEqual(testObject.visibleViewDescriptors.length, 1);
            assert.strictEqual(target.elements.length, 1);
            assert.deepStrictEqual(testObject.visibleViewDescriptors[0], viewDescriptor);
            assert.deepStrictEqual(target.elements[0], viewDescriptor);
            ViewsRegistry.deregisterViews([viewDescriptor], container);
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0);
            assert.strictEqual(target.elements.length, 0);
        });
        test('when contexts', async function () {
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            const target = disposableStore.add(new ViewDescriptorSequence(testObject));
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0);
            assert.strictEqual(target.elements.length, 0);
            const viewDescriptor = {
                id: 'view1',
                ctorDescriptor: null,
                name: 'Test View 1',
                when: contextkey_1.ContextKeyExpr.equals('showview1', true)
            };
            ViewsRegistry.registerViews([viewDescriptor], container);
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0, 'view should not appear since context isnt in');
            assert.strictEqual(target.elements.length, 0);
            const key = contextKeyService.createKey('showview1', false);
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0, 'view should still not appear since showview1 isnt true');
            assert.strictEqual(target.elements.length, 0);
            key.set(true);
            await new Promise(c => setTimeout(c, 30));
            assert.strictEqual(testObject.visibleViewDescriptors.length, 1, 'view should appear');
            assert.strictEqual(target.elements.length, 1);
            assert.deepStrictEqual(testObject.visibleViewDescriptors[0], viewDescriptor);
            assert.strictEqual(target.elements[0], viewDescriptor);
            key.set(false);
            await new Promise(c => setTimeout(c, 30));
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0, 'view should disappear');
            assert.strictEqual(target.elements.length, 0);
            ViewsRegistry.deregisterViews([viewDescriptor], container);
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0, 'view should not be there anymore');
            assert.strictEqual(target.elements.length, 0);
            key.set(true);
            await new Promise(c => setTimeout(c, 30));
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0, 'view should not be there anymore');
            assert.strictEqual(target.elements.length, 0);
        });
        test('when contexts - multiple', async function () {
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            const target = disposableStore.add(new ViewDescriptorSequence(testObject));
            const view1 = { id: 'view1', ctorDescriptor: null, name: 'Test View 1' };
            const view2 = { id: 'view2', ctorDescriptor: null, name: 'Test View 2', when: contextkey_1.ContextKeyExpr.equals('showview2', true) };
            ViewsRegistry.registerViews([view1, view2], container);
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view1], 'only view1 should be visible');
            assert.deepStrictEqual(target.elements, [view1], 'only view1 should be visible');
            const key = contextKeyService.createKey('showview2', false);
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view1], 'still only view1 should be visible');
            assert.deepStrictEqual(target.elements, [view1], 'still only view1 should be visible');
            key.set(true);
            await new Promise(c => setTimeout(c, 30));
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view1, view2], 'both views should be visible');
            assert.deepStrictEqual(target.elements, [view1, view2], 'both views should be visible');
            ViewsRegistry.deregisterViews([view1, view2], container);
        });
        test('when contexts - multiple 2', async function () {
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            const target = disposableStore.add(new ViewDescriptorSequence(testObject));
            const view1 = { id: 'view1', ctorDescriptor: null, name: 'Test View 1', when: contextkey_1.ContextKeyExpr.equals('showview1', true) };
            const view2 = { id: 'view2', ctorDescriptor: null, name: 'Test View 2' };
            ViewsRegistry.registerViews([view1, view2], container);
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view2], 'only view2 should be visible');
            assert.deepStrictEqual(target.elements, [view2], 'only view2 should be visible');
            const key = contextKeyService.createKey('showview1', false);
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view2], 'still only view2 should be visible');
            assert.deepStrictEqual(target.elements, [view2], 'still only view2 should be visible');
            key.set(true);
            await new Promise(c => setTimeout(c, 30));
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view1, view2], 'both views should be visible');
            assert.deepStrictEqual(target.elements, [view1, view2], 'both views should be visible');
            ViewsRegistry.deregisterViews([view1, view2], container);
        });
        test('setVisible', () => {
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            const target = disposableStore.add(new ViewDescriptorSequence(testObject));
            const view1 = { id: 'view1', ctorDescriptor: null, name: 'Test View 1', canToggleVisibility: true };
            const view2 = { id: 'view2', ctorDescriptor: null, name: 'Test View 2', canToggleVisibility: true };
            const view3 = { id: 'view3', ctorDescriptor: null, name: 'Test View 3', canToggleVisibility: true };
            ViewsRegistry.registerViews([view1, view2, view3], container);
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view1, view2, view3]);
            assert.deepStrictEqual(target.elements, [view1, view2, view3]);
            testObject.setVisible('view2', true);
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view1, view2, view3], 'nothing should happen');
            assert.deepStrictEqual(target.elements, [view1, view2, view3]);
            testObject.setVisible('view2', false);
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view1, view3], 'view2 should hide');
            assert.deepStrictEqual(target.elements, [view1, view3]);
            testObject.setVisible('view1', false);
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view3], 'view1 should hide');
            assert.deepStrictEqual(target.elements, [view3]);
            testObject.setVisible('view3', false);
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [], 'view3 shoud hide');
            assert.deepStrictEqual(target.elements, []);
            testObject.setVisible('view1', true);
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view1], 'view1 should show');
            assert.deepStrictEqual(target.elements, [view1]);
            testObject.setVisible('view3', true);
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view1, view3], 'view3 should show');
            assert.deepStrictEqual(target.elements, [view1, view3]);
            testObject.setVisible('view2', true);
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view1, view2, view3], 'view2 should show');
            assert.deepStrictEqual(target.elements, [view1, view2, view3]);
            ViewsRegistry.deregisterViews([view1, view2, view3], container);
            assert.deepStrictEqual(testObject.visibleViewDescriptors, []);
            assert.deepStrictEqual(target.elements, []);
        });
        test('move', () => {
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            const target = disposableStore.add(new ViewDescriptorSequence(testObject));
            const view1 = { id: 'view1', ctorDescriptor: null, name: 'Test View 1' };
            const view2 = { id: 'view2', ctorDescriptor: null, name: 'Test View 2' };
            const view3 = { id: 'view3', ctorDescriptor: null, name: 'Test View 3' };
            ViewsRegistry.registerViews([view1, view2, view3], container);
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view1, view2, view3], 'model views should be OK');
            assert.deepStrictEqual(target.elements, [view1, view2, view3], 'sql views should be OK');
            testObject.move('view3', 'view1');
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view3, view1, view2], 'view3 should go to the front');
            assert.deepStrictEqual(target.elements, [view3, view1, view2]);
            testObject.move('view1', 'view2');
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view3, view2, view1], 'view1 should go to the end');
            assert.deepStrictEqual(target.elements, [view3, view2, view1]);
            testObject.move('view1', 'view3');
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view1, view3, view2], 'view1 should go to the front');
            assert.deepStrictEqual(target.elements, [view1, view3, view2]);
            testObject.move('view2', 'view3');
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view1, view2, view3], 'view2 should go to the middle');
            assert.deepStrictEqual(target.elements, [view1, view2, view3]);
        });
        test('view states', async function () {
            storageService.store(`${container.id}.state.hidden`, JSON.stringify([{ id: 'view1', isHidden: true }]), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            const target = disposableStore.add(new ViewDescriptorSequence(testObject));
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0);
            assert.strictEqual(target.elements.length, 0);
            const viewDescriptor = {
                id: 'view1',
                ctorDescriptor: null,
                name: 'Test View 1'
            };
            ViewsRegistry.registerViews([viewDescriptor], container);
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0, 'view should not appear since it was set not visible in view state');
            assert.strictEqual(target.elements.length, 0);
        });
        test('view states and when contexts', async function () {
            storageService.store(`${container.id}.state.hidden`, JSON.stringify([{ id: 'view1', isHidden: true }]), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            const target = disposableStore.add(new ViewDescriptorSequence(testObject));
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0);
            assert.strictEqual(target.elements.length, 0);
            const viewDescriptor = {
                id: 'view1',
                ctorDescriptor: null,
                name: 'Test View 1',
                when: contextkey_1.ContextKeyExpr.equals('showview1', true)
            };
            ViewsRegistry.registerViews([viewDescriptor], container);
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0, 'view should not appear since context isnt in');
            assert.strictEqual(target.elements.length, 0);
            const key = contextKeyService.createKey('showview1', false);
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0, 'view should still not appear since showview1 isnt true');
            assert.strictEqual(target.elements.length, 0);
            key.set(true);
            await new Promise(c => setTimeout(c, 30));
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0, 'view should still not appear since it was set not visible in view state');
            assert.strictEqual(target.elements.length, 0);
        });
        test('view states and when contexts multiple views', async function () {
            storageService.store(`${container.id}.state.hidden`, JSON.stringify([{ id: 'view1', isHidden: true }]), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            const target = disposableStore.add(new ViewDescriptorSequence(testObject));
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0);
            assert.strictEqual(target.elements.length, 0);
            const view1 = {
                id: 'view1',
                ctorDescriptor: null,
                name: 'Test View 1',
                when: contextkey_1.ContextKeyExpr.equals('showview', true)
            };
            const view2 = {
                id: 'view2',
                ctorDescriptor: null,
                name: 'Test View 2',
            };
            const view3 = {
                id: 'view3',
                ctorDescriptor: null,
                name: 'Test View 3',
                when: contextkey_1.ContextKeyExpr.equals('showview', true)
            };
            ViewsRegistry.registerViews([view1, view2, view3], container);
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view2], 'Only view2 should be visible');
            assert.deepStrictEqual(target.elements, [view2]);
            const key = contextKeyService.createKey('showview', false);
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view2], 'Only view2 should be visible');
            assert.deepStrictEqual(target.elements, [view2]);
            key.set(true);
            await new Promise(c => setTimeout(c, 30));
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view2, view3], 'view3 should be visible');
            assert.deepStrictEqual(target.elements, [view2, view3]);
            key.set(false);
            await new Promise(c => setTimeout(c, 30));
            assert.deepStrictEqual(testObject.visibleViewDescriptors, [view2], 'Only view2 should be visible');
            assert.deepStrictEqual(target.elements, [view2]);
        });
        test('remove event is not triggered if view was hidden and removed', async function () {
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            const target = disposableStore.add(new ViewDescriptorSequence(testObject));
            const viewDescriptor = {
                id: 'view1',
                ctorDescriptor: null,
                name: 'Test View 1',
                when: contextkey_1.ContextKeyExpr.equals('showview1', true),
                canToggleVisibility: true
            };
            ViewsRegistry.registerViews([viewDescriptor], container);
            const key = contextKeyService.createKey('showview1', true);
            await new Promise(c => setTimeout(c, 30));
            assert.strictEqual(testObject.visibleViewDescriptors.length, 1, 'view should appear after context is set');
            assert.strictEqual(target.elements.length, 1);
            testObject.setVisible('view1', false);
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0, 'view should disappear after setting visibility to false');
            assert.strictEqual(target.elements.length, 0);
            const targetEvent = sinon.spy();
            testObject.onDidRemoveVisibleViewDescriptors(targetEvent);
            key.set(false);
            await new Promise(c => setTimeout(c, 30));
            assert.ok(!targetEvent.called, 'remove event should not be called since it is already hidden');
        });
        test('add event is not triggered if view was set visible (when visible) and not active', async function () {
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            const target = disposableStore.add(new ViewDescriptorSequence(testObject));
            const viewDescriptor = {
                id: 'view1',
                ctorDescriptor: null,
                name: 'Test View 1',
                when: contextkey_1.ContextKeyExpr.equals('showview1', true),
                canToggleVisibility: true
            };
            const key = contextKeyService.createKey('showview1', true);
            key.set(false);
            ViewsRegistry.registerViews([viewDescriptor], container);
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0);
            assert.strictEqual(target.elements.length, 0);
            const targetEvent = sinon.spy();
            testObject.onDidAddVisibleViewDescriptors(targetEvent);
            testObject.setVisible('view1', true);
            assert.ok(!targetEvent.called, 'add event should not be called since it is already visible');
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0);
            assert.strictEqual(target.elements.length, 0);
        });
        test('remove event is not triggered if view was hidden and not active', async function () {
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            const target = disposableStore.add(new ViewDescriptorSequence(testObject));
            const viewDescriptor = {
                id: 'view1',
                ctorDescriptor: null,
                name: 'Test View 1',
                when: contextkey_1.ContextKeyExpr.equals('showview1', true),
                canToggleVisibility: true
            };
            const key = contextKeyService.createKey('showview1', true);
            key.set(false);
            ViewsRegistry.registerViews([viewDescriptor], container);
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0);
            assert.strictEqual(target.elements.length, 0);
            const targetEvent = sinon.spy();
            testObject.onDidAddVisibleViewDescriptors(targetEvent);
            testObject.setVisible('view1', false);
            assert.ok(!targetEvent.called, 'add event should not be called since it is disabled');
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0);
            assert.strictEqual(target.elements.length, 0);
        });
        test('add event is not triggered if view was set visible (when not visible) and not active', async function () {
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            const target = disposableStore.add(new ViewDescriptorSequence(testObject));
            const viewDescriptor = {
                id: 'view1',
                ctorDescriptor: null,
                name: 'Test View 1',
                when: contextkey_1.ContextKeyExpr.equals('showview1', true),
                canToggleVisibility: true
            };
            const key = contextKeyService.createKey('showview1', true);
            key.set(false);
            ViewsRegistry.registerViews([viewDescriptor], container);
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0);
            assert.strictEqual(target.elements.length, 0);
            testObject.setVisible('view1', false);
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0);
            assert.strictEqual(target.elements.length, 0);
            const targetEvent = sinon.spy();
            testObject.onDidAddVisibleViewDescriptors(targetEvent);
            testObject.setVisible('view1', true);
            assert.ok(!targetEvent.called, 'add event should not be called since it is disabled');
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0);
            assert.strictEqual(target.elements.length, 0);
        });
        test('added view descriptors are in ascending order in the event', async function () {
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            const target = disposableStore.add(new ViewDescriptorSequence(testObject));
            ViewsRegistry.registerViews([{
                    id: 'view5',
                    ctorDescriptor: null,
                    name: 'Test View 5',
                    canToggleVisibility: true,
                    order: 5
                }, {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: 'Test View 2',
                    canToggleVisibility: true,
                    order: 2
                }], container);
            assert.strictEqual(target.elements.length, 2);
            assert.strictEqual(target.elements[0].id, 'view2');
            assert.strictEqual(target.elements[1].id, 'view5');
            ViewsRegistry.registerViews([{
                    id: 'view4',
                    ctorDescriptor: null,
                    name: 'Test View 4',
                    canToggleVisibility: true,
                    order: 4
                }, {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: 'Test View 3',
                    canToggleVisibility: true,
                    order: 3
                }, {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: 'Test View 1',
                    canToggleVisibility: true,
                    order: 1
                }], container);
            assert.strictEqual(target.elements.length, 5);
            assert.strictEqual(target.elements[0].id, 'view1');
            assert.strictEqual(target.elements[1].id, 'view2');
            assert.strictEqual(target.elements[2].id, 'view3');
            assert.strictEqual(target.elements[3].id, 'view4');
            assert.strictEqual(target.elements[4].id, 'view5');
        });
        test('add event is triggered only once when view is set visible while it is set active', async function () {
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            const target = disposableStore.add(new ViewDescriptorSequence(testObject));
            const viewDescriptor = {
                id: 'view1',
                ctorDescriptor: null,
                name: 'Test View 1',
                when: contextkey_1.ContextKeyExpr.equals('showview1', true),
                canToggleVisibility: true
            };
            const key = contextKeyService.createKey('showview1', true);
            key.set(false);
            ViewsRegistry.registerViews([viewDescriptor], container);
            testObject.setVisible('view1', false);
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0);
            assert.strictEqual(target.elements.length, 0);
            const targetEvent = sinon.spy();
            testObject.onDidAddVisibleViewDescriptors(targetEvent);
            event_1.Event.once(testObject.onDidChangeActiveViewDescriptors)(() => testObject.setVisible('view1', true));
            key.set(true);
            await new Promise(c => setTimeout(c, 30));
            assert.strictEqual(targetEvent.callCount, 1);
            assert.strictEqual(testObject.visibleViewDescriptors.length, 1);
            assert.strictEqual(target.elements.length, 1);
            assert.strictEqual(target.elements[0].id, 'view1');
        });
        test('add event is not triggered only when view is set hidden while it is set active', async function () {
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            const target = disposableStore.add(new ViewDescriptorSequence(testObject));
            const viewDescriptor = {
                id: 'view1',
                ctorDescriptor: null,
                name: 'Test View 1',
                when: contextkey_1.ContextKeyExpr.equals('showview1', true),
                canToggleVisibility: true
            };
            const key = contextKeyService.createKey('showview1', true);
            key.set(false);
            ViewsRegistry.registerViews([viewDescriptor], container);
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0);
            assert.strictEqual(target.elements.length, 0);
            const targetEvent = sinon.spy();
            testObject.onDidAddVisibleViewDescriptors(targetEvent);
            event_1.Event.once(testObject.onDidChangeActiveViewDescriptors)(() => testObject.setVisible('view1', false));
            key.set(true);
            await new Promise(c => setTimeout(c, 30));
            assert.strictEqual(targetEvent.callCount, 0);
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0);
            assert.strictEqual(target.elements.length, 0);
        });
        test('#142087: view descriptor visibility is not reset', async function () {
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            const viewDescriptor = {
                id: 'view1',
                ctorDescriptor: null,
                name: 'Test View 1',
                canToggleVisibility: true
            };
            storageService.store((0, viewContainerModel_1.getViewsStateStorageId)('test.state'), JSON.stringify([{
                    id: viewDescriptor.id,
                    isHidden: true,
                    order: undefined
                }]), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            ViewsRegistry.registerViews([viewDescriptor], container);
            assert.strictEqual(testObject.isVisible(viewDescriptor.id), false);
            assert.strictEqual(testObject.activeViewDescriptors[0].id, viewDescriptor.id);
            assert.strictEqual(testObject.visibleViewDescriptors.length, 0);
        });
        test('remove event is triggered properly if mutliple views are hidden at the same time', async function () {
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            const target = disposableStore.add(new ViewDescriptorSequence(testObject));
            const viewDescriptor1 = {
                id: 'view1',
                ctorDescriptor: null,
                name: 'Test View 1',
                canToggleVisibility: true
            };
            const viewDescriptor2 = {
                id: 'view2',
                ctorDescriptor: null,
                name: 'Test View 2',
                canToggleVisibility: true
            };
            const viewDescriptor3 = {
                id: 'view3',
                ctorDescriptor: null,
                name: 'Test View 3',
                canToggleVisibility: true
            };
            ViewsRegistry.registerViews([viewDescriptor1, viewDescriptor2, viewDescriptor3], container);
            const remomveEvent = sinon.spy();
            testObject.onDidRemoveVisibleViewDescriptors(remomveEvent);
            const addEvent = sinon.spy();
            testObject.onDidAddVisibleViewDescriptors(addEvent);
            storageService.store((0, viewContainerModel_1.getViewsStateStorageId)('test.state'), JSON.stringify([{
                    id: viewDescriptor1.id,
                    isHidden: false,
                    order: undefined
                }, {
                    id: viewDescriptor2.id,
                    isHidden: true,
                    order: undefined
                }, {
                    id: viewDescriptor3.id,
                    isHidden: true,
                    order: undefined
                }]), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            assert.ok(!addEvent.called, 'add event should not be called');
            assert.ok(remomveEvent.calledOnce, 'remove event should be called');
            assert.deepStrictEqual(remomveEvent.args[0][0], [{
                    viewDescriptor: viewDescriptor3,
                    index: 2
                }, {
                    viewDescriptor: viewDescriptor2,
                    index: 1
                }]);
            assert.strictEqual(target.elements.length, 1);
            assert.strictEqual(target.elements[0].id, viewDescriptor1.id);
        });
        test('add event is triggered properly if mutliple views are hidden at the same time', async function () {
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            const target = disposableStore.add(new ViewDescriptorSequence(testObject));
            const viewDescriptor1 = {
                id: 'view1',
                ctorDescriptor: null,
                name: 'Test View 1',
                canToggleVisibility: true
            };
            const viewDescriptor2 = {
                id: 'view2',
                ctorDescriptor: null,
                name: 'Test View 2',
                canToggleVisibility: true
            };
            const viewDescriptor3 = {
                id: 'view3',
                ctorDescriptor: null,
                name: 'Test View 3',
                canToggleVisibility: true
            };
            ViewsRegistry.registerViews([viewDescriptor1, viewDescriptor2, viewDescriptor3], container);
            testObject.setVisible(viewDescriptor1.id, false);
            testObject.setVisible(viewDescriptor3.id, false);
            const removeEvent = sinon.spy();
            testObject.onDidRemoveVisibleViewDescriptors(removeEvent);
            const addEvent = sinon.spy();
            testObject.onDidAddVisibleViewDescriptors(addEvent);
            storageService.store((0, viewContainerModel_1.getViewsStateStorageId)('test.state'), JSON.stringify([{
                    id: viewDescriptor1.id,
                    isHidden: false,
                    order: undefined
                }, {
                    id: viewDescriptor2.id,
                    isHidden: false,
                    order: undefined
                }, {
                    id: viewDescriptor3.id,
                    isHidden: false,
                    order: undefined
                }]), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            assert.ok(!removeEvent.called, 'remove event should not be called');
            assert.ok(addEvent.calledOnce, 'add event should be called once');
            assert.deepStrictEqual(addEvent.args[0][0], [{
                    viewDescriptor: viewDescriptor1,
                    index: 0,
                    collapsed: false,
                    size: undefined
                }, {
                    viewDescriptor: viewDescriptor3,
                    index: 2,
                    collapsed: false,
                    size: undefined
                }]);
            assert.strictEqual(target.elements.length, 3);
            assert.strictEqual(target.elements[0].id, viewDescriptor1.id);
            assert.strictEqual(target.elements[1].id, viewDescriptor2.id);
            assert.strictEqual(target.elements[2].id, viewDescriptor3.id);
        });
        test('add and remove events are triggered properly if mutliple views are hidden and added at the same time', async function () {
            container = ViewContainerRegistry.registerViewContainer({ id: 'test', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const testObject = viewDescriptorService.getViewContainerModel(container);
            const target = disposableStore.add(new ViewDescriptorSequence(testObject));
            const viewDescriptor1 = {
                id: 'view1',
                ctorDescriptor: null,
                name: 'Test View 1',
                canToggleVisibility: true
            };
            const viewDescriptor2 = {
                id: 'view2',
                ctorDescriptor: null,
                name: 'Test View 2',
                canToggleVisibility: true
            };
            const viewDescriptor3 = {
                id: 'view3',
                ctorDescriptor: null,
                name: 'Test View 3',
                canToggleVisibility: true
            };
            const viewDescriptor4 = {
                id: 'view4',
                ctorDescriptor: null,
                name: 'Test View 4',
                canToggleVisibility: true
            };
            ViewsRegistry.registerViews([viewDescriptor1, viewDescriptor2, viewDescriptor3, viewDescriptor4], container);
            testObject.setVisible(viewDescriptor1.id, false);
            const removeEvent = sinon.spy();
            testObject.onDidRemoveVisibleViewDescriptors(removeEvent);
            const addEvent = sinon.spy();
            testObject.onDidAddVisibleViewDescriptors(addEvent);
            storageService.store((0, viewContainerModel_1.getViewsStateStorageId)('test.state'), JSON.stringify([{
                    id: viewDescriptor1.id,
                    isHidden: false,
                    order: undefined
                }, {
                    id: viewDescriptor2.id,
                    isHidden: true,
                    order: undefined
                }, {
                    id: viewDescriptor3.id,
                    isHidden: false,
                    order: undefined
                }, {
                    id: viewDescriptor4.id,
                    isHidden: true,
                    order: undefined
                }]), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            assert.ok(removeEvent.calledOnce, 'remove event should be called once');
            assert.deepStrictEqual(removeEvent.args[0][0], [{
                    viewDescriptor: viewDescriptor4,
                    index: 2
                }, {
                    viewDescriptor: viewDescriptor2,
                    index: 0
                }]);
            assert.ok(addEvent.calledOnce, 'add event should be called once');
            assert.deepStrictEqual(addEvent.args[0][0], [{
                    viewDescriptor: viewDescriptor1,
                    index: 0,
                    collapsed: false,
                    size: undefined
                }]);
            assert.strictEqual(target.elements.length, 2);
            assert.strictEqual(target.elements[0].id, viewDescriptor1.id);
            assert.strictEqual(target.elements[1].id, viewDescriptor3.id);
        });
    });
});
//# sourceMappingURL=viewContainerModel.test.js.map