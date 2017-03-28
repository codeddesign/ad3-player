import { iframe_template } from '../view/templates';
import $ from '../../utils/element';
import device from '../../utils/device';

class VPAIDJavaScript {
    constructor(player, slot) {
        this.__player = player;
        this.__slot = slot;

        this.$unit = false;
        this.$called = {};

        this.$config = {
            view: 'transparent',
            bitrate: this.slot().media().bitrate() || 59.97,
            width: this.__player.size.width,
            height: this.__player.size.height
        };

        this.$events = [
            'Loaded',
            'Skipped',
            'Started',
            'Stopped',
            'LinearChange',
            'ExpandedChange',
            'RemainingTimeChange',
            'VolumeChange',
            'Impression',
            'VideoStart',
            'VideoFirstQuartile',
            'VideoMidpoint',
            'VideoThirdQuartile',
            'VideoComplete',
            'ClickThru',
            'Interaction',
            'UserAcceptInvitation',
            'UserMinimize',
            'UserClose',
            'Paused',
            'Playing',
            'Log',
            'Error',
        ];

        this.$called = {};
    }

    /**
     * @return {Slot}
     */
    slot() {
        return this.__slot;
    }

    /**
     * @return {DOMElement}
     */
    unit() {
        return this.$unit;
    }

    /**
     * @param {String} name
     *
     * @return {Boolean}
     */
    called(name) {
        return this.$called[name] || false;
    }

    /**
     * @return {VPAIDJavaScript}
     */
    create() {
        const self = this,
            $target = this.slot().element(),
            _window = $target.html(iframe_template()).node.contentWindow,
            _iframe = _window.document;

        $target.addClass('hasiframe');

        _iframe.inDapIF = true;

        const attrs = {
                src: this.slot().media().source()
            },
            events = {
                onload() {
                    self.$unit = _window['getVPAIDAd']();

                    self.loadUnit();
                }
            };

        const _body = $(_iframe).find('body');

        // slot
        this.$unitSlot = _body;

        // video slot
        this.$unitVideoSlot = _body.append('video', {
            'preload': 'auto',
            'webkit-playsinline': '',
            'playsinline': '',
            'muted': ''
        });

        this.$unitVideoSlot
            .css('width', '100%')
            .css('height', '100%');

        // asset
        _body.append('script', attrs, events);

        if (!device.iphoneInline()) {
            this.__player.view.sound().hide();
        }

        return this;
    }

    /**
     * @return {VPAIDJavaScript}
     */
    loadUnit() {
        if (this.called('loaded')) {
            return this;
        }

        this.$events.forEach((name, data) => {
            this.$unit.subscribe((ev) => {
                this._event(name, ev);
            }, `Ad${name}`);
        });

        let creativeData = {
            AdParameters: this.slot().creative().adParameters()
        };

        let environmentVars = {
            slot: this.$unitSlot.node,
            videoSlot: this.$unitVideoSlot.node,
            videoSlotCanAutoPlay: false
        };

        this.$unit.initAd(
            this.$config.width,
            this.$config.height,
            this.$config.view,
            this.$config.bitrate,
            creativeData,
            environmentVars
        );

        return this;
    }

    /**
     * @return {VPAIDJavaScript}
     */
    start() {
        if (!this.called('loaded')) {
            return this;
        }

        if (!this.called('started')) {
            this.unit().startAd();
        }

        return this;
    }

    /**
     * @return {VPAIDJavaScript}
     */
    stop() {
        this.unit().stopAd();

        return this;
    }

    /**
     * @return {VPAIDJavaScript}
     */
    pause() {
        this.unit().pauseAd();

        return this;
    }

    /**
     * @return {VPAIDJavaScript}
     */
    resume() {
        this.unit().resumeAd();

        return this;
    }

    /**
     * @return {VPAIDJavaScript}
     */
    skip() {
        this.unit().skipAd();

        return this;
    }

    /**
     * @param {Boolean|undefined} volume
     *
     * @return {VPAIDJavaScript|Boolean}
     */
    volume(volume) {
        if (typeof volume == 'undefined') {
            return this.$unitVideoSlot.node.muted;
        }

        this.$unitVideoSlot.node.muted = volume ? false : true;

        this.unit().setAdVolume(volume ? 1 : 0);

        return this;
    }

    /**
     * @return {Float|Integer}
     */
    remainingTime() {
        return this.unit().getAdRemainingTime();
    }

    /**
     * @param {Integer} width
     * @param {Integer} height
     *
     * @return {Flash}
     */
    resize(width, height) {
        if (!width || !height) {
            return false;
        }

        this.unit().resizeAd(width, height);

        this.$unitVideoSlot.size({ width, height })

        return this;
    }

    /**
     * @param {String} name
     * @param {Event} ev
     *
     * @return {VPAIDJavaScript}
     */
    _event(name, ev) {
        name = name.replace('Ad', '').toLowerCase();

        let data = (ev) ? ev.data : undefined;

        // console.warn('vpaidjavascript event', name, data);

        this.$called[name] = true;

        if (name == 'videostart') {
            // hide video slot if there's no src and no body
            if (!this.$unitVideoSlot.attr('src') && !this.$unitVideoSlot.html().length) {
                this.$unitVideoSlot.style('display', 'none');
            }
        }

        if (name == 'error') {
            data = (data && data.errorCode) ? data.errorCode : false;
            if (!data || data < 100 || data > 901) {
                data = 900;
            }
        }

        this.slot().videoListener(name, data);

        return this;
    }
}

export default VPAIDJavaScript;
