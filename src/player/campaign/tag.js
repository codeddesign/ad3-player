import $instance from '../instance';
import { request_tag } from '../request';
import VastError from '../../vast/error';
import device from '../../utils/device';
import { extend_object } from '../../utils/extend_object';

class Tag {
    /**
     * Creates Tag with given information
     * received after a /campaign request.
     *
     * @param {Object} info
     * @param {Campaign} campaign
     *
     * @return {Tag}
     */
    constructor(info) {
        extend_object(this, info);

        this.$vast = false;
        this.$failed = false;

        this.$attempts = 0;

        this.$scheduled = false;
    }

    /**
     * @return {String|Integer}
     */
    id() {
        return this.$id;
    }

    /**
     * @return {String}
     */
    uri() {
        return this.$url;
    }

    /**
     * It returns Vast object if it succeded
     * or Boolean 'false'.
     *
     * @return {Vast|Boolean}
     */
    vast() {
        return this.$vast;
    }

    /**
     * @param {Boolean} byGuarantee
     *
     * @return {Integer}
     */
    priority(byGuarantee = false) {
        if (!byGuarantee) {
            return this.$priority_count;
        }

        return this.$guarantee_order;
    }

    /**
     * Delay time in milliseconds.
     *
     * @return {Integer}
     */
    delay() {
        return parseInt(this.$delay_time);
    }

    /**
     * Timeout time in milliseconds.
     *
     * @return {Integer}
     */
    timeOut() {
        return parseInt(this.$timeout_limit);
    }

    /**
     * @return {Integer}
     */
    wrapperLimit() {
        return this.$wrapper_limit;
    }

    /**
     * @return {Boolean}
     */
    isGuaranteed() {
        if (!this.$guarantee_enabled) {
            return false;
        }

        return (this.$guaranteed_count || 0) <= this.$guarantee_limit;
    }

    /**
     * @return {Boolean}
     */
    isActive() {
        return this.$active;
    }

    /**
     * @return {String}
     */
    platformType() {
        return this.$platform_type;
    }

    /**
     * @return {Boolean}
     */
    forAll() {
        return this.platformType() == 'all';
    }

    /**
     * @return {Boolean}
     */
    forMobile() {
        return this.platformType() == 'mobile';
    }

    /**
     * @return {Boolean}
     */
    canBeLoaded() {
        if (!this.isActive()) {
            return false;
        }

        if (this.forAll()) {
            return true;
        }

        if (device.mobile() && !this.forMobile()) {
            return false;
        }

        if (!device.mobile() && this.forMobile()) {
            return false;
        }

        return true;
    }

    /**
     * It returns a 'string' that has the error, when it fails;
     * otherwise it returns boolean 'false'.
     *
     * @return {Boolean|String}
     */
    failed() {
        return this.$failed;
    }

    /**
     * True when all ads where played.
     *
     * Note: '_used' must be set as true when ad/media
     * is being started - no matter of it's status (fails or not).
     *
     * @return {Boolean}
     */
    finished() {
        let finished = true;

        if (!this.vast()) {
            return finished;
        }

        this.vast().ads().forEach((ad) => {
            if (!ad._used) {
                finished = false;
            }
        });

        return finished;
    }

    /**
     * Number of load attempts.
     *
     * @return {Integer}
     */
    attempts() {
        return this.$attempts;
    }

    /**
     * @param {Integer} code
     * @param {String} info
     *
     * @return {Tag}
     */
    vastError(code, info) {
        this.$failed = new VastError(code, info);

        console.error(this.failed());

        // @todo: add tracking

        this._schedule();

        return this;
    }

    /**
     * Makes a request to given tag.
     *
     * @return {Promise}
     */
    request() {
        this._reset();

        this.$attempts++;

        return new Promise((resolve, reject) => {
            request_tag(this.uri(), this)
                .then((vast) => {
                    // best place to set scheduled to 'false'
                    this.$scheduled = false;

                    this._validateRequestVast(vast);

                    resolve(this);
                });
        });
    }

    /**
     * Resets tag.
     *
     * @return {Tag}
     */
    _reset() {
        this.$vast = false;
        this.$failed = false;

        return this;
    }

    /**
     * @param {Vast} vast
     *
     * @return {Tag}
     */
    _validateRequestVast(vast) {
        try {
            this.$vast = vast;

            if (!this.vast()) {
                this._schedule();

                return false;
            }

            // Some tags might fail while making the ajax request or they
            // don't have any ads after all redirects - meaning the
            // main wrapper won't be extended in request_tag().
            this.vast().ads().$items = this.vast().ads().filter((ad) => {
                return ad.hasType('inline');
            });

            if (!this.vast().hasAds()) {
                throw new VastError(303);
            }

            if (!this.vast().hasLinear()) {
                throw new VastError(201);
            }
        } catch (e) {
            if (typeof e.code == 'undefined') {
                throw e;
            }

            this.vastError(e.code)
        }

        return this;
    }

    /**
     * Schedule a tag to load again
     * with the given delay.
     *
     * Notifies player when a tag gets loaded and
     * also has ads using player.tagListener()
     *
     * @return {Tag}
     */
    _schedule() {
        if (this.$scheduled) {
            return this;
        }

        this.$scheduled = true;

        setTimeout(() => {
            this.request()
                .then(() => {
                    if (this.failed()) {
                        return false;
                    }

                    this._notifyPlayer();
                });
        }, this.delay());

        return this;
    }

    /**
     * Notifies player that tag got updated.
     *
     * @return {Tag}
     */
    _notifyPlayer() {
        $instance.player.tagListener(this);

        return this;
    }
}

export default (info, campaign) => {
    return (new Tag(info, campaign));
};
