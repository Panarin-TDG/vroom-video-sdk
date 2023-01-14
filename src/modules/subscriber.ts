import Janus, { JanusJS } from '../janus'

interface SubscriberInterface {

    janus: Janus

    // feeds
    remoteFeed?: JanusJS.PluginHandle

    feedStreams: { [id: string]: any }

    subStreams: { [id: string]: any }

    slots: { [id: string]: any }

    mids: { [id: string]: any }

    subscriptions: { [id: string]: any }

    remoteTracks: { [id: string]: any }

    feeds: { [id: string]: any }

}

export interface SubscriberConstructorOption {

    janus: Janus

    p?: JanusJS.PluginHandle

    opaqueId: string

}


class Subscriber implements SubscriberInterface {

    janus: Janus

    remoteFeed?: JanusJS.PluginHandle

    feedStreams: { [id: string]: any } = {}

    subStreams: { [id: string]: any } = {}

    slots: { [id: string]: any } = {}

    mids: { [id: string]: any } = {}

    subscriptions: { [id: string]: any } = {}

    remoteTracks: { [id: string]: any } = {}

    feeds: { [id: string]: any } = {}

    private creatingSubscription = false

    private opaqueId: string

    private roomId?: string

    private privateId?: string



    constructor(option: SubscriberConstructorOption) {
        this.janus = option.janus
        this.opaqueId = option.opaqueId
    }

