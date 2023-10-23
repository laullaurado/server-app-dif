/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationModels", "vs/platform/configuration/common/configurations", "vs/platform/policy/common/policy"], function (require, exports, async_1, event_1, lifecycle_1, resources_1, configuration_1, configurationModels_1, configurations_1, policy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigurationService = void 0;
    class ConfigurationService extends lifecycle_1.Disposable {
        constructor(settingsResource, fileService, policyService, logService) {
            super();
            this.settingsResource = settingsResource;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this.defaultConfiguration = this._register(new configurations_1.DefaultConfiguration());
            this.policyConfiguration = policyService instanceof policy_1.NullPolicyService ? new configurations_1.NullPolicyConfiguration() : this._register(new configurations_1.PolicyConfiguration(this.defaultConfiguration, policyService, logService));
            this.userConfiguration = this._register(new configurationModels_1.UserSettings(this.settingsResource, undefined, resources_1.extUriBiasedIgnorePathCase, fileService));
            this.configuration = new configurationModels_1.Configuration(this.defaultConfiguration.configurationModel, this.policyConfiguration.configurationModel, new configurationModels_1.ConfigurationModel());
            this.reloadConfigurationScheduler = this._register(new async_1.RunOnceScheduler(() => this.reloadConfiguration(), 50));
            this._register(this.defaultConfiguration.onDidChangeConfiguration(({ defaults, properties }) => this.onDidDefaultConfigurationChange(defaults, properties)));
            this._register(this.policyConfiguration.onDidChangeConfiguration(model => this.onDidPolicyConfigurationChange(model)));
            this._register(this.userConfiguration.onDidChange(() => this.reloadConfigurationScheduler.schedule()));
        }
        async initialize() {
            const [defaultModel, policyModel, userModel] = await Promise.all([this.defaultConfiguration.initialize(), this.policyConfiguration.initialize(), this.userConfiguration.loadConfiguration()]);
            this.configuration = new configurationModels_1.Configuration(defaultModel, policyModel, userModel);
        }
        getConfigurationData() {
            return this.configuration.toData();
        }
        getValue(arg1, arg2) {
            const section = typeof arg1 === 'string' ? arg1 : undefined;
            const overrides = (0, configuration_1.isConfigurationOverrides)(arg1) ? arg1 : (0, configuration_1.isConfigurationOverrides)(arg2) ? arg2 : {};
            return this.configuration.getValue(section, overrides, undefined);
        }
        updateValue(key, value, arg3, arg4) {
            return Promise.reject(new Error('not supported'));
        }
        inspect(key) {
            return this.configuration.inspect(key, {}, undefined);
        }
        keys() {
            return this.configuration.keys(undefined);
        }
        async reloadConfiguration() {
            const configurationModel = await this.userConfiguration.loadConfiguration();
            this.onDidChangeUserConfiguration(configurationModel);
        }
        onDidChangeUserConfiguration(userConfigurationModel) {
            const previous = this.configuration.toData();
            const change = this.configuration.compareAndUpdateLocalUserConfiguration(userConfigurationModel);
            this.trigger(change, previous, 1 /* ConfigurationTarget.USER */);
        }
        onDidDefaultConfigurationChange(defaultConfigurationModel, properties) {
            const previous = this.configuration.toData();
            const change = this.configuration.compareAndUpdateDefaultConfiguration(defaultConfigurationModel, properties);
            this.trigger(change, previous, 6 /* ConfigurationTarget.DEFAULT */);
        }
        onDidPolicyConfigurationChange(policyConfiguration) {
            const previous = this.configuration.toData();
            const change = this.configuration.compareAndUpdatePolicyConfiguration(policyConfiguration);
            this.trigger(change, previous, 6 /* ConfigurationTarget.DEFAULT */);
        }
        trigger(configurationChange, previous, source) {
            const event = new configurationModels_1.ConfigurationChangeEvent(configurationChange, { data: previous }, this.configuration);
            event.source = source;
            event.sourceConfig = this.getTargetConfiguration(source);
            this._onDidChangeConfiguration.fire(event);
        }
        getTargetConfiguration(target) {
            switch (target) {
                case 6 /* ConfigurationTarget.DEFAULT */:
                    return this.configuration.defaults.contents;
                case 1 /* ConfigurationTarget.USER */:
                    return this.configuration.localUserConfiguration.contents;
            }
            return {};
        }
    }
    exports.ConfigurationService = ConfigurationService;
});
//# sourceMappingURL=configurationService.js.map