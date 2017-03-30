import Media from './media';
import HTML5 from '../ad/html5';
import VPAIDJavaScript from '../ad/vpaid_javascript';
import Flash from '../ad/flash';
import VPAIDFlash from '../ad/vpaid_flash';
import Cache from '../cache';
import config from '../../../config';

class Slot {
    constructor(player, tag) {
        this.__player = player;
        this.__tag = tag;

        this.$ad = false;

        this.$creative = false;

        this.$media = false;

        this.$video = false;

        this.$element = false;

        this._timeouts = {};
    }

    /**
     * @return {Tag}
     */
    tag() {
        return this.__tag;
    }

    /**
     * @return {Ad}
     */
    ad() {
        return this.$ad;
    }

    /**
     * @return {Creative}
     */
    creative() {
        return this.$creative;
    }

    /**
     * @return {Media}
     */
    media() {
        return this.$media;
    }

    /**
     * @return {HTML5|Flash|VPAIDFlash|VPAIDJavaScript}
     */
    video() {
        return this.$video;
    }

    /**
     * @return {Element}
     */
    element() {
        return this.$element;
    }

    /**
     * Called by Tag and it creates:
     * - ad
     * - creative
     * - media
     * - video
     * - slot in DOM
     *
     * @param {Ad} ad
     *
     * @return {Slot}
     */
    create(ad) {
        // set ad
        if (!ad._used) {
            this.$ad = ad;
        }

        // set creative
        if (this.ad()) {
            this.$creative = this.ad().someCreative((creative) => {
                if (creative.isLinear()) {
                    return true;
                }
            });
        }

        // set media
        if (this.creative()) {
            const bestMedia = new Media(this.__player);
            bestMedia.setMediaFiles(
                this.creative().mediaFiles().all()
            );

            this.$media = bestMedia.preferred();
        }

        // set video
        if (this.media()) {
            switch (this.media().type()) {
                case 'video/mp4':
                case 'video/ogg':
                case 'video/webm':
                    this.$video = new HTML5(this.__player, this);

                    break;
                case 'video/x-flv':
                    this.$video = new Flash(this.__player, this);

                    break;
                case 'application/x-shockwave-flash':
                    this.$video = new VPAIDFlash(this.__player, this);

                    break;
                case 'text/javascript':
                case 'application/javascript':
                case 'application/x-javascript':
                    this.$video = new VPAIDJavaScript(this.__player, this);

                    break;
            }
        }

        // create slot
        if (this.video()) {
            const attributes = {
                data: {
                    tag: this.tag().id()
                }
            };

            this.$element = this.__player.view.container().append('a3m-slot', attributes);

            this.hide();

            this.video().create();

            this.mark('got-created');
        }

        return this;
    }

    /**
     * Helper method.
     *
     * @return {Slot}
     */
    hide() {
        if (this.exists()) {
            this.element().hide();
        }

        return this;
    }

    /**
     * Helper method.
     *
     * @return {Slot}
     */
    show() {
        if (this.exists()) {
            this.element().show();
        }

        return this;
    }

    /**
     * @return {Slot}
     */
    destroy() {
        if (this.exists()) {
            this.element().remove();
        }

        this.$element = false;

        return this;
    }

    /**
     * @return {Boolean}
     */
    exists() {
        return (this.element()) ? true : false;
    }

    /**
     * Listener method.
     *
     * @return {Slot}
     */
    videoListener(name, data) {
        this.mark(name);

        this.__player.slotListener(this, name, data);

        return this;
    }

    /**
     * @return {Boolean}
     */
    isLoaded() {
        return this._loaded;
    }

    /**
     * @return {Boolean}
     */
    isStarted() {
        return this._started;
    }

    /**
     * @return {Boolean}
     */
    isPlaying() {
        return this._playing;
    }

    /**
     * @return {Boolean}
     */
    isPaused() {
        return this._paused;
    }

    /**
     * @return {Boolean}
     */
    isDone() {
        return this._done;
    }

    /**
     * Set properties to slot that help to determine it's status.
     *
     * Events:
     * - loaded - gets called upon video load
     * - started - gets called on start() and there's an actual video available
     * - videostart - video starts playing
     *
     * Properties:
     * - used - marks slot as being/was used
     * - started - attempted to play video
     * - playing - video is playing
     * - paused - video is paused
     * - done - video completed/skipped/stopped/error
     * - timeout - holds timeout reference and gets cleared on videostart
     *
     * @param {String} event
     *
     * @return {Slot}
     */
    mark(event) {
        this.clearEventTimeout(event);

        switch (event) {
            case 'loaded':
                // tracking: filled event for NON-VPAID
                if (!this.media().isVPAID()) {
                    this.__player.tracker.video(this, 'filled');
                }

                Cache.write(this.__player.campaign, this.__tag);

                this._loaded = true;

                break;
            case 'started':
                Cache.remove(this.__tag.vast()._cacheKey);

                this.ad()._used = true;

                this._started = true;

                this.addEventTimeout('videostart', () => {
                    if (!this.media().isVPAID()) {
                        return false;
                    }

                    if (!this.isPlaying()) {
                        this.videoListener('error', 901);
                    }
                }, config.timeout.started * 1000);
                break;
            case 'videostart':
                // tracking: filled event for VPAID
                if (this.media().isVPAID()) {
                    this.__player.tracker.video(this, 'filled');
                }

                Cache.remove(this.__tag.vast()._cacheKey);

                this.ad()._used = true;

                this._playing = true;

                this.show();
                break;
            case 'paused':
                this._paused = true;
                break;
            case 'playing':
                this._paused = false;
                break;
            case 'skipped':
            case 'stopped':
            case 'complete':
            case 'error':
                Cache.remove(this.__tag.vast()._cacheKey);

                this.ad()._used = true;

                this._done = true;

                this._playing = false;

                this.destroy();

                // tag schedule (Note: single exception when _schedule() it's called from outside Tag)
                this.tag()._schedule();
                break;
            case 'got-selected':
                // console.log('selected:', this);
                break;
            case 'got-created':
                this.addEventTimeout('loaded', () => {
                    if (!this.media().isVPAID()) {
                        return false;
                    }

                    if (this.isDone()) {
                        return false;
                    }

                    if (!this.isLoaded()) {
                        this.videoListener('error', 901);
                    }
                }, this.tag().timeOut());
                break;
            case 'got-started':
                this.addEventTimeout('started', () => {
                    if (!this.media().isVPAID()) {
                        return false;
                    }

                    if (!this.isStarted()) {
                        this.videoListener('error', 901);
                    }
                }, config.timeout.started * 1000);
                break;
        }
        return this;
    }

    /**
     * @param {String} event
     * @param {Function} _callback
     * @param {Integer} _timeout
     *
     * @return {Slot}
     */
    addEventTimeout(event, _callback, _timeout) {
        if (!this._timeouts[event]) {
            this._timeouts[event] = setTimeout(_callback, _timeout);
        }

        return this;
    }

    /**
     * @param {String} event
     *
     * @return {Slot}
     */
    clearEventTimeout(event) {
        if (this._timeouts[event]) {
            clearTimeout(this._timeouts[event]);
        }

        return this;
    }
}

export default Slot;
