import {VroomSDKBase} from "./types/vroomSDK.base";
import {iceServer, sdkVersion, sdkServer, sdkProtocol, WS_EVENT} from "./constants";
import randomString from "./helpers/randomString.helper";
import transactionFn from "./transactions/index.transactionFn";

export class VroomSDK implements VroomSDKBase {
  version = sdkVersion;
  config = { endpoint: sdkServer, iceServer: iceServer };
  transactions = {};
  wsConn = undefined;

  init() {}

  dependencies = {
    isArray: () => {},
    webRTCAdapter: () => {},
    httpAPICall: () => {},
    newWebSocket: () => {
      const transaction = randomString(12);
      const ws = new WebSocket(this.config.endpoint, sdkProtocol);
      ws.addEventListener(WS_EVENT.OPEN, (event: Event) => {
        // @ts-ignore
        this.transactions[transaction] = transactionFn.sessionCreateSuccess;
        const wsEvent: WebSocket = event.target as WebSocket;
        wsEvent.send(JSON.stringify({janus: 'create', transaction: transaction}));
      });
      ws.addEventListener(WS_EVENT.MESSAGE, (event) => { console.log('WS on message', event); });
      ws.addEventListener(WS_EVENT.CLOSE, () => { console.log('WS on close'); });
      ws.addEventListener(WS_EVENT.ERROR, () => { console.log('WS on Error'); });

      return ws;
    },
    extension: {
      extensionId: 'hapfgfdkleiggjjpfpenajgdnfckjpaj',
      isInstalled: () => {},
      getScreen: () => {},
      init: () => {}
    }
  }
}
