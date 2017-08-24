import Auction from './auction';
import bidCache from './bidcache';
import { iframe_template } from '../view/templates';
import { extend_object } from '../../utils/extend_object';
import $ from '../../utils/element';
import { referrer } from '../../utils/uri';
import watchIframeSize from '../../utils/watch_iframe_size';
import config from './config';

class Backfill {
    /**
     * @param {Player} player
     *
     * @return {Backfill}
     */
    constructor(player) {
        this.__player = player;

        extend_object(this, this.__player.campaign.$backfill || {});

        $().addAssets(config.assets);

        // prepare backups
        this.$backups = [{
            bidder: 'a3m',
            active: this.$active || false,
            ad: this.$embed || false,
            cpm: (this.$ecpm / 100) || false,
            size: '336x280' // highest
        }];

        // pre-define targets
        this.$targets = {
            a3m: ['300x250', '336x280']
        };

        // pre-define offers and slots
        this.$offers = {};
        this.$slots = []
        for (const target_id in this.$targets) {
            this.$offers[target_id] = [];

            this.$slots[target_id] = {};
        }

        // expected call sources
        this.$create_sources = {
            offers: false,
            view: false
        };

        // status
        this.$status = {
            filled: false,
            tracked: false,
            revealed: false
        }

        // initiate auction
        this.$auction = new Auction(this);

        // add scroll listener
        $().sub('scroll', () => {
            this.reveal();
        });
    }

    /**
     * @return {Boolean}
     */
    filled() {
        return this.$status.filled;
    }

    /**
     * @return {Boolean}
     */
    tracked() {
        return this.$status.tracked;
    }

    /**
     * @return {Boolean}
     */
    revealed() {
        return this.$status.revealed;
    }

    /**
     * Helper method.
     *
     * @return {Element}
     */
    container() {
        return this.__player.view.backfill();
    }

    /**
     * Helper method.
     *
     * @return {Backfill}
     */
    show() {
        if (this.filled()) {
            this.container().show(true);
        }

        return this;
    }

    /**
     * Helper method.
     *
     * @return {Backfill}
     */
    hide() {
        if (this.filled()) {
            this.container().hide(true);
        }

        return this;
    }

    /**
     * @return {Boolean}
     */
    mustReveal() {
        return this.__player.view.wrapper().visible() >= 70;
    }

    /**
     * @return {Backfill}
     */
    reveal() {
        if (!this.filled() || !this.mustReveal()) {
            return this;
        }

        const selected = this.__player.$selected;

        if (selected && selected.isPlaying()) {
            return this;
        }

        this.$status.revealed = true;

        // first: remove "hidden none" css classes
        this.show();

        // second: transition (delayed)
        this.container().removeClass('slided', true);

        // track: attempt
        this.track();

        return this;
    }

    /**
     * Helper method.
     *
     * @return {Backfill}
     */
    track() {
        if (this.filled() && this.revealed() && !this.tracked() && this.container().visible() >= 50) {
            this.$status.tracked = true;

            this.__player.tracker.backfill();
        }

        return this;
    }

    /**
     * Given backfill providers.
     *
     * @return {Array}
     */
    providers() {
        return this.$providers || [];
    }

    /**
     * Given backup backfills.
     *
     * @return {Array}
     */
    backups() {
        return this.$backups;
    }

    /**
     * Pre-set targets.
     *
     * @return {Object}
     */
    targets() {
        return this.$targets;
    }

    /**
     * @return {Array}
     */
    offers() {
        return this.$offers;
    }

    /**
     * @return {Object}
     */
    slots() {
        return this.$slots;
    }

