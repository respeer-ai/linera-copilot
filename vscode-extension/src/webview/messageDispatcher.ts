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

function handleGetSettings(commandResponse: string): MessagePayload<Record<string, any>> {
  const settings = PluginSettings.getAllSettings();
  return {
    command: commandResponse,
    success: true,
    data: settings,
  };
}

async function handleSaveSettings(payload: MessagePayload<Record<string, any>>, commandResponse: string): Promise<MessagePayload<Record<string, any>>> {
  const settings = PluginSettings.getAllSettings();
  await PluginSettings.saveAllSettings(payload.updated as Record<string, string>);
  return {
    command: commandResponse,
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

  const command = message.command;
  const commandResponse = `${command}Response`

  try {
    switch (command) {
      case 'getSettings':
        payload = handleGetSettings(commandResponse);
        break;

      case 'saveSettings':
        payload = await handleSaveSettings(message, commandResponse);
        break;

      case 'executeToolCall':
        await executeToolCall(message.data)
        payload = {
          command: commandResponse,
          success: true
        }
        break;

      case 'getSdkVersion':
        payload = await handleGetSingleSetting(commandResponse, PluginSettings.getSdkVersion, 'sdkVersion');
        break;
      case 'setSdkVersion':
        payload = await handleSetSingleSetting(commandResponse, PluginSettings.setSdkVersion, 'sdkVersion', message.value);
        break;

      case 'getModelUrl':
        payload = await handleGetSingleSetting(commandResponse, PluginSettings.getModelUrl, 'modelUrl');
        break;
      case 'setModelUrl':
        payload = await handleSetSingleSetting(commandResponse, PluginSettings.setModelUrl, 'modelUrl', message.value);
        break;

      case 'getApiToken':
        payload = await handleGetSingleSetting(commandResponse, PluginSettings.getApiToken, 'apiToken');
        break;
      case 'setApiToken':
        payload = await handleSetSingleSetting(commandResponse, PluginSettings.setApiToken, 'apiToken', message.value);
        break;

      case 'getModelName':
        payload = await handleGetSingleSetting(commandResponse, PluginSettings.getModelName, 'modelName');
        break;
      case 'setModelName':
        payload = await handleSetSingleSetting(commandResponse, PluginSettings.setModelName, 'modelName', message.value);
        break;

      case 'getProjectRoot':
        payload = await handleGetSingleSetting(commandResponse, PluginSettings.getProjectRoot, 'projectRoot');
        break;
      case 'setProjectRoot':
        payload = await handleSetSingleSetting(commandResponse, PluginSettings.setProjectRoot, 'projectRoot', message.value);
        break;

      default:
        payload = {
          command: commandResponse,
          success: false,
          error: `Unknown command: ${message.command}`,
        };
        break;
    }
  } catch (error) {
    payload = {
      command: commandResponse,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  webview.postMessage(payload);
};
