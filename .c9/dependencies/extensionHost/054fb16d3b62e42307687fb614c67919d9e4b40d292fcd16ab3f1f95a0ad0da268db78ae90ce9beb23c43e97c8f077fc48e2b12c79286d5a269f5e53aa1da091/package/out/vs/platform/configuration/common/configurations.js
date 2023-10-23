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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/types", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationModels", "vs/platform/configuration/common/configurationRegistry", "vs/platform/log/common/log", "vs/platform/policy/common/policy", "vs/platform/registry/common/platform"], function (require, exports, arrays_1, event_1, lifecycle_1, objects_1, types_1, configuration_1, configurationModels_1, configurationRegistry_1, log_1, policy_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PolicyConfiguration = exports.NullPolicyConfiguration = exports.DefaultConfigurationModel = exports.DefaultConfiguration = void 0;
    class DefaultConfiguration extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
        }
        get configurationModel() {
            if (!this._configurationModel) {
                this._configurationModel = new DefaultConfigurationModel(this.getConfigurationDefaultOverrides());
            }
            return this._configurationModel;
        }
        async initialize() {
            this._configurationModel = undefined;
            this._register(platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).onDidUpdateConfiguration(({ properties, defaultsOverrides }) => this.onDidUpdateConfiguration(properties, defaultsOverrides)));
            return this.configurationModel;
        }
        reload() {
            this._configurationModel = undefined;
            return this.configurationModel;
        }
        onDidUpdateConfiguration(properties, defaultsOverrides) {
            this._configurationModel = undefined;
            this._onDidChangeConfiguration.fire({ defaults: this.configurationModel, properties });
        }
        getConfigurationDefaultOverrides() {
            return {};
        }
    }
    exports.DefaultConfiguration = DefaultConfiguration;
    class DefaultConfigurationModel extends configurationModels_1.ConfigurationModel {
        constructor(configurationDefaultsOverrides = {}) {
            const properties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            const keys = Object.keys(properties);
            const contents = Object.create(null);
            const overrides = [];
            for (const key in properties) {
                const defaultOverrideValue = configurationDefaultsOverrides[key];
                const value = defaultOverrideValue !== undefined ? defaultOverrideValue : properties[key].default;
                (0, configuration_1.addToValueTree)(contents, key, value, message => console.error(`Conflict in default settings: ${message}`));
            }
            for (const key of Object.keys(contents)) {
                if (configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(key)) {
                    overrides.push({
                        identifiers: (0, configurationRegistry_1.overrideIdentifiersFromKey)(key),
                        keys: Object.keys(contents[key]),
                        contents: (0, configuration_1.toValuesTree)(contents[key], message => console.error(`Conflict in default settings file: ${message}`)),
                    });
                }
            }
            super(contents, keys, overrides);
        }
    }
    exports.DefaultConfigurationModel = DefaultConfigurationModel;
    class NullPolicyConfiguration {
        constructor() {
            this.onDidChangeConfiguration = event_1.Event.None;
            this.configurationModel = new configurationModels_1.ConfigurationModel();
        }
        async initialize() { return this.configurationModel; }
    }
    exports.NullPolicyConfiguration = NullPolicyConfiguration;
    let PolicyConfiguration = class PolicyConfiguration extends lifecycle_1.Disposable {
        constructor(defaultConfiguration, policyService, logService) {
            super();
            this.defaultConfiguration = defaultConfiguration;
            this.policyService = policyService;
            this.logService = logService;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._configurationModel = new configurationModels_1.ConfigurationModel();
        }
        get configurationModel() { return this._configurationModel; }
        async initialize() {
            this.update(await this.registerPolicyDefinitions(this.defaultConfiguration.configurationModel.keys), false);
            this._register(this.policyService.onDidChange(policyNames => this.onDidChangePolicies(policyNames)));
            this._register(this.defaultConfiguration.onDidChangeConfiguration(async ({ properties }) => this.update(await this.registerPolicyDefinitions(properties), true)));
            return this._configurationModel;
        }
        async registerPolicyDefinitions(properties) {
            const policyDefinitions = {};
            const keys = [];
            const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            for (const key of properties) {
                const config = configurationProperties[key];
                if (!config) {
                    // Config is removed. So add it to the list if in case it was registered as policy before
                    keys.push(key);
                    continue;
                }
                if (config.policy) {
                    if (config.type !== 'string' && config.type !== 'number') {
                        this.logService.warn(`Policy ${config.policy.name} has unsupported type ${config.type}`);
                        continue;
                    }
                    keys.push(key);
                    policyDefinitions[config.policy.name] = { type: config.type };
                }
            }
            if (!(0, types_1.isEmptyObject)(policyDefinitions)) {
                await this.policyService.registerPolicyDefinitions(policyDefinitions);
            }
            return keys;
        }
        onDidChangePolicies(policyNames) {
            const policyConfigurations = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getPolicyConfigurations();
            const keys = (0, arrays_1.coalesce)(policyNames.map(policyName => policyConfigurations.get(policyName)));
            this.update(keys, true);
        }
        update(keys, trigger) {
            var _a, _b;
            const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            const changed = [];
            const wasEmpty = this._configurationModel.isEmpty();
            for (const key of keys) {
                const policyName = (_b = (_a = configurationProperties[key]) === null || _a === void 0 ? void 0 : _a.policy) === null || _b === void 0 ? void 0 : _b.name;
                if (policyName) {
                    const policyValue = this.policyService.getPolicyValue(policyName);
                    if (wasEmpty ? policyValue !== undefined : !(0, objects_1.equals)(this._configurationModel.getValue(key), policyValue)) {
                        changed.push([key, policyValue]);
                    }
                }
                else {
                    if (this._configurationModel.getValue(key) !== undefined) {
                        changed.push([key, undefined]);
                    }
                }
            }
            if (changed.length) {
                const old = this._configurationModel;
                this._configurationModel = new configurationModels_1.ConfigurationModel();
                for (const key of old.keys) {
                    this._configurationModel.setValue(key, old.getValue(key));
                }
                for (const [key, policyValue] of changed) {
                    if (policyValue === undefined) {
                        this._configurationModel.removeValue(key);
                    }
                    else {
                        this._configurationModel.setValue(key, policyValue);
                    }
                }
                if (trigger) {
                    this._onDidChangeConfiguration.fire(this._configurationModel);
                }
            }
        }
    };
    PolicyConfiguration = __decorate([
        __param(1, policy_1.IPolicyService),
        __param(2, log_1.ILogService)
    ], PolicyConfiguration);
    exports.PolicyConfiguration = PolicyConfiguration;
});
//# sourceMappingURL=configurations.js.map