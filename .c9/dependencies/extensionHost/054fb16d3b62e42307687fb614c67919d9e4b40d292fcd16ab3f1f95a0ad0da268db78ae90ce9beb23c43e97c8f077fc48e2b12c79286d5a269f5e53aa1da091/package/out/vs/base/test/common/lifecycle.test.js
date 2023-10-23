/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/test/common/utils"], function (require, exports, assert, event_1, lifecycle_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Disposable {
        constructor() {
            this.isDisposed = false;
        }
        dispose() { this.isDisposed = true; }
    }
    suite('Lifecycle', () => {
        test('dispose single disposable', () => {
            const disposable = new Disposable();
            assert(!disposable.isDisposed);
            (0, lifecycle_1.dispose)(disposable);
            assert(disposable.isDisposed);
        });
        test('dispose disposable array', () => {
            const disposable = new Disposable();
            const disposable2 = new Disposable();
            assert(!disposable.isDisposed);
            assert(!disposable2.isDisposed);
            (0, lifecycle_1.dispose)([disposable, disposable2]);
            assert(disposable.isDisposed);
            assert(disposable2.isDisposed);
        });
        test('dispose disposables', () => {
            const disposable = new Disposable();
            const disposable2 = new Disposable();
            assert(!disposable.isDisposed);
            assert(!disposable2.isDisposed);
            (0, lifecycle_1.dispose)(disposable);
            (0, lifecycle_1.dispose)(disposable2);
            assert(disposable.isDisposed);
            assert(disposable2.isDisposed);
        });
        test('dispose array should dispose all if a child throws on dispose', () => {
            const disposedValues = new Set();
            let thrownError;
            try {
                (0, lifecycle_1.dispose)([
                    (0, lifecycle_1.toDisposable)(() => { disposedValues.add(1); }),
                    (0, lifecycle_1.toDisposable)(() => { throw new Error('I am error'); }),
                    (0, lifecycle_1.toDisposable)(() => { disposedValues.add(3); }),
                ]);
            }
            catch (e) {
                thrownError = e;
            }
            assert.ok(disposedValues.has(1));
            assert.ok(disposedValues.has(3));
            assert.strictEqual(thrownError.message, 'I am error');
        });
        test('dispose array should rethrow composite error if multiple entries throw on dispose', () => {
            const disposedValues = new Set();
            let thrownError;
            try {
                (0, lifecycle_1.dispose)([
                    (0, lifecycle_1.toDisposable)(() => { disposedValues.add(1); }),
                    (0, lifecycle_1.toDisposable)(() => { throw new Error('I am error 1'); }),
                    (0, lifecycle_1.toDisposable)(() => { throw new Error('I am error 2'); }),
                    (0, lifecycle_1.toDisposable)(() => { disposedValues.add(4); }),
                ]);
            }
            catch (e) {
                thrownError = e;
            }
            assert.ok(disposedValues.has(1));
            assert.ok(disposedValues.has(4));
            assert.ok(thrownError instanceof lifecycle_1.MultiDisposeError);
            assert.strictEqual(thrownError.errors.length, 2);
            assert.strictEqual(thrownError.errors[0].message, 'I am error 1');
            assert.strictEqual(thrownError.errors[1].message, 'I am error 2');
        });
        test('Action bar has broken accessibility #100273', function () {
            let array = [{ dispose() { } }, { dispose() { } }];
            let array2 = (0, lifecycle_1.dispose)(array);
            assert.strictEqual(array.length, 2);
            assert.strictEqual(array2.length, 0);
            assert.ok(array !== array2);
            let set = new Set([{ dispose() { } }, { dispose() { } }]);
            let setValues = set.values();
            let setValues2 = (0, lifecycle_1.dispose)(setValues);
            assert.ok(setValues === setValues2);
        });
        test('SafeDisposable, dispose', function () {
            let disposed = 0;
            const actual = () => disposed += 1;
            const d = new lifecycle_1.SafeDisposable();
            d.set(actual);
            d.dispose();
            assert.strictEqual(disposed, 1);
        });
        test('SafeDisposable, unset', function () {
            let disposed = 0;
            const actual = () => disposed += 1;
            const d = new lifecycle_1.SafeDisposable();
            d.set(actual);
            d.unset();
            d.dispose();
            assert.strictEqual(disposed, 0);
        });
    });
    suite('DisposableStore', () => {
        test('dispose should call all child disposes even if a child throws on dispose', () => {
            const disposedValues = new Set();
            const store = new lifecycle_1.DisposableStore();
            store.add((0, lifecycle_1.toDisposable)(() => { disposedValues.add(1); }));
            store.add((0, lifecycle_1.toDisposable)(() => { throw new Error('I am error'); }));
            store.add((0, lifecycle_1.toDisposable)(() => { disposedValues.add(3); }));
            let thrownError;
            try {
                store.dispose();
            }
            catch (e) {
                thrownError = e;
            }
            assert.ok(disposedValues.has(1));
            assert.ok(disposedValues.has(3));
            assert.strictEqual(thrownError.message, 'I am error');
        });
        test('dispose should throw composite error if multiple children throw on dispose', () => {
            const disposedValues = new Set();
            const store = new lifecycle_1.DisposableStore();
            store.add((0, lifecycle_1.toDisposable)(() => { disposedValues.add(1); }));
            store.add((0, lifecycle_1.toDisposable)(() => { throw new Error('I am error 1'); }));
            store.add((0, lifecycle_1.toDisposable)(() => { throw new Error('I am error 2'); }));
            store.add((0, lifecycle_1.toDisposable)(() => { disposedValues.add(4); }));
            let thrownError;
            try {
                store.dispose();
            }
            catch (e) {
                thrownError = e;
            }
            assert.ok(disposedValues.has(1));
            assert.ok(disposedValues.has(4));
            assert.ok(thrownError instanceof lifecycle_1.MultiDisposeError);
            assert.strictEqual(thrownError.errors.length, 2);
            assert.strictEqual(thrownError.errors[0].message, 'I am error 1');
            assert.strictEqual(thrownError.errors[1].message, 'I am error 2');
        });
    });
    suite('Reference Collection', () => {
        class Collection extends lifecycle_1.ReferenceCollection {
            constructor() {
                super(...arguments);
                this._count = 0;
            }
            get count() { return this._count; }
            createReferencedObject(key) { this._count++; return key.length; }
            destroyReferencedObject(key, object) { this._count--; }
        }
        test('simple', () => {
            const collection = new Collection();
            const ref1 = collection.acquire('test');
            assert(ref1);
            assert.strictEqual(ref1.object, 4);
            assert.strictEqual(collection.count, 1);
            ref1.dispose();
            assert.strictEqual(collection.count, 0);
            const ref2 = collection.acquire('test');
            const ref3 = collection.acquire('test');
            assert.strictEqual(ref2.object, ref3.object);
            assert.strictEqual(collection.count, 1);
            const ref4 = collection.acquire('monkey');
            assert.strictEqual(ref4.object, 6);
            assert.strictEqual(collection.count, 2);
            ref2.dispose();
            assert.strictEqual(collection.count, 2);
            ref3.dispose();
            assert.strictEqual(collection.count, 1);
            ref4.dispose();
            assert.strictEqual(collection.count, 0);
        });
    });
    function assertThrows(fn, test) {
        try {
            fn();
            assert.fail('Expected function to throw, but it did not.');
        }
        catch (e) {
            assert.ok(test(e));
        }
    }
    suite('No Leakage Utilities', () => {
        suite('throwIfDisposablesAreLeaked', () => {
            test('throws if an event subscription is not cleaned up', () => {
                const eventEmitter = new event_1.Emitter();
                assertThrows(() => {
                    (0, utils_1.throwIfDisposablesAreLeaked)(() => {
                        eventEmitter.event(() => {
                            // noop
                        });
                    });
                }, e => e.message.indexOf('These disposables were not disposed') !== -1);
            });
            test('throws if a disposable is not disposed', () => {
                assertThrows(() => {
                    (0, utils_1.throwIfDisposablesAreLeaked)(() => {
                        new lifecycle_1.DisposableStore();
                    });
                }, e => e.message.indexOf('These disposables were not disposed') !== -1);
            });
            test('does not throw if all event subscriptions are cleaned up', () => {
                const eventEmitter = new event_1.Emitter();
                (0, utils_1.throwIfDisposablesAreLeaked)(() => {
                    eventEmitter.event(() => {
                        // noop
                    }).dispose();
                });
            });
            test('does not throw if all disposables are disposed', () => {
                // This disposable is reported before the test and not tracked.
                (0, lifecycle_1.toDisposable)(() => { });
                (0, utils_1.throwIfDisposablesAreLeaked)(() => {
                    // This disposable is marked as singleton
                    (0, lifecycle_1.markAsSingleton)((0, lifecycle_1.toDisposable)(() => { }));
                    // These disposables are also marked as singleton
                    const disposableStore = new lifecycle_1.DisposableStore();
                    disposableStore.add((0, lifecycle_1.toDisposable)(() => { }));
                    (0, lifecycle_1.markAsSingleton)(disposableStore);
                    (0, lifecycle_1.toDisposable)(() => { }).dispose();
                });
            });
        });
        suite('ensureNoDisposablesAreLeakedInTest', () => {
            (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
            test('Basic Test', () => {
                (0, lifecycle_1.toDisposable)(() => { }).dispose();
            });
        });
    });
});
//# sourceMappingURL=lifecycle.test.js.map