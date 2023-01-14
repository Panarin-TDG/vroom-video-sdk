import {VroomSDKBase} from "./types/vroomSDK.base";
import {iceServer, sdkVersion, sdkServer} from "./constants";

export class VroomSDK implements VroomSDKBase {
  version = sdkVersion;
  config = {
    endpoint: sdkServer,
    iceServer: iceServer
  };

  init() {}

  dependencies = {
    isArray: () => {},
    webRTCAdapter: () => {},
    httpAPICall: () => {},
    newWebSocket: () => {},
    extension: {
      extensionId: 'hapfgfdkleiggjjpfpenajgdnfckjpaj',
      isInstalled: () => {},
      getScreen: () => {},
      init: () => {}
    }
  }
}
