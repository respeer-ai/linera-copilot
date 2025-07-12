import * as vscode from 'vscode';
import { PluginSettings } from '../settings';
import { executeToolCall } from '../tools';

interface MessagePayload<T = any> {
  command: string;
  success: boolean;
  data?: T;
  updated?: T;
  error?: string;
}

function handleGetSettings(): MessagePayload<Record<string, any>> {
  const settings = PluginSettings.getAllSettings();
  return {
    command: 'getSettingsResponse',
    success: true,
    data: settings,
  };
}

async function handleSaveSettings(payload: MessagePayload<Record<string, any>>): Promise<MessagePayload<Record<string, any>>> {
  const settings = PluginSettings.getAllSettings();
  await PluginSettings.saveAllSettings(payload.updated as Record<string, string>);
  return {
    command: 'saveSettingsResponse',
    success: true,
    updated: settings,
  };
}


async function handleGetSingleSetting(
  commandResponse: string,
  getter: () => string,
  keyName: string
): Promise<MessagePayload<Record<string, any>>> {
  const value = getter();
  return {
    command: commandResponse,
    success: true,
    data: { [keyName]: value },
  };
}

async function handleSetSingleSetting(
  commandResponse: string,
  setter: (value: string) => void,
  keyName: string,
  value: any
): Promise<MessagePayload<Record<string, any>>> {
  if (typeof value !== 'string') {
    return {
      command: commandResponse,
      success: false,
      error: `Invalid ${keyName} value`,
    };
  }
  setter(value);
  return {
    command: commandResponse,
    success: true,
    updated: { [keyName]: value },
  };
}

export const onMessage = async (webview: vscode.Webview, message: any) => {
  let payload: MessagePayload;

  try {
    switch (message.command) {
      case 'getSettings':
        payload = handleGetSettings();
        break;

      case 'saveSettings':
        payload = await handleSaveSettings(message);
        break;

      case 'executeToolCall':
        await executeToolCall(message.data)
        payload = {
          command: 'executeToolCallResponse',
          success: true
        }
        break;

      case 'getSdkVersion':
        payload = await handleGetSingleSetting('getSdkVersionResponse', PluginSettings.getSdkVersion, 'sdkVersion');
        break;
      case 'setSdkVersion':
        payload = await handleSetSingleSetting('setSdkVersionResponse', PluginSettings.setSdkVersion, 'sdkVersion', message.value);
        break;

      case 'getModelUrl':
        payload = await handleGetSingleSetting('getModelUrlResponse', PluginSettings.getModelUrl, 'modelUrl');
        break;
      case 'setModelUrl':
        payload = await handleSetSingleSetting('setModelUrlResponse', PluginSettings.setModelUrl, 'modelUrl', message.value);
        break;

      case 'getApiToken':
        payload = await handleGetSingleSetting('getApiTokenResponse', PluginSettings.getApiToken, 'apiToken');
        break;
      case 'setApiToken':
        payload = await handleSetSingleSetting('setApiTokenResponse', PluginSettings.setApiToken, 'apiToken', message.value);
        break;

      case 'getModelName':
        payload = await handleGetSingleSetting('getModelNameResponse', PluginSettings.getModelName, 'modelName');
        break;
      case 'setModelName':
        payload = await handleSetSingleSetting('setModelNameResponse', PluginSettings.setModelName, 'modelName', message.value);
        break;

      case 'getProjectRoot':
        payload = await handleGetSingleSetting('getProjectRootResponse', PluginSettings.getProjectRoot, 'projectRoot');
        break;
      case 'setProjectRoot':
        payload = await handleSetSingleSetting('setProjectRootResponse', PluginSettings.setProjectRoot, 'projectRoot', message.value);
        break;

      default:
        payload = {
          command: 'error',
          success: false,
          error: `Unknown command: ${message.command}`,
        };
        break;
    }
  } catch (error) {
    payload = {
      command: 'error',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  webview.postMessage(payload);
};
