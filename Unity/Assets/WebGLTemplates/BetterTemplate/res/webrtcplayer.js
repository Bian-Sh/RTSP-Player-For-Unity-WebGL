class WebRtcPlayer {
    static server = '127.0.0.1:8083';
    webrtc = null;
    video = null;
    server = null;
    rsdpLink = null;
    stream = new MediaStream();
    uuid = null;
    channel = 0;
    webrtcSendChannelInterval = null;
    options = {
        onStatusChange: null,
        onVideoPlayed: null
    };

    constructor(id, uuid, options = {}) {
        this.server = WebRtcPlayer.server;
        this.video = document.getElementById(id);
        this.uuid = uuid;
        Object.assign(this.options, options);
        this.createLinks();
    }

    createLinks() {
        this.rsdpLink = "//" + this.server + "/stream/" + this.uuid + "/channel/" + this.channel + "/webrtc?uuid=" + this.uuid + '&channel=' + this.channel;
    }

    play() {
        this.webrtc = new RTCPeerConnection({
            iceServers: [{
                urls: ["stun:stun.l.google.com:19302"]
            }],
            sdpSemantics: "unified-plan"
        });
        this.webrtc.onnegotiationneeded = this.handleNegotiationNeeded.bind(this);
        this.webrtc.ontrack = this.onTrack.bind(this);

        this.webrtc.addTransceiver('video', {
            'direction': 'sendrecv'
        });

        this.webrtc.onconnectionstatechange = () => {
            if (typeof this.options.onStatusChange == 'function') {
                this.options.onStatusChange(this.webrtc.connectionState);
            }
        }

        var webrtcSendChannel = this.webrtc.createDataChannel('foo');
        webrtcSendChannel.onclose = () => {
            console.log('sendChannel has closed');
            if (this.webrtcSendChannelInterval != null) {
                clearInterval(this.webrtcSendChannelInterval);
                this.webrtcSendChannelInterval = null
            }
        }
        webrtcSendChannel.onopen = () => {
            console.log('sendChannel has opened');
            webrtcSendChannel.send('ping');
            this.webrtcSendChannelInterval = setInterval(() => {
                webrtcSendChannel.send('ping');
            }, 1000)
        }
        webrtcSendChannel.onmessage = e => console.log(e.data);
    }

    async handleNegotiationNeeded() {
        let offer = await this.webrtc.createOffer();
        await this.webrtc.setLocalDescription(offer);

        // 请注意：如果 uuid 错误将出现 500 (Internal Server Error) 的报错
        // caution:  if you pass a wrong uuid , there will be a '500' error occured in the console.
            $.post(this.rsdpLink, {
                data: btoa(this.webrtc.localDescription.sdp)
            }, function (data) {
                try {
                    this.webrtc.setRemoteDescription(new RTCSessionDescription({
                        type: 'answer',
                        sdp: atob(data)
                    }))
                } catch (e) {
                    console.warn(e);
                }
            }.bind(this));
    }

    onTrack(event) {
        this.stream.addTrack(event.track);
        this.video.srcObject = this.stream;
        this.video.play();
        if (typeof this.options.onVideoPlayed == 'function') {
            this.options.onVideoPlayed();
            console.log("should recenter  div");
        }

    }

    load(uuid) {
        this.destroy();
        this.uuid = uuid;
        this.createLinks();
        this.play();
    }

    destroy() {
        if (this.webrtc != null) {
            this.webrtc.close();
            this.webrtc = null;
        }
        this.webrtc = null;
        this.video.srcObject = null;
        this.stream = new MediaStream();
    }

    static setServer(serv) {
        this.server = serv;
    }
}