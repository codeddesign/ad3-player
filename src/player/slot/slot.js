import Media from './media';
import HTML5 from '../ad/html5';
import VPAIDJavaScript from '../ad/vpaid_javascript';
import Flash from '../ad/flash';
import VPAIDFlash from '../ad/vpaid_flash';
import Cache from '../cache';
import config from '../../../config';
import device from '../../utils/device';
import ajax from '../../utils/ajax';
import proportion from '../../utils/proportion';
import { proportion_minimal } from '../../utils/proportion';

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
     * @return {Boolean|Float}
     */
    proportion() {
        const width = this.media().width(),
            height = this.media().height();

        if (!width || !height) {
            return false;
        }

        return height / width;
    }

    /**
     * @param {Boolean} before_create
     *
     * @return {Object}
     */
    size(before_create = false) {
        if (before_create) {
            return proportion_minimal(this.__player.size, this.proportion());
        }

        return proportion(this.__player.size.width)
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

            this.$element.size(this.size(true));

            this.hide();

            this.video().create();

            this.mark('got-created');
        }

        // debugging
        try {
            const dump_data = {
                device: (device.mobile()) ? 'mobile' : 'desktop',
                vast: this.tag().vast().clean(),
                source: this.media().source(),
                tag: this.tag().id(),
            };

            ajax().payload(dump_data);
        } catch (e) {}

        return this;
    }

    /**
     * Helper method.
     *
     * @return {Slot}
     */
    hide() {
        if (this.exists()) {
            this.element().addClass('none');
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
            this.element().removeClass('none');
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
    gotStarted() {
        return this._got_started;
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
                if (!this.ad()._filled && !this.media().isVPAID()) {
                    this.ad()._filled = true;
                    this.__player.tracker.video(this, 'filled');
                }

                Cache.write(this.__player.campaign, this.__tag, this.media().isVPAID());

                this._loaded = true;

                if (this.media().isVPAID() && (!device.igadget() || device.iphoneInline())) {
                    // console.warn('started temporary', this.tag().id());

                    this.ad()._temporary_vpaid = true;

                    this.video().start();
                }
                break;
            case 'started':
                this.ad()._used = true;

                this._started = true;
                break;
            case 'videostart':
                // prepare size
                this.$element.size(this.size());

                // tracking: filled event for VPAID
                if (!this.ad()._filled && this.media().isVPAID()) {
                    this.ad()._filled = true;
                    this.__player.tracker.video(this, 'filled');
                }

                this.ad()._used = true;

                this._playing = true;

                if (!this.ad()._temporary_vpaid) {
                    // halted show
                    this.show();
                } else {
                    // console.warn('paused temporary', this.tag().id());

                    this.video().pause();
                }
                break;
            case 'impression':
                // prepare size (sanity call)
                this.$element.size(this.size());

                this.__player.tracker.visit();

                // sanity set
                this._playing = true;

                // tracking: filled event (sanity call)
                if (!this.ad()._filled) {
                    this.ad()._filled = true;

                    this.__player.tracker.video(this, 'filled');
                }

                Cache.remove(this.__tag.vast()._cacheKey);
                break;
            case 'videofirstquartile':
                // tag schedule: parallel using event name as key
                this.tag()._schedule(event);
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

                // tag schedule: normal
                this.tag()._schedule();
                break;
            case 'got-selected':
                // console.warn('selected:', this);

                if (this.ad()._temporary_vpaid) {
                    // console.warn('selected temporary', this.tag().id());

                    this.ad()._temporary_vpaid = false;

                    // sanity calls:
                    if (this._paused) {
                        this.show(); // halted in 'videostart'

                        this.__player.slotListener(this, '_temporary_vpaid'); // custom event name for player's view-control
                    }
                }
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
                // desktop only and when is marked as loaded
                if (!device.mobile() && this._loaded) {
                    this._got_started = true;
                }

                this.addEventTimeout('impression', () => {
                    if (!this.media().isVPAID()) {
                        return false;
                    }

                    if (!this.isPlaying()) {
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
            // console.warn('Cleared event timeout', event);

            clearTimeout(this._timeouts[event]);
        }

        return this;
    }
}

export default Slot;
