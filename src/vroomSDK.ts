import {vroomSDKBase} from "./types/vroomSDK.base";
import { sdkVersion } from "./constants";

export const vroomSDK: vroomSDKBase = {
  version: sdkVersion,
  config: undefined,
  setConfig: () => {}
}
