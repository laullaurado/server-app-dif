/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "assert", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/browser/parts/editor/editorPlaceholder", "vs/workbench/common/editor", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/descriptors", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/common/editor/textResourceEditorInput", "vs/platform/theme/test/common/testThemeService", "vs/base/common/uri", "vs/workbench/browser/editor", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/workbench/test/common/workbenchTestServices", "vs/base/common/resources", "vs/workbench/services/editor/browser/editorService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/workspaces/test/common/testWorkspaceTrustService", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/common/editor/editorInput", "vs/platform/configuration/test/common/testConfigurationService"], function (require, exports, assert, editorPane_1, editorPlaceholder_1, editor_1, platform_1, descriptors_1, telemetry_1, telemetryUtils_1, workbenchTestServices_1, textResourceEditorInput_1, testThemeService_1, uri_1, editor_2, cancellation_1, lifecycle_1, workbenchTestServices_2, resources_1, editorService_1, editorService_2, editorGroupsService_1, testWorkspaceTrustService_1, workspaceTrust_1, editorInput_1, testConfigurationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OtherTestEditor = void 0;
    const NullThemeService = new testThemeService_1.TestThemeService();
    const editorRegistry = platform_1.Registry.as(editor_1.EditorExtensions.EditorPane);
    const editorInputRegistry = platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory);
    let TestEditor = class TestEditor extends editorPane_1.EditorPane {
        constructor(telemetryService) {
            super('TestEditor', telemetryUtils_1.NullTelemetryService, NullThemeService, new workbenchTestServices_2.TestStorageService());
        }
        getId() { return 'testEditor'; }
        layout() { }
        createEditor() { }
    };
    TestEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService)
    ], TestEditor);
    let OtherTestEditor = class OtherTestEditor extends editorPane_1.EditorPane {
        constructor(telemetryService) {
            super('testOtherEditor', telemetryUtils_1.NullTelemetryService, NullThemeService, new workbenchTestServices_2.TestStorageService());
        }
        getId() { return 'testOtherEditor'; }
        layout() { }
        createEditor() { }
    };
    OtherTestEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService)
    ], OtherTestEditor);
    exports.OtherTestEditor = OtherTestEditor;
    class TestInputSerializer {
        canSerialize(editorInput) {
            return true;
        }
        serialize(input) {
            return input.toString();
        }
        deserialize(instantiationService, raw) {
            return {};
        }
    }
    class TestInput extends editorInput_1.EditorInput {
        constructor() {
            super(...arguments);
            this.resource = undefined;
        }
        prefersEditorPane(editors) {
            return editors[1];
        }
        get typeId() {
            return 'testInput';
        }
        resolve() {
            return null;
        }
    }
    class OtherTestInput extends editorInput_1.EditorInput {
        constructor() {
            super(...arguments);
            this.resource = undefined;
        }
        get typeId() {
            return 'otherTestInput';
        }
        resolve() {
            return null;
        }
    }
    class TestResourceEditorInput extends textResourceEditorInput_1.TextResourceEditorInput {
    }
    suite('EditorPane', () => {
        test('EditorPane API', async () => {
            const editor = new TestEditor(telemetryUtils_1.NullTelemetryService);
            const input = new OtherTestInput();
            const options = {};
            assert(!editor.isVisible());
            assert(!editor.input);
            await editor.setInput(input, options, Object.create(null), cancellation_1.CancellationToken.None);
            assert.strictEqual(input, editor.input);
            const group = new workbenchTestServices_1.TestEditorGroupView(1);
            editor.setVisible(true, group);
            assert(editor.isVisible());
            assert.strictEqual(editor.group, group);
            input.onWillDispose(() => {
                assert(false);
            });
            editor.dispose();
            editor.clearInput();
            editor.setVisible(false, group);
            assert(!editor.isVisible());
            assert(!editor.input);
            assert(!editor.getControl());
        });
        test('EditorPaneDescriptor', () => {
            const editorDescriptor = editor_2.EditorPaneDescriptor.create(TestEditor, 'id', 'name');
            assert.strictEqual(editorDescriptor.typeId, 'id');
            assert.strictEqual(editorDescriptor.name, 'name');
        });
        test('Editor Pane Registration', function () {
            const editorDescriptor1 = editor_2.EditorPaneDescriptor.create(TestEditor, 'id1', 'name');
            const editorDescriptor2 = editor_2.EditorPaneDescriptor.create(OtherTestEditor, 'id2', 'name');
            const oldEditorsCnt = editorRegistry.getEditorPanes().length;
            const oldInputCnt = editorRegistry.getEditors().length;
            const dispose1 = editorRegistry.registerEditorPane(editorDescriptor1, [new descriptors_1.SyncDescriptor(TestInput)]);
            const dispose2 = editorRegistry.registerEditorPane(editorDescriptor2, [new descriptors_1.SyncDescriptor(TestInput), new descriptors_1.SyncDescriptor(OtherTestInput)]);
            assert.strictEqual(editorRegistry.getEditorPanes().length, oldEditorsCnt + 2);
            assert.strictEqual(editorRegistry.getEditors().length, oldInputCnt + 3);
            assert.strictEqual(editorRegistry.getEditorPane(new TestInput()), editorDescriptor2);
            assert.strictEqual(editorRegistry.getEditorPane(new OtherTestInput()), editorDescriptor2);
            assert.strictEqual(editorRegistry.getEditorPaneByType('id1'), editorDescriptor1);
            assert.strictEqual(editorRegistry.getEditorPaneByType('id2'), editorDescriptor2);
            assert(!editorRegistry.getEditorPaneByType('id3'));
            (0, lifecycle_1.dispose)([dispose1, dispose2]);
        });
        test('Editor Pane Lookup favors specific class over superclass (match on specific class)', function () {
            const d1 = editor_2.EditorPaneDescriptor.create(TestEditor, 'id1', 'name');
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add((0, workbenchTestServices_1.registerTestResourceEditor)());
            disposables.add(editorRegistry.registerEditorPane(d1, [new descriptors_1.SyncDescriptor(TestResourceEditorInput)]));
            const inst = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const editor = editorRegistry.getEditorPane(inst.createInstance(TestResourceEditorInput, uri_1.URI.file('/fake'), 'fake', '', undefined, undefined)).instantiate(inst);
            assert.strictEqual(editor.getId(), 'testEditor');
            const otherEditor = editorRegistry.getEditorPane(inst.createInstance(textResourceEditorInput_1.TextResourceEditorInput, uri_1.URI.file('/fake'), 'fake', '', undefined, undefined)).instantiate(inst);
            assert.strictEqual(otherEditor.getId(), 'workbench.editors.textResourceEditor');
            disposables.dispose();
        });
        test('Editor Pane Lookup favors specific class over superclass (match on super class)', function () {
            const disposables = new lifecycle_1.DisposableStore();
            const inst = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            disposables.add((0, workbenchTestServices_1.registerTestResourceEditor)());
            const editor = editorRegistry.getEditorPane(inst.createInstance(TestResourceEditorInput, uri_1.URI.file('/fake'), 'fake', '', undefined, undefined)).instantiate(inst);
            assert.strictEqual('workbench.editors.textResourceEditor', editor.getId());
            disposables.dispose();
        });
        test('Editor Input Serializer', function () {
            const disposables = new lifecycle_1.DisposableStore();
            const testInput = new workbenchTestServices_1.TestEditorInput(uri_1.URI.file('/fake'), 'testTypeId');
            (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables).invokeFunction(accessor => editorInputRegistry.start(accessor));
            disposables.add(editorInputRegistry.registerEditorSerializer(testInput.typeId, TestInputSerializer));
            let factory = editorInputRegistry.getEditorSerializer('testTypeId');
            assert(factory);
            factory = editorInputRegistry.getEditorSerializer(testInput);
            assert(factory);
            // throws when registering serializer for same type
            assert.throws(() => editorInputRegistry.registerEditorSerializer(testInput.typeId, TestInputSerializer));
            disposables.dispose();
        });
        test('EditorMemento - basics', function () {
            const testGroup0 = new workbenchTestServices_1.TestEditorGroupView(0);
            const testGroup1 = new workbenchTestServices_1.TestEditorGroupView(1);
            const testGroup4 = new workbenchTestServices_1.TestEditorGroupView(4);
            const configurationService = new workbenchTestServices_1.TestTextResourceConfigurationService();
            const editorGroupService = new workbenchTestServices_1.TestEditorGroupsService([
                testGroup0,
                testGroup1,
                new workbenchTestServices_1.TestEditorGroupView(2)
            ]);
            const rawMemento = Object.create(null);
            let memento = new editorPane_1.EditorMemento('id', 'key', rawMemento, 3, editorGroupService, configurationService);
            let res = memento.loadEditorState(testGroup0, uri_1.URI.file('/A'));
            assert.ok(!res);
            memento.saveEditorState(testGroup0, uri_1.URI.file('/A'), { line: 3 });
            res = memento.loadEditorState(testGroup0, uri_1.URI.file('/A'));
            assert.ok(res);
            assert.strictEqual(res.line, 3);
            memento.saveEditorState(testGroup1, uri_1.URI.file('/A'), { line: 5 });
            res = memento.loadEditorState(testGroup1, uri_1.URI.file('/A'));
            assert.ok(res);
            assert.strictEqual(res.line, 5);
            // Ensure capped at 3 elements
            memento.saveEditorState(testGroup0, uri_1.URI.file('/B'), { line: 1 });
            memento.saveEditorState(testGroup0, uri_1.URI.file('/C'), { line: 1 });
            memento.saveEditorState(testGroup0, uri_1.URI.file('/D'), { line: 1 });
            memento.saveEditorState(testGroup0, uri_1.URI.file('/E'), { line: 1 });
            assert.ok(!memento.loadEditorState(testGroup0, uri_1.URI.file('/A')));
            assert.ok(!memento.loadEditorState(testGroup0, uri_1.URI.file('/B')));
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/C')));
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/D')));
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/E')));
            // Save at an unknown group
            memento.saveEditorState(testGroup4, uri_1.URI.file('/E'), { line: 1 });
            assert.ok(memento.loadEditorState(testGroup4, uri_1.URI.file('/E'))); // only gets removed when memento is saved
            memento.saveEditorState(testGroup4, uri_1.URI.file('/C'), { line: 1 });
            assert.ok(memento.loadEditorState(testGroup4, uri_1.URI.file('/C'))); // only gets removed when memento is saved
            memento.saveState();
            memento = new editorPane_1.EditorMemento('id', 'key', rawMemento, 3, editorGroupService, configurationService);
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/C')));
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/D')));
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/E')));
            // Check on entries no longer there from invalid groups
            assert.ok(!memento.loadEditorState(testGroup4, uri_1.URI.file('/E')));
            assert.ok(!memento.loadEditorState(testGroup4, uri_1.URI.file('/C')));
            memento.clearEditorState(uri_1.URI.file('/C'), testGroup4);
            memento.clearEditorState(uri_1.URI.file('/E'));
            assert.ok(!memento.loadEditorState(testGroup4, uri_1.URI.file('/C')));
            assert.ok(memento.loadEditorState(testGroup0, uri_1.URI.file('/D')));
            assert.ok(!memento.loadEditorState(testGroup0, uri_1.URI.file('/E')));
        });
        test('EditorMemento - move', function () {
            const testGroup0 = new workbenchTestServices_1.TestEditorGroupView(0);
            const configurationService = new workbenchTestServices_1.TestTextResourceConfigurationService();
            const editorGroupService = new workbenchTestServices_1.TestEditorGroupsService([testGroup0]);
            const rawMemento = Object.create(null);
            const memento = new editorPane_1.EditorMemento('id', 'key', rawMemento, 3, editorGroupService, configurationService);
            memento.saveEditorState(testGroup0, uri_1.URI.file('/some/folder/file-1.txt'), { line: 1 });
            memento.saveEditorState(testGroup0, uri_1.URI.file('/some/folder/file-2.txt'), { line: 2 });
            memento.saveEditorState(testGroup0, uri_1.URI.file('/some/other/file.txt'), { line: 3 });
            memento.moveEditorState(uri_1.URI.file('/some/folder/file-1.txt'), uri_1.URI.file('/some/folder/file-moved.txt'), resources_1.extUri);
            let res = memento.loadEditorState(testGroup0, uri_1.URI.file('/some/folder/file-1.txt'));
            assert.ok(!res);
            res = memento.loadEditorState(testGroup0, uri_1.URI.file('/some/folder/file-moved.txt'));
            assert.strictEqual(res === null || res === void 0 ? void 0 : res.line, 1);
            memento.moveEditorState(uri_1.URI.file('/some/folder'), uri_1.URI.file('/some/folder-moved'), resources_1.extUri);
            res = memento.loadEditorState(testGroup0, uri_1.URI.file('/some/folder-moved/file-moved.txt'));
            assert.strictEqual(res === null || res === void 0 ? void 0 : res.line, 1);
            res = memento.loadEditorState(testGroup0, uri_1.URI.file('/some/folder-moved/file-2.txt'));
            assert.strictEqual(res === null || res === void 0 ? void 0 : res.line, 2);
        });
        test('EditoMemento - use with editor input', function () {
            const testGroup0 = new workbenchTestServices_1.TestEditorGroupView(0);
            class TestEditorInput extends editorInput_1.EditorInput {
                constructor(resource, id = 'testEditorInputForMementoTest') {
                    super();
                    this.resource = resource;
                    this.id = id;
                }
                get typeId() { return 'testEditorInputForMementoTest'; }
                async resolve() { return null; }
                matches(other) {
                    return other && this.id === other.id && other instanceof TestEditorInput;
                }
            }
            const rawMemento = Object.create(null);
            const memento = new editorPane_1.EditorMemento('id', 'key', rawMemento, 3, new workbenchTestServices_1.TestEditorGroupsService(), new workbenchTestServices_1.TestTextResourceConfigurationService());
            const testInputA = new TestEditorInput(uri_1.URI.file('/A'));
            let res = memento.loadEditorState(testGroup0, testInputA);
            assert.ok(!res);
            memento.saveEditorState(testGroup0, testInputA, { line: 3 });
            res = memento.loadEditorState(testGroup0, testInputA);
            assert.ok(res);
            assert.strictEqual(res.line, 3);
            // State removed when input gets disposed
            testInputA.dispose();
            res = memento.loadEditorState(testGroup0, testInputA);
            assert.ok(!res);
        });
        test('EditoMemento - clear on editor dispose', function () {
            const testGroup0 = new workbenchTestServices_1.TestEditorGroupView(0);
            class TestEditorInput extends editorInput_1.EditorInput {
                constructor(resource, id = 'testEditorInputForMementoTest') {
                    super();
                    this.resource = resource;
                    this.id = id;
                }
                get typeId() { return 'testEditorInputForMementoTest'; }
                async resolve() { return null; }
                matches(other) {
                    return other && this.id === other.id && other instanceof TestEditorInput;
                }
            }
            const rawMemento = Object.create(null);
            const memento = new editorPane_1.EditorMemento('id', 'key', rawMemento, 3, new workbenchTestServices_1.TestEditorGroupsService(), new workbenchTestServices_1.TestTextResourceConfigurationService());
            const testInputA = new TestEditorInput(uri_1.URI.file('/A'));
            let res = memento.loadEditorState(testGroup0, testInputA);
            assert.ok(!res);
            memento.saveEditorState(testGroup0, testInputA.resource, { line: 3 });
            res = memento.loadEditorState(testGroup0, testInputA);
            assert.ok(res);
            assert.strictEqual(res.line, 3);
            // State not yet removed when input gets disposed
            // because we used resource
            testInputA.dispose();
            res = memento.loadEditorState(testGroup0, testInputA);
            assert.ok(res);
            const testInputB = new TestEditorInput(uri_1.URI.file('/B'));
            res = memento.loadEditorState(testGroup0, testInputB);
            assert.ok(!res);
            memento.saveEditorState(testGroup0, testInputB.resource, { line: 3 });
            res = memento.loadEditorState(testGroup0, testInputB);
            assert.ok(res);
            assert.strictEqual(res.line, 3);
            memento.clearEditorStateOnDispose(testInputB.resource, testInputB);
            // State removed when input gets disposed
            testInputB.dispose();
            res = memento.loadEditorState(testGroup0, testInputB);
            assert.ok(!res);
        });
        test('EditorMemento - workbench.editor.sharedViewState', function () {
            const testGroup0 = new workbenchTestServices_1.TestEditorGroupView(0);
            const testGroup1 = new workbenchTestServices_1.TestEditorGroupView(1);
            const configurationService = new workbenchTestServices_1.TestTextResourceConfigurationService(new testConfigurationService_1.TestConfigurationService({
                workbench: {
                    editor: {
                        sharedViewState: true
                    }
                }
            }));
            const editorGroupService = new workbenchTestServices_1.TestEditorGroupsService([testGroup0]);
            const rawMemento = Object.create(null);
            const memento = new editorPane_1.EditorMemento('id', 'key', rawMemento, 3, editorGroupService, configurationService);
            const resource = uri_1.URI.file('/some/folder/file-1.txt');
            memento.saveEditorState(testGroup0, resource, { line: 1 });
            let res = memento.loadEditorState(testGroup0, resource);
            assert.strictEqual(res.line, 1);
            res = memento.loadEditorState(testGroup1, resource);
            assert.strictEqual(res.line, 1);
            memento.saveEditorState(testGroup0, resource, { line: 3 });
            res = memento.loadEditorState(testGroup1, resource);
            assert.strictEqual(res.line, 3);
            memento.saveEditorState(testGroup1, resource, { line: 1 });
            res = memento.loadEditorState(testGroup1, resource);
            assert.strictEqual(res.line, 1);
            memento.clearEditorState(resource, testGroup0);
            memento.clearEditorState(resource, testGroup1);
            res = memento.loadEditorState(testGroup1, resource);
            assert.strictEqual(res.line, 1);
            memento.clearEditorState(resource);
            res = memento.loadEditorState(testGroup1, resource);
            assert.ok(!res);
        });
        test('WorkspaceTrustRequiredEditor', async function () {
            var _a;
            let TrustRequiredTestEditor = class TrustRequiredTestEditor extends editorPane_1.EditorPane {
                constructor(telemetryService) {
                    super('TestEditor', telemetryUtils_1.NullTelemetryService, NullThemeService, new workbenchTestServices_2.TestStorageService());
                }
                getId() { return 'trustRequiredTestEditor'; }
                layout() { }
                createEditor() { }
            };
            TrustRequiredTestEditor = __decorate([
                __param(0, telemetry_1.ITelemetryService)
            ], TrustRequiredTestEditor);
            class TrustRequiredTestInput extends editorInput_1.EditorInput {
                constructor() {
                    super(...arguments);
                    this.resource = undefined;
                }
                get typeId() {
                    return 'trustRequiredTestInput';
                }
                get capabilities() {
                    return 16 /* EditorInputCapabilities.RequiresTrust */;
                }
                resolve() {
                    return null;
                }
            }
            const disposables = new lifecycle_1.DisposableStore();
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const workspaceTrustService = instantiationService.createInstance(testWorkspaceTrustService_1.TestWorkspaceTrustManagementService);
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, workspaceTrustService);
            workspaceTrustService.setWorkspaceTrust(false);
            const editorPart = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, editorPart);
            const editorService = instantiationService.createInstance(editorService_1.EditorService);
            instantiationService.stub(editorService_2.IEditorService, editorService);
            const group = editorPart.activeGroup;
            const editorDescriptor = editor_2.EditorPaneDescriptor.create(TrustRequiredTestEditor, 'id1', 'name');
            disposables.add(editorRegistry.registerEditorPane(editorDescriptor, [new descriptors_1.SyncDescriptor(TrustRequiredTestInput)]));
            const testInput = new TrustRequiredTestInput();
            await group.openEditor(testInput);
            assert.strictEqual((_a = group.activeEditorPane) === null || _a === void 0 ? void 0 : _a.getId(), editorPlaceholder_1.WorkspaceTrustRequiredPlaceholderEditor.ID);
            const getEditorPaneIdAsync = () => new Promise(resolve => {
                disposables.add(editorService.onDidActiveEditorChange(() => {
                    var _a;
                    resolve((_a = group.activeEditorPane) === null || _a === void 0 ? void 0 : _a.getId());
                }));
            });
            workspaceTrustService.setWorkspaceTrust(true);
            assert.strictEqual(await getEditorPaneIdAsync(), 'trustRequiredTestEditor');
            workspaceTrustService.setWorkspaceTrust(false);
            assert.strictEqual(await getEditorPaneIdAsync(), editorPlaceholder_1.WorkspaceTrustRequiredPlaceholderEditor.ID);
            (0, lifecycle_1.dispose)(disposables);
        });
    });
});
//# sourceMappingURL=editorPane.test.js.map