    init() {
        this.janus.attach(
            {
                plugin: "janus.plugin.videoroom",
                // opaqueId: opaqueId,
                success: (pluginHandle: JanusJS.PluginHandle) => {
                    this.remoteFeed = pluginHandle;
                    this.remoteTracks = {};
                    Janus.log("Plugin attached! (" + this.remoteFeed.getPlugin() + ", id=" + this.remoteFeed.getId() + ")");
                    Janus.log("  -- This is a multistream subscriber");
                },
                error: function (error) {
                    Janus.error("  -- Error attaching plugin...", error);
                },
                iceState: function (state) {
                    Janus.log("ICE state (remote feed) changed to " + state);
                },
                webrtcState: function (on) {
                    Janus.log("Janus says this WebRTC PeerConnection (remote feed) is " + (on ? "up" : "down") + " now");
                },
                slowLink: function (uplink, lost, mid) {
                    Janus.warn("Janus reports problems " + (uplink ? "sending" : "receiving") +
                        " packets on mid " + mid + " (" + lost + " lost packets)");
                },
                onmessage: (msg, jsep) => {
                    Janus.debug(" ::: Got a message (subscriber) :::", msg);
                    let event = msg["videoroom"];
                    Janus.debug("Event: " + event);
                    if (msg["error"]) {
                        Janus.error(msg["error"]);
                    } else if (event) {
                        if (event === "attached") {
                            // Now we have a working subscription, next requests will update this one
                            this.creatingSubscription = false;
                            Janus.log("Successfully attached to feed in room " + msg["room"]);
                        } else if (event === "event") {
                            // Check if we got an event on a simulcast-related event from this publisher

                        } else {
                            // What has just happened?
                        }
                    }
                    if (msg["streams"]) {
                        // Update map of subscriptions by mid
                        for (let i in msg["streams"]) {
                            let mid = msg["streams"][i]["mid"];
                            this.subStreams[mid] = msg["streams"][i];
                            let feed = this.feedStreams[msg["streams"][i]["feed_id"]];
                            if (feed && feed.slot) {
                                this.slots[mid] = feed.slot;
                                this.mids[feed.slot] = mid;
                            }
                        }
                    }

                    if (jsep) {
                        Janus.debug("Handling SDP as well...", jsep);
                        // Answer and attach
                        this.remoteFeed?.createAnswer(
                            {
                                jsep: jsep,
                                // We only specify data channels here, as this way in
                                // case they were offered we'll enable them. Since we
                                // don't mention audio or video tracks, we autoaccept them
                                // as recvonly (since we won't capture anything ourselves)
                                tracks: [
                                    { type: 'data' }
                                ],
                                success: (successJsep: JanusJS.JSEP) => {
                                    Janus.debug("Got SDP!");
                                    Janus.debug(successJsep);
                                    let body = { request: "start", room: this.roomId };
                                    this.remoteFeed?.send({ message: body, jsep: successJsep });
                                },
                                error: function (error: Error) {
                                    Janus.error("WebRTC error:", error);
                                }
                            });
                    }
                },
                onlocaltrack: function (track, on) {
                    // The subscriber stream is recvonly, we don't expect anything here
                },
                onremotetrack: (track, mid, on) => {
                    Janus.debug("Remote track (mid=" + mid + ") " + (on ? "added" : "removed") + ":", track);
                    // Which publisher are we getting on this mid?
                    let sub = this.subStreams[mid];
                    let feed = this.feedStreams[sub.feed_id];
                    Janus.debug(" >> This track is coming from feed " + sub.feed_id + ":", feed);
                    let slot = this.slots[mid];
                    if (feed && !slot) {
                        slot = feed.slot;
                        this.slots[mid] = feed.slot;
                        this.mids[feed.slot] = mid;
                    }
                    Janus.debug(" >> mid " + mid + " is in slot " + slot);
                    if (!on) {
                        // Track removed, get rid of the stream and the rendering
                        // $('#remotevideo' + slot + '-' + mid).remove();
                        if (track.kind === "video" && feed) {
                            feed.remoteVideos--;
                            if (feed.remoteVideos === 0) {
                                // No video, at least for now: show a placeholder
                                // if($('#videoremote' + slot + ' .no-video-container').length === 0) {
                                //     $('#videoremote' + slot).append(
                                //         '<div class="no-video-container">' +
                                //             '<i class="fa fa-video-camera fa-5 no-video-icon"></i>' +
                                //             '<span class="no-video-text">No remote video available</span>' +
                                //         '</div>');
                                // }
                            }
                        }


                        Janus.stopAllTracks(this.remoteTracks[mid])

                        delete this.remoteTracks[mid];
                        delete this.slots[mid];
                        delete this.mids[slot];
                        return;
                    }
                    // If we're here, a new track was added
                    if (feed.spinner) {
                        feed.spinner.stop();
                        feed.spinner = null;
                    }
                    // if($('#remotevideo' + slot + '-' + mid).length > 0)
                    //     return;
                    if (track.kind === "audio") {
                        // New audio track: create a stream out of it, and use a hidden <audio> element
                        const stream = new MediaStream([track]);
                        this.remoteTracks[mid] = stream;
                        Janus.log("Created remote audio stream:", stream);
                        // $('#videoremote' + slot).append('<audio class="hide" id="remotevideo' + slot + '-' + mid + '" autoplay playsinline/>');
                        // Janus.attachMediaStream($('#remotevideo' + slot + '-' + mid).get(0), stream);
                        // if(feed.remoteVideos === 0) {
                        //     // No video, at least for now: show a placeholder
                        //     if($('#videoremote' + slot + ' .no-video-container').length === 0) {
                        //         $('#videoremote' + slot).append(
                        //             '<div class="no-video-container">' +
                        //                 '<i class="fa fa-video-camera fa-5 no-video-icon"></i>' +
                        //                 '<span class="no-video-text">No remote video available</span>' +
                        //             '</div>');
                        //     }
                        // }
                    } else {
                        // New video track: create a stream out of it
                        feed.remoteVideos++;
                        // $('#videoremote' + slot + ' .no-video-container').remove();
                        const stream = new MediaStream([track]);
                        this.remoteTracks[mid] = stream;
                        Janus.log("Created remote video stream:", stream);
                        // $('#videoremote' + slot).append('<video class="rounded centered" id="remotevideo' + slot + '-' + mid + '" width=100% autoplay playsinline/>');
                        // $('#videoremote' + slot).append(
                        //     '<span class="label label-primary hide" id="curres'+slot+'" style="position: absolute; bottom: 0px; left: 0px; margin: 15px;"></span>' +
                        //     '<span class="label label-info hide" id="curbitrate'+slot+'" style="position: absolute; bottom: 0px; right: 0px; margin: 15px;"></span>');
                        // Janus.attachMediaStream($('#remotevideo' + slot + '-' + mid).get(0), stream);
                        // Note: we'll need this for additional videos too
                        // if(!bitrateTimer[slot]) {
                        //     $('#curbitrate' + slot).removeClass('hide').show();
                        //     bitrateTimer[slot] = setInterval(function() {
                        //         if(!$("#videoremote" + slot + ' video').get(0))
                        //             return;
                        //         // Display updated bitrate, if supported
                        //         let bitrate = remoteFeed.getBitrate(mid);
                        //         $('#curbitrate' + slot).text(bitrate);
                        //         // Check if the resolution changed too
                        //         let width = $("#videoremote" + slot + ' video').get(0).videoWidth;
                        //         let height = $("#videoremote" + slot + ' video').get(0).videoHeight;
                        //         if(width > 0 && height > 0)
                        //             $('#curres' + slot).removeClass('hide').text(width+'x'+height).show();
                        //     }, 1000);
                        // }
                    }
                },
                oncleanup: () => {
                    Janus.log(" ::: Got a cleanup notification (remote feed) :::");
                    for (let i = 1; i < 6; i++) {
                        this.feedStreams[i].simulcastStarted = false;
                        this.feedStreams[i].remoteVideos = 0;
                    }
                    this.remoteTracks = {};
                }
            });
    }

