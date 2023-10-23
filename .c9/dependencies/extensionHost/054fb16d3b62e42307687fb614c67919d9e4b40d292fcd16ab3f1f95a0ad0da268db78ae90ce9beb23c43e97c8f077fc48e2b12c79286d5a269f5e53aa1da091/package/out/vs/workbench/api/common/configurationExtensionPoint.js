/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/platform/registry/common/platform", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/configuration/common/configurationRegistry", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/workbench/services/configuration/common/configuration", "vs/base/common/types", "vs/platform/extensions/common/extensions"], function (require, exports, nls, objects, platform_1, extensionsRegistry_1, configurationRegistry_1, jsonContributionRegistry_1, configuration_1, types_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateProperties = exports.configurationEntrySchema = void 0;
    const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    // C9 changes start
    // exporting the schema
    // C9 changes end
    exports.configurationEntrySchema = {
        type: 'object',
        defaultSnippets: [{ body: { title: '', properties: {} } }],
        properties: {
            title: {
                description: nls.localize('vscode.extension.contributes.configuration.title', 'A title for the current category of settings. This label will be rendered in the Settings editor as a subheading. If the title is the same as the extension display name, then the category will be grouped under the main extension heading.'),
                type: 'string'
            },
            order: {
                description: nls.localize('vscode.extension.contributes.configuration.order', 'When specified, gives the order of this category of settings relative to other categories.'),
                type: 'integer'
            },
            properties: {
                description: nls.localize('vscode.extension.contributes.configuration.properties', 'Description of the configuration properties.'),
                type: 'object',
                propertyNames: {
                    pattern: '\\S+',
                    patternErrorMessage: nls.localize('vscode.extension.contributes.configuration.property.empty', 'Property should not be empty.'),
                },
                additionalProperties: {
                    anyOf: [
                        {
                            title: nls.localize('vscode.extension.contributes.configuration.properties.schema', 'Schema of the configuration property.'),
                            $ref: 'http://json-schema.org/draft-07/schema#'
                        },
                        {
                            type: 'object',
                            properties: {
                                isExecutable: {
                                    type: 'boolean',
                                    markdownDeprecationMessage: 'This property is deprecated. Instead use `scope` property and set it to `machine` value.'
                                },
                                scope: {
                                    type: 'string',
                                    enum: ['application', 'machine', 'window', 'resource', 'language-overridable', 'machine-overridable'],
                                    default: 'window',
                                    enumDescriptions: [
                                        nls.localize('scope.application.description', "Configuration that can be configured only in the user settings."),
                                        nls.localize('scope.machine.description', "Configuration that can be configured only in the user settings or only in the remote settings."),
                                        nls.localize('scope.window.description', "Configuration that can be configured in the user, remote or workspace settings."),
                                        nls.localize('scope.resource.description', "Configuration that can be configured in the user, remote, workspace or folder settings."),
                                        nls.localize('scope.language-overridable.description', "Resource configuration that can be configured in language specific settings."),
                                        nls.localize('scope.machine-overridable.description', "Machine configuration that can be configured also in workspace or folder settings.")
                                    ],
                                    markdownDescription: nls.localize('scope.description', "Scope in which the configuration is applicable. Available scopes are `application`, `machine`, `window`, `resource`, and `machine-overridable`.")
                                },
                                enumDescriptions: {
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                    },
                                    description: nls.localize('scope.enumDescriptions', 'Descriptions for enum values')
                                },
                                markdownEnumDescriptions: {
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                    },
                                    description: nls.localize('scope.markdownEnumDescriptions', 'Descriptions for enum values in the markdown format.')
                                },
                                markdownDescription: {
                                    type: 'string',
                                    description: nls.localize('scope.markdownDescription', 'The description in the markdown format.')
                                },
                                deprecationMessage: {
                                    type: 'string',
                                    description: nls.localize('scope.deprecationMessage', 'If set, the property is marked as deprecated and the given message is shown as an explanation.')
                                },
                                markdownDeprecationMessage: {
                                    type: 'string',
                                    description: nls.localize('scope.markdownDeprecationMessage', 'If set, the property is marked as deprecated and the given message is shown as an explanation in the markdown format.')
                                },
                                editPresentation: {
                                    type: 'string',
                                    enum: ['singlelineText', 'multilineText'],
                                    enumDescriptions: [
                                        nls.localize('scope.singlelineText.description', 'The value will be shown in an inputbox.'),
                                        nls.localize('scope.multilineText.description', 'The value will be shown in a textarea.')
                                    ],
                                    default: 'singlelineText',
                                    description: nls.localize('scope.editPresentation', 'When specified, controls the presentation format of the string setting.')
                                },
                                order: {
                                    type: 'integer',
                                    description: nls.localize('scope.order', 'When specified, gives the order of this setting relative to other settings within the same category. Settings with an order property will be placed before settings without this property set.')
                                }
                            }
                        }
                    ]
                }
            }
        }
    };
    // BEGIN VSCode extension point `configurationDefaults`
    const defaultConfigurationExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'configurationDefaults',
        jsonSchema: {
            $ref: configurationRegistry_1.configurationDefaultsSchemaId,
        }
    });
    defaultConfigurationExtPoint.setHandler((extensions, { added, removed }) => {
        if (removed.length) {
            const removedDefaultConfigurations = removed.map(extension => ({ overrides: objects.deepClone(extension.value), source: { id: extension.description.identifier.value, displayName: extension.description.displayName } }));
            configurationRegistry.deregisterDefaultConfigurations(removedDefaultConfigurations);
        }
        if (added.length) {
            const registeredProperties = configurationRegistry.getConfigurationProperties();
            const allowedScopes = [6 /* ConfigurationScope.MACHINE_OVERRIDABLE */, 3 /* ConfigurationScope.WINDOW */, 4 /* ConfigurationScope.RESOURCE */, 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */];
            const addedDefaultConfigurations = added.map(extension => {
                const overrides = objects.deepClone(extension.value);
                for (const key of Object.keys(overrides)) {
                    if (!configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(key)) {
                        const registeredPropertyScheme = registeredProperties[key];
                        if ((registeredPropertyScheme === null || registeredPropertyScheme === void 0 ? void 0 : registeredPropertyScheme.scope) && !allowedScopes.includes(registeredPropertyScheme.scope)) {
                            extension.collector.warn(nls.localize('config.property.defaultConfiguration.warning', "Cannot register configuration defaults for '{0}'. Only defaults for machine-overridable, window, resource and language overridable scoped settings are supported.", key));
                            delete overrides[key];
                        }
                    }
                }
                return { overrides, source: { id: extension.description.identifier.value, displayName: extension.description.displayName } };
            });
            configurationRegistry.registerDefaultConfigurations(addedDefaultConfigurations);
        }
    });
    // END VSCode extension point `configurationDefaults`
    // BEGIN VSCode extension point `configuration`
    const configurationExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'configuration',
        deps: [defaultConfigurationExtPoint],
        jsonSchema: {
            description: nls.localize('vscode.extension.contributes.configuration', 'Contributes configuration settings.'),
            oneOf: [
                exports.configurationEntrySchema,
                {
                    type: 'array',
                    items: exports.configurationEntrySchema
                }
            ]
        }
    });
    const extensionConfigurations = new Map();
    configurationExtPoint.setHandler((extensions, { added, removed }) => {
        if (removed.length) {
            const removedConfigurations = [];
            for (const extension of removed) {
                const key = extensions_1.ExtensionIdentifier.toKey(extension.description.identifier);
                removedConfigurations.push(...(extensionConfigurations.get(key) || []));
                extensionConfigurations.delete(key);
            }
            configurationRegistry.deregisterConfigurations(removedConfigurations);
        }
        const seenProperties = new Set();
        function handleConfiguration(node, extension) {
            var _a, _b, _c;
            const configurations = [];
            let configuration = objects.deepClone(node);
            if (configuration.title && (typeof configuration.title !== 'string')) {
                extension.collector.error(nls.localize('invalid.title', "'configuration.title' must be a string"));
            }
            validateProperties(configuration, extension);
            configuration.id = node.id || extension.description.identifier.value;
            configuration.extensionInfo = { id: extension.description.identifier.value, displayName: extension.description.displayName };
            configuration.restrictedProperties = ((_b = (_a = extension.description.capabilities) === null || _a === void 0 ? void 0 : _a.untrustedWorkspaces) === null || _b === void 0 ? void 0 : _b.supported) === 'limited' ? (_c = extension.description.capabilities) === null || _c === void 0 ? void 0 : _c.untrustedWorkspaces.restrictedConfigurations : undefined;
            configuration.title = configuration.title || extension.description.displayName || extension.description.identifier.value;
            configurations.push(configuration);
            return configurations;
        }
        function validateProperties(configuration, extension) {
            let properties = configuration.properties;
            if (properties) {
                if (typeof properties !== 'object') {
                    extension.collector.error(nls.localize('invalid.properties', "'configuration.properties' must be an object"));
                    configuration.properties = {};
                }
                for (let key in properties) {
                    const propertyConfiguration = properties[key];
                    const message = (0, configurationRegistry_1.validateProperty)(key, propertyConfiguration);
                    if (message) {
                        delete properties[key];
                        extension.collector.warn(message);
                        continue;
                    }
                    if (seenProperties.has(key)) {
                        delete properties[key];
                        extension.collector.warn(nls.localize('config.property.duplicate', "Cannot register '{0}'. This property is already registered.", key));
                        continue;
                    }
                    if (!(0, types_1.isObject)(propertyConfiguration)) {
                        delete properties[key];
                        extension.collector.error(nls.localize('invalid.property', "configuration.properties property '{0}' must be an object", key));
                        continue;
                    }
                    seenProperties.add(key);
                    if (propertyConfiguration.scope) {
                        if (propertyConfiguration.scope.toString() === 'application') {
                            propertyConfiguration.scope = 1 /* ConfigurationScope.APPLICATION */;
                        }
                        else if (propertyConfiguration.scope.toString() === 'machine') {
                            propertyConfiguration.scope = 2 /* ConfigurationScope.MACHINE */;
                        }
                        else if (propertyConfiguration.scope.toString() === 'resource') {
                            propertyConfiguration.scope = 4 /* ConfigurationScope.RESOURCE */;
                        }
                        else if (propertyConfiguration.scope.toString() === 'machine-overridable') {
                            propertyConfiguration.scope = 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */;
                        }
                        else if (propertyConfiguration.scope.toString() === 'language-overridable') {
                            propertyConfiguration.scope = 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */;
                        }
                        else {
                            propertyConfiguration.scope = 3 /* ConfigurationScope.WINDOW */;
                        }
                    }
                    else {
                        propertyConfiguration.scope = 3 /* ConfigurationScope.WINDOW */;
                    }
                }
            }
            let subNodes = configuration.allOf;
            if (subNodes) {
                extension.collector.error(nls.localize('invalid.allOf', "'configuration.allOf' is deprecated and should no longer be used. Instead, pass multiple configuration sections as an array to the 'configuration' contribution point."));
                for (let node of subNodes) {
                    validateProperties(node, extension);
                }
            }
        }
        if (added.length) {
            const addedConfigurations = [];
            for (let extension of added) {
                const configurations = [];
                const value = extension.value;
                if (Array.isArray(value)) {
                    value.forEach(v => configurations.push(...handleConfiguration(v, extension)));
                }
                else {
                    configurations.push(...handleConfiguration(value, extension));
                }
                extensionConfigurations.set(extensions_1.ExtensionIdentifier.toKey(extension.description.identifier), configurations);
                addedConfigurations.push(...configurations);
            }
            configurationRegistry.registerConfigurations(addedConfigurations, false);
        }
    });
    // END VSCode extension point `configuration`
    // C9 changes start
    // exporting the function
    // C9 changes end
    function validateProperties(configuration, extension) {
        let properties = configuration.properties;
        if (properties) {
            if (typeof properties !== 'object') {
                extension.collector.error(nls.localize('invalid.properties', "'configuration.properties' must be an object"));
                configuration.properties = {};
            }
            for (let key in properties) {
                const propertyConfiguration = properties[key];
                const message = (0, configurationRegistry_1.validateProperty)(key, propertyConfiguration);
                if (message) {
                    delete properties[key];
                    extension.collector.warn(message);
                    continue;
                }
                if (!(0, types_1.isObject)(propertyConfiguration)) {
                    delete properties[key];
                    extension.collector.error(nls.localize('invalid.property', "'configuration.property' must be an object"));
                    continue;
                }
                if (propertyConfiguration.scope) {
                    if (propertyConfiguration.scope.toString() === 'application') {
                        propertyConfiguration.scope = 1 /* ConfigurationScope.APPLICATION */;
                    }
                    else if (propertyConfiguration.scope.toString() === 'machine') {
                        propertyConfiguration.scope = 2 /* ConfigurationScope.MACHINE */;
                    }
                    else if (propertyConfiguration.scope.toString() === 'resource') {
                        propertyConfiguration.scope = 4 /* ConfigurationScope.RESOURCE */;
                    }
                    else if (propertyConfiguration.scope.toString() === 'machine-overridable') {
                        propertyConfiguration.scope = 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */;
                    }
                    else if (propertyConfiguration.scope.toString() === 'language-overridable') {
                        propertyConfiguration.scope = 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */;
                    }
                    else {
                        propertyConfiguration.scope = 3 /* ConfigurationScope.WINDOW */;
                    }
                }
                else {
                    propertyConfiguration.scope = 3 /* ConfigurationScope.WINDOW */;
                }
            }
        }
        let subNodes = configuration.allOf;
        if (subNodes) {
            extension.collector.error(nls.localize('invalid.allOf', "'configuration.allOf' is deprecated and should no longer be used. Instead, pass multiple configuration sections as an array to the 'configuration' contribution point."));
            for (let node of subNodes) {
                validateProperties(node, extension);
            }
        }
    }
    exports.validateProperties = validateProperties;
    jsonRegistry.registerSchema('vscode://schemas/workspaceConfig', {
        allowComments: true,
        allowTrailingCommas: true,
        default: {
            folders: [
                {
                    path: ''
                }
            ],
            settings: {}
        },
        required: ['folders'],
        properties: {
            'folders': {
                minItems: 0,
                uniqueItems: true,
                description: nls.localize('workspaceConfig.folders.description', "List of folders to be loaded in the workspace."),
                items: {
                    type: 'object',
                    defaultSnippets: [{ body: { path: '$1' } }],
                    oneOf: [{
                            properties: {
                                path: {
                                    type: 'string',
                                    description: nls.localize('workspaceConfig.path.description', "A file path. e.g. `/root/folderA` or `./folderA` for a relative path that will be resolved against the location of the workspace file.")
                                },
                                name: {
                                    type: 'string',
                                    description: nls.localize('workspaceConfig.name.description', "An optional name for the folder. ")
                                }
                            },
                            required: ['path']
                        }, {
                            properties: {
                                uri: {
                                    type: 'string',
                                    description: nls.localize('workspaceConfig.uri.description', "URI of the folder")
                                },
                                name: {
                                    type: 'string',
                                    description: nls.localize('workspaceConfig.name.description', "An optional name for the folder. ")
                                }
                            },
                            required: ['uri']
                        }]
                }
            },
            'settings': {
                type: 'object',
                default: {},
                description: nls.localize('workspaceConfig.settings.description', "Workspace settings"),
                $ref: configuration_1.workspaceSettingsSchemaId
            },
            'launch': {
                type: 'object',
                default: { configurations: [], compounds: [] },
                description: nls.localize('workspaceConfig.launch.description', "Workspace launch configurations"),
                $ref: configuration_1.launchSchemaId
            },
            'tasks': {
                type: 'object',
                default: { version: '2.0.0', tasks: [] },
                description: nls.localize('workspaceConfig.tasks.description', "Workspace task configurations"),
                $ref: configuration_1.tasksSchemaId
            },
            'extensions': {
                type: 'object',
                default: {},
                description: nls.localize('workspaceConfig.extensions.description', "Workspace extensions"),
                $ref: 'vscode://schemas/extensions'
            },
            'remoteAuthority': {
                type: 'string',
                doNotSuggest: true,
                description: nls.localize('workspaceConfig.remoteAuthority', "The remote server where the workspace is located."),
            },
            'transient': {
                type: 'boolean',
                doNotSuggest: true,
                description: nls.localize('workspaceConfig.transient', "A transient workspace will disappear when restarting or reloading."),
            }
        },
        errorMessage: nls.localize('unknownWorkspaceProperty', "Unknown workspace configuration property")
    });
});
//# sourceMappingURL=configurationExtensionPoint.js.map