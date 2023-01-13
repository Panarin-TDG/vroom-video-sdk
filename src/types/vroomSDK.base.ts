import { SetSdkConfigHandler } from "./eventHandlers";

export interface configBase {
  endpoint: string;
}

export interface vroomSDKBase {
  version: string;
  config: configBase | undefined;
  setConfig: SetSdkConfigHandler;
}
