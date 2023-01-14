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

    pubilsher?: Publisher

    subscriber?: Subscriber

    private videoId?: string

    private onRemoteVideoStream?: Function

    constructor() {
        this.janus = new Janus({ server: '' })
    }

    initialize(videoMuted: boolean = false, audioMuted: boolean = false, videoElementId?: string) {
        const { janus } = this

        this.videoId = videoElementId

        const opaqueId = "VROOM_SDK-" + Janus.randomString(12)

        const pub = new Publisher({ janus, opaqueId, micMuted: audioMuted, videoMuted: videoMuted })

        const sub = new Subscriber({ janus, opaqueId })

        sub.init()

        pub.onReceieveParticipants = (msg: any, roomId: string, privateId: string) => sub.handleParticipants(msg, roomId, privateId)

        pub.onEvent = (msg: any, pid: string, displayName: string) => sub.handleOnEventFromPublisher(msg, pid, displayName)

        pub.onClean = (id: string) => sub.handleOnClean(id)

        pub.init()

        this.pubilsher = pub

        this.subscriber = sub

    }

    setOnRemoteVideoStream(fn: Function) {
        this.onRemoteVideoStream = fn
    }


    join(roomId: string, displayName: string) {
        this.pubilsher?.joinRoom(roomId, displayName)
    }

}


export default VROOMSDK