import Janus, { JanusJS } from 'janus/janus'
import { getQueryStringValue, escapeXmlTags } from '../utils/string.util'



interface PublisherInterface {

    janus: Janus

    plugin?: JanusJS.PluginHandle

    microphoneMuted: boolean

    videoMuted: boolean

    onReceieveParticipants?: Function

    onEvent?: Function

    onClean?: Function

    roomId?: string

    displayName?: string

}

export interface PublisherConstructorOption {

    janus: Janus

    p?: JanusJS.PluginHandle

    micMuted?: boolean

    videoMuted?: boolean

    opaqueId: string

}


class Publisher implements PublisherInterface {

    janus: Janus

    plugin?: JanusJS.PluginHandle

    microphoneMuted: boolean

    videoMuted: boolean

    onReceieveParticipants?: Function

    onEvent?: Function

    onClean?: Function

    roomId?: string

    displayName?: string

    private opaqueId: string

    private publisherId?: string

    private privateId?: string

    private localTracks: { [id: string]: any } = {}

    constructor(option: PublisherConstructorOption) {
        this.janus = option.janus
        this.microphoneMuted = option.micMuted || false
        this.videoMuted = option.videoMuted || false
        this.opaqueId = option.opaqueId
    }


    init() {
        this.janus.attach(
            {
                plugin: "janus.plugin.videoroom",
                opaqueId: this.opaqueId,
                success: (pluginHandle) => {

                    Janus.log("Publiser Plugin attached! (" + pluginHandle.getPlugin() + ", id=" + pluginHandle.getId() + ")");
                    Janus.log("  -- This is a publisher/manager");

                    this.plugin = pluginHandle!


                },
                error: (error) => {
                    Janus.error("  -- Error attaching publisher plugin...", error);
                },
                iceState: (state) => {
                    Janus.log("Publisher ICE state changed to " + state);
                },
                mediaState: (medium, on, mid) => {
                    Janus.log("Publisher Janus " + (on ? "started" : "stopped") + " receiving our " + medium + " (mid=" + mid + ")");
                },
                slowLink: (uplink, lost, mid) => {
                    Janus.warn("Janus reports problems " + (uplink ? "sending" : "receiving") +
                        " packets on mid " + mid + " (" + lost + " lost packets)");
                },
                onmessage: (msg, jsep) => {
                    Janus.debug(" ::: Got a message (publisher) :::", msg);
                    let event = msg["videoroom"];
                    Janus.debug("Event: " + event);
                    if (event != undefined && event != null) {
                        if (event === "joined") {
                            // Publisher/manager created, negotiate WebRTC and attach to existing feeds, if any
                            this.publisherId = msg["id"];
                            this.privateId = msg["private_id"];
                            Janus.log("Successfully joined room " + msg["room"] + " with ID " + this.publisherId);
                            this.publishOwnFeed(true)
                            // Any new feed to attach to?

                            if (msg["publishers"]) {
                                if (this.onReceieveParticipants) {
                                    this.onReceieveParticipants(msg, this.roomId, this.privateId)
                                }
                            }
                        } else if (event === "destroyed") {
                            // The room has been destroyed
                            Janus.warn("The room has been destroyed!");
                            // bootbox.alert("The room has been destroyed", function () {
                            //     window.location.reload();
                            // });
                        } else if (event === "event") {
                            // Any info on our streams or a new feed to attach to?

                            if (msg["unpublished"]) {
                                // One of the publishers has unpublished?
                                let unpublished = msg["unpublished"];
                                Janus.log("Publisher left: " + unpublished);
                                if (unpublished === 'ok') {
                                    // That's us
                                    this.plugin?.hangup();
                                    return;
                                }
                            }

                            if (this.onEvent) {
                                this.onEvent(msg)
                            }



                        }
                    }
                    if (jsep && this.plugin!) {
                        Janus.debug("Handling SDP as well...", jsep);
                        this.plugin?.handleRemoteJsep({ jsep: jsep });
                    }
                },
                onlocaltrack: (track, on) => {
                    Janus.debug(" ::: Got a local track event :::");
                    Janus.debug("Local track " + (on ? "added" : "removed") + ":", track);
                    // We use the track ID as name of the element, but it may contain invalid characters
                    let trackId = track.id.replace(/[{}]/g, "");
                    if (!on) {
                        // Track removed, get rid of the stream and the rendering
                        let stream = this.localTracks[trackId];
                        if (stream) {
                            try {
                                let tracks = stream.getTracks();
                                for (let i in tracks) {
                                    let mst = tracks[i];
                                    if (mst)
                                        mst.stop();
                                }
                            } catch (e) { }
                        }
                        delete this.localTracks[trackId];
                        return;
                    }
                    // If we're here, a new track was added
                    let stream = this.localTracks[trackId];
                    if (stream) {
                        // We've been here already
                        return;
                    }

                },
                oncleanup: () => {
                    Janus.log(" ::: Got a cleanup notification: we are unpublished now :::");
                    if (this.onClean) {
                        this.onClean()
                    }
                    // delete feedStreams[myid];
                    this.localTracks = {};
                }
            })
    }