    setRoomId(id: string) {
        this.roomId = id
    }

    setPrivateId(id: string) {
        this.privateId = id
    }

    handleParticipants(msg: any, roomId: string, privateId: string) {

        this.setRoomId(roomId)

        this.setPrivateId(privateId)

        let list = msg["publishers"];
        Janus.debug("Got a list of available publishers/feeds:", list);
        let sources = null;
        for (let f in list) {
            if (list[f]["dummy"])
                continue;
            let id = list[f]["id"];
            let display = list[f]["display"];
            let streams = list[f]["streams"];
            for (let i in streams) {
                let stream = streams[i];
                stream["id"] = id;
                stream["display"] = display;
            }
            let slot = this.feedStreams[id] ? this.feedStreams[id].slot : null;
            let remoteVideos = this.feedStreams[id] ? this.feedStreams[id].remoteVideos : 0;
            this.feedStreams[id] = {
                id: id,
                display: display,
                streams: streams,
                slot: slot,
                remoteVideos: remoteVideos
            }
            Janus.debug("  >> [" + id + "] " + display + ":", streams);
            if (!sources)
                sources = [];
            sources.push(streams);
        }
        if (sources)
            this.subscribeTo(sources, true);
    }

    handleOnClean(id: string) {
        delete this.feedStreams[id]
    }

    handleOnEventFromPublisher(msg: any, myid: string, myusername?: string) {
        if (msg["streams"]) {
            let streams = msg["streams"];
            for (let i in streams) {
                let stream = streams[i];
                stream["id"] = myid;
                stream["display"] = myusername;
            }
            this.feedStreams[myid] = {
                id: myid,
                display: myusername,
                streams: streams
            }
        } else if (msg["publishers"]) {
            let list = msg["publishers"];
            Janus.debug("Got a list of available publishers/feeds:", list);
            let sources = null;
            for (let f in list) {
                if (list[f]["dummy"])
                    continue;
                let id = list[f]["id"];
                let display = list[f]["display"];
                let streams = list[f]["streams"];
                for (let i in streams) {
                    let stream = streams[i];
                    stream["id"] = id;
                    stream["display"] = display;
                }
                let slot = this.feedStreams[id] ? this.feedStreams[id].slot : null;
                let remoteVideos = this.feedStreams[id] ? this.feedStreams[id].remoteVideos : 0;
                this.feedStreams[id] = {
                    id: id,
                    display: display,
                    streams: streams,
                    slot: slot,
                    remoteVideos: remoteVideos
                }
                Janus.debug("  >> [" + id + "] " + display + ":", streams);
                if (!sources)
                    sources = [];
                sources.push(streams);
            }
            if (sources)
                this.subscribeTo(sources);
        } else if (msg["leaving"]) {
            // One of the publishers has gone away?
            let leaving = msg["leaving"];
            Janus.log("Publisher left: " + leaving);
            this.unsubscribeById(leaving);
        } else if (msg["unpublished"]) {
            // One of the publishers has unpublished?
            let unpublished = msg["unpublished"];

            this.unsubscribeById(unpublished);
        } else if (msg["error"]) {
            if (msg["error_code"] === 426) {
                // This is a "no such room" error: give a more meaningful description
                Janus.error(
                    "<p>Apparently room <code>" + this.roomId + "</code> (the one this demo uses as a test room) " +
                    "does not exist...</p><p>Do you have an updated <code>janus.plugin.videoroom.cfg</code> " +
                    "configuration file? If not, make sure you copy the details of room <code>" + this.roomId + "</code> " +
                    "from that sample in your current configuration file, then restart Janus and try again."
                );
            } else {
                Janus.error(msg["error"]);
            }
        }
    }

