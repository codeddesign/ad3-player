import Animator from './animator';
import $ from '../../utils/element';
import device from '../../utils/device';
import { decode_uri } from '../../utils/uri';

class HTML5 {
    constructor(player, slot) {
        this.__player = player;
        this.__slot = slot;

        this.$unit = false;
        this.$called = {};

        this.$stopped = false;
        this.$paused = false;

        this.$animator = false;

        this.$checkPoints = {};
        this.$checkPointsChecked = new Set();
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
        return `<video width="100%" height="100%" preload="auto" webkit-playsinline playsinline muted></video>`;
    }

    /**
     * @return {HTML5}
     */
    create() {
        this.$unit = this.slot().element().html(this.template()).node;

        this._extendUnit();
        if (!device.iphoneInline()) {
            this.$animator = new Animator(this);
        }

        const attrs = {
            type: this.slot().media().type(),
            src: this.slot().media().source()
        };

        Object.keys(attrs).forEach((key) => {
            this.unit().setAttribute(key, attrs[key]);
        });

        this.loadUnit();

        return this;
    }

    /**
     * @return {HTML5}
     */
    loadUnit() {
        if (!this.called('loaded')) {
            this.unit().load();
        }

        return this;
    }

    /**
     * @param {Boolean} resumed
     *
     * @return {HTML5}
     */
    start(resumed = false) {
        if (!this.called('started') || resumed) {
            this.unit().play();
        }

        return this;
    }

    /**
     * @param {Boolean} skipped
     *
     * @return {Media}
     */
    stop(skipped = false) {
        this.$stopped = true;

        const duration = this.duration();

        this.unit().currentTime = (isNaN(duration) || !duration) ? 0 : duration;

        if (!skipped) {
            this._event('videocomplete')
                ._event('stopped');
        }

        return this;
    }

    /**
     * @return {HTML5}
     */
    pause() {
        this.$paused = true;

        this.unit().pause();

        return this;
    }

    /**
     * @return {HTML5}
     */
    resume() {
        this.start(true);

        return this;
    }

    /**
     * @return {HTML5}
     */
    skip() {
        this._event('skipped')
            ._event('stopped');

        this.stop(true);

        return this;
    }

    /**
     * @param {Boolean|undefined} volume
     *
     * @return {HTML5|Boolean}
     */
    volume(volume) {
        if (typeof volume == 'undefined') {
            return this.unit().muted;
        }

        // reverse for 'muted'
        volume = (volume) ? false : true;

        this.unit().muted = volume;

        if (this.$animator) {
            (!volume) ? this.$animator.unmute(): this.$animator.mute();
        }

        return this;
    }

    /**
     * @return {Float|Integer}
     */
    duration() {
        return this.unit().duration;
    }

    /**
     * @return {Float|Integer}
     */
    remainingTime() {
        return this.duration() - this.unit().currentTime;
    }

    /**
     * @param {Integer} width
     * @param {Integer} height
     *
     * @return {Flash}
     */
    resize(width, height) {
        this.unit().setAttribute('width', `${width}px`);
        this.unit().setAttribute('height', `${height}px`);

        return this;
    }

    /**
     * @return {HTML5}
     */
    _extendUnit() {
        this.unit().onloadeddata = (ev) => {
            if (this.$stopped || this.$paused) {
                return false;
            }

            if (this.called('loaded')) {
                return false;
            }

            this.$called['loaded'] = true;

            this._event('loaded');
        };

        this.unit().onplay = (ev) => {
            if (this.$paused) {
                this.$paused = false;

                this._event('playing');

                return false;
            }

            this._event('started')
                ._event('videostart');
        }

        this.unit().onpause = (ev) => {
            // Gets triggered on stop()
            if (this.$stopped) {
                return false;
            }

            if (this.unit().currentTime >= this.duration()) {
                this.stop();

                return false;
            }

            this._event('paused');
        }

        this.unit().ontimeupdate = (ev) => {
            if (this.$stopped) {
                return false;
            }

            const _ct = this.unit().currentTime;
            if (_ct <= this.duration()) {
                this._event('timeupdate', _ct);

                Object.keys(this.$checkPoints).forEach((point) => {
                    const _checkPointTime = this.$checkPoints[point];
                    if (!this.$checkPointsChecked.has(point) && _ct >= _checkPointTime) {
                        this.$checkPointsChecked.add(point);

                        this._event(point);
                    }
                });
            }
        }

        this.unit().onvolumechange = (ev) => {
            this._event('volumechange');
        }

        let attempts = 0;
        this.unit().onerror = (ev) => {
            attempts++;

            if (attempts > 3) {
                this._event('error', 405);

                return false;
            }

            this.unit().setAttribute('src', this.slot().media().source());
            this.loadUnit();
        }

        this.unit().onclick = (ev) => {
            this._event('clickthrough');

            const uri = this.slot().creative().clickThrough();;
            if (uri && uri.length) {
                window.open(this.__player.macro.uri(decode_uri(uri)));
            }
        }

        return this;
    }

    /**
     * @param {String} name
     * @param {Mixed} data
     *
     * @return {HTML5}
     */
    _event(name, data) {
        // console.warn('html5 event', name, data);

        this.$called[name] = true;

        if (name == 'loaded') {
            this.$checkPoints = {
                impression: 0,
                videofirstquartile: Math.round(.25 * this.duration()),
                videomidpoint: Math.round(.5 * this.duration()),
                videothirdquartile: Math.round(.75 * this.duration()),
            };
        }

        this.slot().videoListener(name, data);

        return this;
    }
}

export default HTML5;
