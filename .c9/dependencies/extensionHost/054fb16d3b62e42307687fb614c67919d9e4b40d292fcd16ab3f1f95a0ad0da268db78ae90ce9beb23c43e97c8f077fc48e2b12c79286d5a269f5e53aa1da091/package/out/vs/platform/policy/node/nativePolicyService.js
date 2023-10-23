/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/policy/common/policy", "vs/base/common/async", "vscode-policy-watcher", "vs/base/common/lifecycle"], function (require, exports, policy_1, async_1, vscode_policy_watcher_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativePolicyService = void 0;
    class NativePolicyService extends policy_1.AbstractPolicyService {
        constructor(productName) {
            super();
            this.productName = productName;
            this.throttler = new async_1.Throttler();
            this.watcher = this._register(new lifecycle_1.MutableDisposable());
        }
        async initializePolicies(policyDefinitions) {
            await this.throttler.queue(() => new Promise((c, e) => {
                try {
                    this.watcher.value = (0, vscode_policy_watcher_1.createWatcher)(this.productName, policyDefinitions, update => {
                        for (const key in update) {
                            const value = update[key];
                            if (value === undefined) {
                                this.policies.delete(key);
                            }
                            else {
                                this.policies.set(key, value);
                            }
                        }
                        this._onDidChange.fire(Object.keys(update));
                        c();
                    });
                }
                catch (err) {
                    e(err);
                }
            }));
        }
    }
    exports.NativePolicyService = NativePolicyService;
});
//# sourceMappingURL=nativePolicyService.js.map