    unsubscribeById(id: string) {
        // Unsubscribe from this publisher
        let feed = this.feedStreams[id];
        if (!feed)
            return

        Janus.debug("Feed " + id + " (" + feed.display + ") has left the room, detaching");

        delete this.feeds[feed.slot];
        this.feeds.slot = 0;
        delete this.feedStreams[id];
        // Send an unsubscribe request
        let unsubscribe = {
            request: "unsubscribe",
            streams: [{ feed: id }]
        };
        if (this.remoteFeed != null)
            this.remoteFeed.send({ message: unsubscribe });
        delete this.subscriptions[id];
    }

    subscribeTo(sources: any[], firstJoin: boolean = false) {

        if (this.remoteFeed) {
            let added = null, removed = null;
            for (let s in sources) {
                let streams = sources[s];
                for (let i in streams) {
                    let stream = streams[i];
                    // If the publisher is VP8/VP9 and this is an older Safari, let's avoid video
                    if (stream.type === "video" && Janus.webRTCAdapter.browserDetails.browser === "safari" &&
                        (stream.codec === "vp9" || (stream.codec === "vp8" && !Janus.safariVp8))) {
                        Janus.warn("Publisher is using " + stream.codec.toUpperCase +
                            ", but Safari doesn't support it: disabling video stream #" + stream.mindex);
                        continue;
                    }
                    if (stream.disabled) {
                        Janus.log("Disabled stream:", stream);
                        // Unsubscribe
                        if (!removed)
                            removed = [];
                        removed.push({
                            feed: stream.id,	// This is mandatory
                            mid: stream.mid		// This is optional (all streams, if missing)
                        });
                        delete this.subscriptions[stream.id][stream.mid];
                        continue;
                    }
                    if (this.subscriptions[stream.id] && this.subscriptions[stream.id][stream.mid]) {
                        Janus.log("Already subscribed to stream, skipping:", stream);
                        continue;
                    }
                    // Find an empty slot in the UI for each new source
                    if (!this.feedStreams[stream.id].slot) {
                        let slot;
                        for (let i = 1; i < 6; i++) {
                            if (!this.feeds[i]) {
                                slot = i;
                                this.feeds[slot] = stream.id;
                                this.feedStreams[stream.id].slot = slot;
                                this.feedStreams[stream.id].remoteVideos = 0;
                                // $('#remote' + slot).removeClass('hide').html(escapeXmlTags(stream.display)).show();
                                break;
                            }
                        }
                    }
                    // Subscribe
                    if (!added)
                        added = [];
                    added.push({
                        feed: stream.id,	// This is mandatory
                        mid: stream.mid		// This is optional (all streams, if missing)
                    })

                    if (!this.subscriptions[stream.id])
                        this.subscriptions[stream.id] = {};

                    this.subscriptions[stream.id][stream.mid] = true;
                }
            }

            if ((!added || added.length === 0) && (!removed || removed.length === 0)) {
                // Nothing to do
                return;
            }

            if (firstJoin) {
                let subscribe = {
                    request: "join",
                    room: this.roomId,
                    ptype: "subscriber",
                    streams: added,
                    private_id: this.privateId!
                };

                this.remoteFeed.send({ message: subscribe });

                return
            }


            let update: any = { request: 'update' };
            if (added)
                update.subscribe = added;
            if (removed)
                update.unsubscribe = removed;
            this.remoteFeed.send({ message: update });
            // Nothing else we need to do
            return;
        }

    }


}



export default Subscriber