    joinRoom(roomId: string, name: string) {

        if (!this.plugin) {
            throw Error('Please call method init ')
        }

        this.roomId = roomId
        this.displayName = name

        let joinMessage = {
            request: "join",
            room: roomId,
            ptype: "publisher",
            display: name
        };

        this.plugin?.send({ message: joinMessage })

    }


    publishOwnFeed = (useAudio: boolean) => {
        let tracks = []

        if (useAudio) {
            tracks.push({ type: 'audio', capture: true, recv: false })
        }

        tracks.push({ type: 'video', capture: true, recv: false })


        this.plugin?.createOffer(
            {
                tracks: tracks,
                success: (jsep: JanusJS.JSEP) => {
                    Janus.debug("Got publisher SDP!");
                    Janus.debug(jsep);
                    let publish: any = { request: "configure", audio: useAudio, video: true }
                    // You can force a specific codec to use when publishing by using the
                    // audiocodec and videocodec properties, for instance:
                    // 		publish["audiocodec"] = "opus"
                    // to force Opus as the audio codec to use, or:
                    // 		publish["videocodec"] = "vp9"
                    // to force VP9 as the videocodec to use. In both case, though, forcing
                    // a codec will only work if: (1) the codec is actually in the SDP (and
                    // so the browser supports it), and (2) the codec is in the list of
                    // allowed codecs in a room. With respect to the point (2) above,
                    // refer to the text in janus.plugin.videoroom.cfg for more details
                    // if (acodec)
                    //     publish["audiocodec"] = acodec;
                    // if (vcodec)
                    //     publish["videocodec"] = vcodec;

                    this.plugin?.send({ message: publish, jsep: jsep })
                },
                error: (error: Error) => {

                    Janus.error("WebRTC error:", error);

                    if (useAudio) {
                        this.publishOwnFeed(false);
                    }
                }
            })
    }

    unpublishOwnFeed = () => {
        // Unpublish our stream
        let unpublish = { request: "unpublish" };
        this.plugin?.send({ message: unpublish });
    }

    toggleAudioMute = () => {
        let muted = this.plugin?.isAudioMuted()

        Janus.log((muted ? "Unmuting" : "Muting") + " audio local stream...")

        if (muted)
            this.plugin?.unmuteAudio()
        else
            this.plugin?.muteAudio()

        muted = this.plugin?.isAudioMuted()

        this.microphoneMuted = muted!
    }


    toggleVideoMute = () => {
        let muted = this.plugin?.isVideoMuted()

        Janus.log((muted ? "Unmuting" : "Muting") + " video local stream...")

        if (muted)
            this.plugin?.unmuteVideo()
        else
            this.plugin?.muteVideo()

        muted = this.plugin?.isAudioMuted()

        this.videoMuted = muted!
    }

}


export default Publisher