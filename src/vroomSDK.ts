import {VroomSDKBase} from "./types/vroomSDK.base";
import {iceServer, sdkVersion, sdkServer, sdkProtocol, WS_EVENT, STATUS} from "./constants";
import randomString from "./helpers/randomString.helper";

interface JanusMessage<T = any> {
  janus: string,
  transaction: string,
  data: T
}

export class VroomSDK implements VroomSDKBase {
  version = sdkVersion;
  config = { endpoint: sdkServer, iceServer: iceServer };
  wsConn = undefined;
  transactions = {};

  instantCall = {
    success: () => { return '' },
    error: () => {},
    onCleanup: () => {},
    destroyed: () => {},
  };

  init() {}

  getTransactionsRemain() {
    return this.transactions;
  }

  dependencies = {
    isArray: () => {},
    webRTCAdapter: () => {},
    httpAPICall: () => {},
    newWebSocket: () => {
      const transaction = randomString(12);
      const ws = new WebSocket(this.config.endpoint, sdkProtocol);

      ws.addEventListener(WS_EVENT.OPEN, (event: Event) => {
        // @ts-ignore
        this.transactions[transaction] = (json) => {
          console.log('in transaction', json);
          const successProcess = this.instantCall.success();

          return Promise.resolve(successProcess);
        };

        const wsEvent: WebSocket = event.target as WebSocket;
        wsEvent.send(JSON.stringify({janus: 'create', transaction: transaction}));
      });

      ws.addEventListener(WS_EVENT.MESSAGE, async (event) => {
        // @ts-ignore
        const eventData: JanusMessage = JSON.parse(event?.data || '{}');
        // @ts-ignore
        const reportTransaction = this.transactions[eventData.transaction];

        if (!reportTransaction) return;

        switch (eventData.janus) {
          case STATUS.SUCCESS: {
            await reportTransaction(eventData);
            // @ts-ignore
            delete this.transactions[eventData.transaction];
          }
        }
      });

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