    /**
     * Called when Auction has offers.
     *
     * @param {Object} offers
     *
     * @return {Backfill}
     */
    auctionListener(offers) {
        // console.warn('received', offers);

        try {
            // add main bids
            for (const target_id in offers) {
                const targetOffers = offers[target_id];

                targetOffers.bids.forEach((bid) => {
                    if (bid.getStatusCode() !== 1) {
                        return false;
                    }

                    this.$offers[target_id].push(bid);
                });
            }

            // add extra bids
            for (const target_id in this.targets()) {
                // add cached bids
                this.targets()[target_id].forEach((size) => {
                    const bid = bidCache.allocate(size);
                    if (bid) {
                        this.$offers[target_id].push(bid);
                    }
                });

                // add backup bids
                this.backups().forEach((backup) => {
                    if (!backup.active) {
                        return false
                    }

                    if (this.targets()[target_id].indexOf(backup.size) !== -1) {
                        const bid = Object.assign({}, backup);
                        bid.is_backup = true;

                        const [width, height] = bid.size.split('x');
                        bid.width = parseInt(width);
                        bid.height = parseInt(height);

                        this.$offers[target_id].push(bid);
                    }
                });
            }

            // sort bids
            for (const target_id in this.$offers) {
                this.$offers[target_id].sort((a, b) => {
                    return b.cpm - a.cpm;
                });
            }

            this.create('offers');
        } catch (e) {
            console.error(e);
        }

        return this;
    }

    /**
     * Called when we have offers & view is created.
     *
     * Note: new sources need to be added in construct()
     *
     * @param {String} source
     *
     * @return {Backfill}
     */
    create(source) {
        this.$create_sources[source] = true;

        if (!this._isFillable()) {
            return this;
        }

        // fill
        for (const target_id in this.$offers) {
            const ad = this.$offers[target_id].shift();
            if (ad) {
                this._fill(ad, target_id);

                if (ad.cached_key) {
                    bidCache.delete(ad.cached_key);
                }

                // cache unused
                this.$offers[target_id].forEach((offer) => {
                    if (!offer.is_backup && !offer.cached_key) {
                        bidCache.save(offer);
                    }
                });

                continue;
            }

            // Debugging: only if element exists in view
            if (this.$slots[target_id]) {
                console.warn(target_id, 'has no backup');
            }
        }

        return this;
    }

    /**
     * @return {Boolean}
     */
    _isFillable() {
        let fillable = true;
        for (const key in this.$create_sources) {
            if (this.$create_sources[key] === false) {
                fillable = false;
            }
        }

        return fillable;
    }

    /**
     * @param {Object} bid
     * @param {String} target_id
     *
     * @return {View}
     */
    _fill(bid, target_id) {
        if (!this.container() || !bid || !bid.ad) {
            return this;
        }

        // track: attempt
        this.track();

        if (this.$status.filled) {
            return this;
        }

        // mark as filled
        this.$status.filled = true;

        // custom based on campaign
        if (this.__player.campaign.isOnscroll()) {
            this.container()
                .addClass('nowait slide slided')
                .removeClass('nowait', true);
        }

        if (bid.adUrl) {
            this.container().html(iframe_template(bid.width, bid.height, bid.adUrl));

            return this;
        }

        const _iframe = this.container().html(iframe_template(bid.width, bid.height)),
            _iWindow = _iframe.node.contentWindow,
            _iDocument = _iWindow.document;

        _iWindow.inDapIF = true;

        // main strategy: document.write()
        _iDocument.__insert = (_body) => {
            _iDocument.write(_body);
        }

        if (bid.is_backup) {
            bid.ad = this.__player.macro.uri(
                bid.ad, { page_url: referrer.base }
            );

            // alternative strategy: fragment
            if (bid.ad.includes('async')) {
                _iDocument.__insert = (_body) => {
                    const range = _iDocument.createRange()
                    range.setStart(_iDocument.body, 0)
                    _iDocument.body.appendChild(
                        range.createContextualFragment(_body)
                    );
                }
            }

            let currentHeight = 0;
            watchIframeSize(_iDocument, _iframe.node, (size) => {
                let _height = size.height;

                this.container()
                    .style('maxHeight', _height, true);

                // reverse setup's show()
                if (currentHeight == 0 && _height > 0) {
                    currentHeight = _height;

                    if (!this.revealed()) {
                        this.hide();
                    }
                }
            });
        }

        _iDocument.__insert(bid.ad);

        // fallback
        this.reveal();

        return this;
    }
}

export default Backfill;
