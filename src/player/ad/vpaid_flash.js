import { iframe_template } from '../view/templates';
import $script from '../../utils/source';
import random from '../../utils/random';
import config from '../../../config';

class VPAIDFlash {
    constructor(player, slot) {
        this.__player = player;
        this.__slot = slot;

        this.$id = `v${random()}`;

        this.$unit = false;
        this.$called = {};

        this.$called = {};
        this.$calledOnce = new Set(['handshake', 'start', 'stop']);
        this.$calledMinMls = 3; // milliseconds between events

        this.$volume = false;

        this.$RemainingTime = false;

        this.$config = {
            view: 'transparent',
            bitrate: this.slot().media().bitrate() || 59.97,
            width: this.__player.size.width,
            height: this.__player.size.height
        };
    }

    /**
     * Unique id for flash listener.
     *
     * @return {String}
     */
    id() {
        return this.$id;
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
     * @return {String}
     */
    template() {
        return `<object type="application/x-shockwave-flash"
            width="${this.$config.width}"
            height="${this.$config.height}"
            data="${$script.path}/assets/swf/vpaid.swf">
            <param name="wmode" value="transparent"></param>
            <param name="salign" value="tl"></param>
            <param name="align" value="left"></param>
            <param name="allowScriptAccess" value="always"></param>
            <param name="scale" value="noScale"></param>
            <param name="allowFullScreen" value="true"></param>
            <param name="quality" value="high"></param>
            <param name="FlashVars" value="flashid=${this.id()}&handler=handler_${this.id()}&debug=false&salign=tl"></param>
        </object>`;
    }

    /**
     * @return {VPAIDFlash}
     */
    create() {
        if (config.vpaidflash_fif) {
            const $target = this.slot().element();

            $target.addClass('hasiframe');

            this.window = $target.html(iframe_template()).node.contentWindow;

            this.window.inDapIF = true;

            this._addWindowListener();

            this.window.document.write(this.template());

            this.$unit = this.window.document.querySelector('object');

            return this;
        }

        this.window = window;

        this._addWindowListener();

        this.$unit = this.slot().element().html(this.template()).node;

        return this;
    }

    /**
     * @param {String} method
     * @param {Array} info
     *
     * @return {VPAIDFlash}
     */
    _safeCall(method, info = []) {
        const params = {};

        info.forEach((param, index) => {
            params[index] = param;
        });

        if (this.unit()) {
            try {
                this.unit()[method](params);
            } catch (e) {
                console.warn(e.message);
            }
        }

        return this;
    }

    /**
     * @return {VPAIDFlash}
     */
    handShake() {
        if (this._calledOnce('handShake')) {
            return this;
        }

        this._safeCall('loadAdUnit', [this.id(), this.slot().media().source()]);

        return this;
    }

    /**
     * @return {VPAIDFlash}
     */
    loadUnit() {
        if (this._calledOnce('loadUnit')) {
            return this;
        }

        this._safeCall('initAd', [
            this.id(),
            this.$config.width,
            this.$config.height,
            this.$config.view,
            this.$config.bitrate,
            this.slot().creative().adParameters() || '',
            '',
        ]);

        return this;
    }

    /**
     * @return {VPAIDFlash}
     */
    start() {
        if (!this.called('Loaded')) {
            return this;
        }

        if (this._calledOnce('start')) {
            return this;
        }

        this._safeCall('startAd', [this.id()]);

        return this;
    }

    /**
     * @return {VPAIDFlash}
     */
    stop() {
        if (this._calledOnce('stop')) {
            return this;
        }

        this._safeCall('stopAd', [this.id()]);

        return this;
    }

    /**
     * @return {VPAIDFlash}
     */
    pause() {
        this._safeCall('pauseAd', [this.id()]);

        return this;
    }

    /**
     * @return {VPAIDFlash}
     */
    resume() {
        this._safeCall('resumeAd', [this.id()]);

        return this;
    }

    /**
     * @return {VPAIDFlash}
     */
    skip() {
        this._safeCall('skipAd', [this.id()]);

        return this;
    }

    /**
     * @param {Boolean|undefined} volume
     *
     * @return {VPAIDFlash|Boolean}
     */
    volume(volume) {
        if (typeof volume == 'undefined') {
            // Note: needs to be reversed
            return !this.$volume;
        }

        this.$volume = volume;

        this._safeCall('setAdVolume', [this.id(), volume]);

        return this;
    }

    /**
     * @return {Float|Integer}
     */
    remainingTime() {
        return this.$RemainingTime;
    }

    /**
     * @param {Integer} width
     * @param {Integer} height
     *
     * @return {VPAIDFlash}
     */
    resize(width, height) {
        if (!width || !height || !this.slot().element()) {
            return false;
        }

        if (this.unit()) {
            try {
                this.unit().setAttribute('width', width);
                this.unit().setAttribute('height', height);
            } catch (e) {}
        }

        this._safeCall('resizeAd', [
            this.id(),
            width,
            height,
            this.$config.view
        ]);

        return this;
    }

    /**
     * Note: ignored.
     *
     * @return {VPAIDFlash}
     */
    timeUpdate() {
        return this;

        if (!this.unit() || typeof this.unit().getAdRemainingTime == 'undefined') {
            return this;
        }

        this._safeCall('getAdRemainingTime', [this.id()]);

        return this;
    }

    /**
     * @return {VPAIDFlash}
     */
    _addWindowListener() {
        const handler = `handler_${this.id()}`;

        this.window[handler] = (id, typeName, typeId, callbackId, error, data) => {
            const info = { id, typeName, typeId, callbackId, error, data };

            // console.log(info);

            if (typeName == 'property') {
                this._property(typeId, data);

                return false;
            }

            if (typeName == 'method') {
                this._method(typeId);

                return false;
            }

            if (typeName == 'event') {
                this._event(typeId, data);

                return false;
            }
        };

        return this;
    }

    /**
     * @param {String} name
     *
     * @return {Boolean}
     */
    _calledOnce(name) {
        return this.$calledOnce.has(name) && this.called(name);
    }

    /***
     * @param {String} name
     *
     * @return {Boolean}
     */
    _canCall(name) {
        if (!this.called(name)) {
            this.$called[name] = Date.now();

            return true;
        }

        const _diff = Date.now() - this.$called[name];
        if (_diff > this.$calledMinMls) {
            this.$called[name] = Date.now();

            return true;
        }

        return false;
    }

    /**
     * @param {String} name
     *
     * @return {VPAIDFlash}
     */
    _method(name) {
        name = name.replace('Ad', '');

        if (!this._canCall(name)) {
            return false;
        }

        if (this[name]) {
            this[name]();
        }

        return this;
    }

    /**
     * @param {String} name
     * @param {Mixed} data
     *
     * @return {VPAIDFlash}
     */
    _property(name, data) {
        name = name.replace('get', '')
            .replace('set', '')
            .replace('Ad', '');

        // volume update:
        if (name == 'Volume') {
            name = 'volume';
            data = (data) ? true : false;
        }

        this[`$${name}`] = data;

        return this;
    }

    /**
     * @param {String} name
     * @param {Mixed} data
     *
     * @return {VPAIDFlash}
     */
    _event(name, data) {
        name = name.replace('Ad', '');

        if (!this._canCall(name)) {
            return false;
        }

        // console.warn('vpaidflash event', name, data);

        if (name == 'Error') {
            data = data.errorcode || data.message;

            if (!data || typeof data == 'string') {
                data = 900;
            }
        }

        if (name == 'VideoStart') {
            if (config.vpaidflash_fif) {
                const scroll = {
                    timeout: 250,
                    pixels: 1
                };

                setTimeout(() => {
                    // scroll down
                    window.scrollBy(0, scroll.pixels);

                    setTimeout(() => {
                        // scroll up
                        window.scrollBy(0, -scroll.pixels);
                    }, scroll.timeout);
                }, scroll.timeout);
            }

            this.timeUpdate();

            const events = ['Stopped', 'Skipped', 'Complete'];

            const interval = setInterval(() => {
                const found = events.some((event) => {
                    if (!this.slot().ad() || this.called(event)) {
                        clearInterval(interval);

                        return true;
                    }

                    return false;
                });

                if (!found) {
                    this.timeUpdate();
                }
            }, 1000);
        }

        this.slot().videoListener(name.toLowerCase(), data);

        return this;
    }
}

export default VPAIDFlash;
