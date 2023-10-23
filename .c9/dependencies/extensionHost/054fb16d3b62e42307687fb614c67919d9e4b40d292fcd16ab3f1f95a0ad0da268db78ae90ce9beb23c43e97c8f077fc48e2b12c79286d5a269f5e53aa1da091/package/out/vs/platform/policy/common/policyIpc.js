/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/policy/common/policy"], function (require, exports, event_1, lifecycle_1, policy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PolicyChannelClient = exports.PolicyChannel = void 0;
    class PolicyChannel {
        constructor(service) {
            this.service = service;
            this.disposables = new lifecycle_1.DisposableStore();
        }
        listen(_, event) {
            switch (event) {
                case 'onDidChange': return event_1.Event.map(this.service.onDidChange, names => names.reduce((r, name) => { var _a; return (Object.assign(Object.assign({}, r), { [name]: (_a = this.service.getPolicyValue(name)) !== null && _a !== void 0 ? _a : null })); }, {}), this.disposables);
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, arg) {
            switch (command) {
                case 'registerPolicyDefinitions': return this.service.registerPolicyDefinitions(arg);
            }
            throw new Error(`Call not found: ${command}`);
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    exports.PolicyChannel = PolicyChannel;
    class PolicyChannelClient extends policy_1.AbstractPolicyService {
        constructor(policiesData, channel) {
            super();
            this.channel = channel;
            for (const name in policiesData) {
                const { definition, value } = policiesData[name];
                this.policyDefinitions[name] = definition;
                if (value !== undefined) {
                    this.policies.set(name, value);
                }
            }
            this.channel.listen('onDidChange')(policies => {
                for (const name in policies) {
                    const value = policies[name];
                    if (value === null) {
                        this.policies.delete(name);
                    }
                    else {
                        this.policies.set(name, value);
                    }
                }
                this._onDidChange.fire(Object.keys(policies));
            });
        }
        async initializePolicies(policyDefinitions) {
            const result = await this.channel.call('registerPolicyDefinitions', policyDefinitions);
            for (const name in result) {
                this.policies.set(name, result[name]);
            }
        }
    }
    exports.PolicyChannelClient = PolicyChannelClient;
});
//# sourceMappingURL=policyIpc.js.map