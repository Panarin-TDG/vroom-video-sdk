import Janus, { JanusJS } from '../janus'
import Publisher from './publisher'
import Subscriber from './subscriber'


interface SDKInterface {

    janus: Janus

    pubilsher?: Publisher

    subscriber?: Subscriber

}

class VROOMSDK implements SDKInterface {

    janus: Janus

    constructor() {
        this.janus = new Janus({ server: '' })
    }

    initialize() {
        const { janus } = this

        const opaqueId = "VROOM_SDK-" + Janus.randomString(12)

        const pub = new Publisher({ janus, opaqueId })

        const sub = new Subscriber({ janus, opaqueId })

        sub.init()

        pub.onReceieveParticipants = (msg: any, roomId: string, privateId: string) => sub.handleParticipants(msg, roomId, privateId)

        pub.onEvent = (msg: any, pid: string, displayName: string) => sub.handleOnEventFromPublisher(msg, pid, displayName)

        pub.init()

    }

}


export default VROOMSDK