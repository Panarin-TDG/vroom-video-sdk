import {sdkVersion} from "../constants";
import type { sdkVersionType } from "../types";

export function version(): sdkVersionType {
  return sdkVersion;
}
