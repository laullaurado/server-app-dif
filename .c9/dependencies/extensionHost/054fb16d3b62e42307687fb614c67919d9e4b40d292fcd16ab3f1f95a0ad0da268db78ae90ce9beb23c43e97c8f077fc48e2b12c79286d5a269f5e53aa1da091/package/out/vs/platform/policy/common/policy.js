/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, iterator_1, lifecycle_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullPolicyService = exports.AbstractPolicyService = exports.IPolicyService = void 0;
    exports.IPolicyService = (0, instantiation_1.createDecorator)('policy');
    class AbstractPolicyService extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.policyDefinitions = {};
            this.policies = new Map();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
        }
        async registerPolicyDefinitions(policyDefinitions) {
            const size = Object.keys(this.policyDefinitions).length;
            this.policyDefinitions = Object.assign(Object.assign({}, policyDefinitions), this.policyDefinitions);
            if (size !== Object.keys(this.policyDefinitions).length) {
                await this.initializePolicies(policyDefinitions);
            }
            return iterator_1.Iterable.reduce(this.policies.entries(), (r, [name, value]) => (Object.assign(Object.assign({}, r), { [name]: value })), {});
        }
        getPolicyValue(name) {
            return this.policies.get(name);
        }
        serialize() {
            return iterator_1.Iterable.reduce(Object.entries(this.policyDefinitions), (r, [name, definition]) => (Object.assign(Object.assign({}, r), { [name]: { definition, value: this.policies.get(name) } })), {});
        }
    }
    exports.AbstractPolicyService = AbstractPolicyService;
    class NullPolicyService {
        constructor() {
            this.onDidChange = event_1.Event.None;
        }
        async registerPolicyDefinitions() { return {}; }
        getPolicyValue() { return undefined; }
        serialize() { return undefined; }
    }
    exports.NullPolicyService = NullPolicyService;
});
//# sourceMappingURL=policy.js.map