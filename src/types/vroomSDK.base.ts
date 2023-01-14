import {InitVroomHandler} from "./eventHandlers";

export interface ConfigBase {
  endpoint: string;
  iceServer: Array<object>;
}

export interface extensionInit {
  extensionId: string;
  isInstalled: Function;
  getScreen: Function;
  init: Function;
}

export interface DefaultDependencies {
  isArray: Function;
  webRTCAdapter: any;
  httpAPICall: any;
  newWebSocket: any;
  extension: extensionInit;
}

export interface VroomSDKBase {
  version: string;
  config: ConfigBase | undefined;
  init: InitVroomHandler;
  dependencies: DefaultDependencies;
}
