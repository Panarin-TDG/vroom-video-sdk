/**
 * @name sdkVersion
 * @constant
 * @type {string}
 * @default
 */
export const sdkVersion = '1.0.0';

/**
 * @name sdkServer
 * @constant
 * @type {string}
 * @default
 */
export const sdkServer = 'wss://multistream-poc.truevirtualworld.com/ws1';

/**
 * @name iceServer
 * @constant
 * @type {Array}
 * @default
 */
export const iceServer = [{urls: 'stun:stun.l.google.com:19302'}];

/**
 * @name sdkProtocol
 * @constant
 * @type {string}
 * @default
 */
export const sdkProtocol = 'janus-protocol';

/**
 * @name WS_EVENT
 * @constant
 */
export const WS_EVENT = {
  OPEN: 'open',
  MESSAGE: 'message',
  CLOSE: 'close',
  ERROR: 'error'
}
