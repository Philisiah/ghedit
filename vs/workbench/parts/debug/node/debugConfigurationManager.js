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
define(["require", "exports", 'path', 'vs/nls', 'vs/base/common/winjs.base', 'vs/base/common/strings', 'vs/base/common/event', 'vs/base/common/objects', 'vs/base/common/uri', 'vs/base/common/network', 'vs/base/common/paths', 'vs/platform/extensions/common/extensionsRegistry', 'vs/platform/platform', 'vs/platform/jsonschemas/common/jsonContributionRegistry', 'vs/platform/configuration/common/configuration', 'vs/platform/files/common/files', 'vs/platform/telemetry/common/telemetry', 'vs/workbench/parts/lib/node/systemVariables', 'vs/workbench/parts/debug/node/debugAdapter', 'vs/workbench/services/workspace/common/contextService', 'vs/workbench/services/editor/common/editorService', 'vs/workbench/services/quickopen/common/quickOpenService'], function (require, exports, path, nls, winjs_base_1, strings, event_1, objects, uri_1, network_1, paths, extensionsRegistry, platform, jsonContributionRegistry, configuration_1, files_1, telemetry_1, systemVariables_1, debugAdapter_1, contextService_1, editorService_1, quickOpenService_1) {
    "use strict";
    // debuggers extension point
    exports.debuggersExtPoint = extensionsRegistry.ExtensionsRegistry.registerExtensionPoint('debuggers', {
        description: nls.localize('vscode.extension.contributes.debuggers', 'Contributes debug adapters.'),
        type: 'array',
        defaultSnippets: [{ body: [{ type: '', extensions: [] }] }],
        items: {
            type: 'object',
            defaultSnippets: [{ body: { type: '', program: '', runtime: '', enableBreakpointsFor: { languageIds: [''] } } }],
            properties: {
                type: {
                    description: nls.localize('vscode.extension.contributes.debuggers.type', "Unique identifier for this debug adapter."),
                    type: 'string'
                },
                label: {
                    description: nls.localize('vscode.extension.contributes.debuggers.label', "Display name for this debug adapter."),
                    type: 'string'
                },
                enableBreakpointsFor: {
                    description: nls.localize('vscode.extension.contributes.debuggers.enableBreakpointsFor', "Allow breakpoints for these languages."),
                    type: 'object',
                    properties: {
                        languageIds: {
                            description: nls.localize('vscode.extension.contributes.debuggers.enableBreakpointsFor.languageIds', "List of languages."),
                            type: 'array',
                            items: {
                                type: 'string'
                            }
                        }
                    }
                },
                program: {
                    description: nls.localize('vscode.extension.contributes.debuggers.program', "Path to the debug adapter program. Path is either absolute or relative to the extension folder."),
                    type: 'string'
                },
                args: {
                    description: nls.localize('vscode.extension.contributes.debuggers.args', "Optional arguments to pass to the adapter."),
                    type: 'array'
                },
                runtime: {
                    description: nls.localize('vscode.extension.contributes.debuggers.runtime', "Optional runtime in case the program attribute is not an executable but requires a runtime."),
                    type: 'string'
                },
                runtimeArgs: {
                    description: nls.localize('vscode.extension.contributes.debuggers.runtimeArgs', "Optional runtime arguments."),
                    type: 'array'
                },
                initialConfigurations: {
                    description: nls.localize('vscode.extension.contributes.debuggers.initialConfigurations', "Configurations for generating the initial \'launch.json\'."),
                    type: 'array',
                },
                configurationAttributes: {
                    description: nls.localize('vscode.extension.contributes.debuggers.configurationAttributes', "JSON schema configurations for validating \'launch.json\'."),
                    type: 'object'
                },
                windows: {
                    description: nls.localize('vscode.extension.contributes.debuggers.windows', "Windows specific settings."),
                    type: 'object',
                    properties: {
                        runtime: {
                            description: nls.localize('vscode.extension.contributes.debuggers.windows.runtime', "Runtime used for Windows."),
                            type: 'string'
                        }
                    }
                },
                osx: {
                    description: nls.localize('vscode.extension.contributes.debuggers.osx', "OS X specific settings."),
                    type: 'object',
                    properties: {
                        runtime: {
                            description: nls.localize('vscode.extension.contributes.debuggers.osx.runtime', "Runtime used for OSX."),
                            type: 'string'
                        }
                    }
                },
                linux: {
                    description: nls.localize('vscode.extension.contributes.debuggers.linux', "Linux specific settings."),
                    type: 'object',
                    properties: {
                        runtime: {
                            description: nls.localize('vscode.extension.contributes.debuggers.linux.runtime', "Runtime used for Linux."),
                            type: 'string'
                        }
                    }
                }
            }
        }
    });
    // debug general schema
    exports.schemaId = 'vscode://schemas/launch';
    var schema = {
        id: exports.schemaId,
        type: 'object',
        title: nls.localize('app.launch.json.title', "Launch configuration"),
        required: ['version', 'configurations'],
        properties: {
            version: {
                type: 'string',
                description: nls.localize('app.launch.json.version', "Version of this file format."),
                default: '0.2.0'
            },
            configurations: {
                type: 'array',
                description: nls.localize('app.launch.json.configurations', "List of configurations. Add new configurations or edit existing ones."),
                items: {
                    oneOf: []
                }
            }
        }
    };
    var jsonRegistry = platform.Registry.as(jsonContributionRegistry.Extensions.JSONContribution);
    jsonRegistry.registerSchema(exports.schemaId, schema);
    var ConfigurationManager = (function () {
        function ConfigurationManager(configName, contextService, fileService, telemetryService, editorService, configurationService, quickOpenService) {
            this.contextService = contextService;
            this.fileService = fileService;
            this.telemetryService = telemetryService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.quickOpenService = quickOpenService;
            this._onDidConfigurationChange = new event_1.Emitter();
            this.systemVariables = this.contextService.getWorkspace() ? new systemVariables_1.SystemVariables(this.editorService, this.contextService) : null;
            this.setConfiguration(configName);
            this.adapters = [];
            this.registerListeners();
            this.allModeIdsForBreakpoints = {};
        }
        ConfigurationManager.prototype.registerListeners = function () {
            var _this = this;
            exports.debuggersExtPoint.setHandler(function (extensions) {
                extensions.forEach(function (extension) {
                    extension.value.forEach(function (rawAdapter) {
                        var adapter = new debugAdapter_1.Adapter(rawAdapter, _this.systemVariables, extension.description.extensionFolderPath);
                        var duplicate = _this.adapters.filter(function (a) { return a.type === adapter.type; })[0];
                        if (!rawAdapter.type || (typeof rawAdapter.type !== 'string')) {
                            extension.collector.error(nls.localize('debugNoType', "Debug adapter 'type' can not be omitted and must be of type 'string'."));
                        }
                        if (duplicate) {
                            Object.keys(adapter).forEach(function (attribute) {
                                if (adapter[attribute]) {
                                    if (attribute === 'enableBreakpointsFor') {
                                        Object.keys(adapter.enableBreakpointsFor).forEach(function (languageId) { return duplicate.enableBreakpointsFor[languageId] = true; });
                                    }
                                    else if (duplicate[attribute] && attribute !== 'type') {
                                        // give priority to the later registered extension.
                                        duplicate[attribute] = adapter[attribute];
                                        extension.collector.error(nls.localize('duplicateDebuggerType', "Debug type '{0}' is already registered and has attribute '{1}', ignoring attribute '{1}'.", adapter.type, attribute));
                                    }
                                    else {
                                        duplicate[attribute] = adapter[attribute];
                                    }
                                }
                            });
                        }
                        else {
                            _this.adapters.push(adapter);
                        }
                        if (adapter.enableBreakpointsFor) {
                            adapter.enableBreakpointsFor.languageIds.forEach(function (modeId) {
                                _this.allModeIdsForBreakpoints[modeId] = true;
                            });
                        }
                    });
                });
                // update the schema to include all attributes and types from extensions.
                // debug.schema.properties['configurations'].items.properties.type.enum = this.adapters.map(adapter => adapter.type);
                _this.adapters.forEach(function (adapter) {
                    var schemaAttributes = adapter.getSchemaAttributes();
                    if (schemaAttributes) {
                        (_a = schema.properties['configurations'].items.oneOf).push.apply(_a, schemaAttributes);
                    }
                    var _a;
                });
            });
        };
        Object.defineProperty(ConfigurationManager.prototype, "onDidConfigurationChange", {
            get: function () {
                return this._onDidConfigurationChange.event;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ConfigurationManager.prototype, "configurationName", {
            get: function () {
                return this.configuration ? this.configuration.name : null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ConfigurationManager.prototype, "adapter", {
            get: function () {
                var _this = this;
                return this.adapters.filter(function (adapter) { return strings.equalsIgnoreCase(adapter.type, _this.configuration.type); }).pop();
            },
            enumerable: true,
            configurable: true
        });
        ConfigurationManager.prototype.setConfiguration = function (name) {
            var _this = this;
            return this.loadLaunchConfig().then(function (config) {
                if (!config || !config.configurations) {
                    _this.configuration = null;
                    return;
                }
                // if the configuration name is not set yet, take the first launch config (can happen if debug viewlet has not been opened yet).
                var filtered = name ? config.configurations.filter(function (cfg) { return cfg.name === name; }) : [config.configurations[0]];
                // massage configuration attributes - append workspace path to relatvie paths, substitute variables in paths.
                _this.configuration = filtered.length === 1 ? objects.deepClone(filtered[0]) : null;
                if (_this.configuration) {
                    if (_this.systemVariables) {
                        Object.keys(_this.configuration).forEach(function (key) {
                            _this.configuration[key] = _this.systemVariables.resolveAny(_this.configuration[key]);
                        });
                    }
                    _this.configuration.debugServer = config.debugServer;
                }
            }).then(function () { return _this._onDidConfigurationChange.fire(_this.configurationName); });
        };
        ConfigurationManager.prototype.openConfigFile = function (sideBySide) {
            var _this = this;
            var resource = uri_1.default.file(paths.join(this.contextService.getWorkspace().resource.fsPath, '/.vscode/launch.json'));
            return this.fileService.resolveContent(resource).then(function (content) { return true; }, function (err) {
                return _this.getInitialConfigFileContent().then(function (content) {
                    if (!content) {
                        return false;
                    }
                    return _this.fileService.updateContent(resource, content).then(function () { return true; });
                });
            }).then(function (configFileCreated) {
                if (!configFileCreated) {
                    return false;
                }
                _this.telemetryService.publicLog('debugConfigure');
                return _this.editorService.openEditor({
                    resource: resource,
                    options: {
                        forceOpen: true
                    }
                }, sideBySide).then(function () { return true; });
            }, function (error) {
                throw new Error(nls.localize('DebugConfig.failed', "Unable to create 'launch.json' file inside the '.vscode' folder ({0}).", error));
            });
        };
        ConfigurationManager.prototype.getInitialConfigFileContent = function () {
            var _this = this;
            return this.quickOpenService.pick(this.adapters, { placeHolder: nls.localize('selectDebug', "Select Environment") })
                .then(function (adapter) {
                if (!adapter) {
                    return null;
                }
                return _this.massageInitialConfigurations(adapter).then(function () {
                    var editorConfig = _this.configurationService.getConfiguration();
                    return JSON.stringify({
                        version: '0.2.0',
                        configurations: adapter.initialConfigurations ? adapter.initialConfigurations : []
                    }, null, editorConfig.editor.insertSpaces ? strings.repeat(' ', editorConfig.editor.tabSize) : '\t');
                });
            });
        };
        ConfigurationManager.prototype.massageInitialConfigurations = function (adapter) {
            if (!adapter || !adapter.initialConfigurations || adapter.type !== 'node') {
                return winjs_base_1.TPromise.as(undefined);
            }
            // check package.json for 'main' or 'scripts' so we generate a more pecise 'program' attribute in launch.json.
            var packageJsonUri = uri_1.default.file(paths.join(this.contextService.getWorkspace().resource.fsPath, '/package.json'));
            return this.fileService.resolveContent(packageJsonUri).then(function (jsonContent) {
                try {
                    var jsonObject = JSON.parse(jsonContent.value);
                    if (jsonObject.main) {
                        return jsonObject.main;
                    }
                    else if (jsonObject.scripts && typeof jsonObject.scripts.start === 'string') {
                        return jsonObject.scripts.start.split(' ').pop();
                    }
                }
                catch (error) { }
                return null;
            }, function (err) { return null; }).then(function (program) {
                adapter.initialConfigurations.forEach(function (config) {
                    if (program && config.program) {
                        if (!path.isAbsolute(program)) {
                            program = paths.join('${workspaceRoot}', program);
                        }
                        config.program = program;
                    }
                });
            });
        };
        ConfigurationManager.prototype.canSetBreakpointsIn = function (model) {
            if (model.getAssociatedResource().scheme === network_1.Schemas.inMemory) {
                return false;
            }
            var mode = model ? model.getMode() : null;
            var modeId = mode ? mode.getId() : null;
            return !!this.allModeIdsForBreakpoints[modeId];
        };
        ConfigurationManager.prototype.loadLaunchConfig = function () {
            return winjs_base_1.TPromise.as(this.configurationService.getConfiguration('launch'));
        };
        ConfigurationManager = __decorate([
            __param(1, contextService_1.IWorkspaceContextService),
            __param(2, files_1.IFileService),
            __param(3, telemetry_1.ITelemetryService),
            __param(4, editorService_1.IWorkbenchEditorService),
            __param(5, configuration_1.IConfigurationService),
            __param(6, quickOpenService_1.IQuickOpenService)
        ], ConfigurationManager);
        return ConfigurationManager;
    }());
    exports.ConfigurationManager = ConfigurationManager;
});
//# sourceMappingURL=debugConfigurationManager.js.map