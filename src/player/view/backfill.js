import { iframe_template } from '../view/templates';
import $ from '../../utils/element';
import { referrer } from '../../utils/uri';
import watchIframeSize from '../../utils/watch_iframe_size';

class Backfill {
    constructor(player) {
        this.__player = player;

        this.$created = false;

        this.$tracked = false;

        $().sub('scroll', () => {
            this.setup();
        });

        // direct setup: attempt
        this.setup();
    }

    /**
     * @return {Boolean}
     */
    created() {
        return this.$created;
    }

    /**
     * @return {Boolean}
     */
    tracked() {
        return this.$tracked;
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
        if (this.created()) {
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
        if (this.created()) {
            this.container().hide(true);
        }

        return this;
    }

    /**
     * @return {Backfill}
     */
    setup() {
        const player = this.__player,
            campaign = player.campaign,
            _backfill = campaign.$backfill;

        // track: attempt
        this.track();

        if (!_backfill || this.created()) {
            return this;
        }

        if (player.view.wrapper().visible() < 70) {
            return this;
        }

        if (player.$selected && player.$selected.isPlaying()) {
            return false;
        }

        // mark as created
        this.$created = true;

        // remove hidden/none
        this.show();

        if (campaign.isOnscroll()) {
            this.container()
                .addClass('nowait slide slided')
                .removeClass('nowait', true);
        }

        const _iframe = this.container().html(iframe_template()),
            _iWindow = _iframe.node.contentWindow,
            _iDocument = _iWindow.document;

        // main strategy: document.write()
        _iDocument.__add = (_body) => {
            _iDocument.write(_body);
        }

        // alternative strategy: fragment
        if (_backfill.embed.includes('async')) {
            _iDocument.__add = (_body) => {
                const range = _iDocument.createRange()
                range.setStart(_iDocument.body, 0)
                _iDocument.body.appendChild(
                    range.createContextualFragment(_body)
                );
            }
        }

        // replace macros
        const extra_macro = { page_url: referrer.base },
            _embed = this.__player.macro.uri(_backfill.embed, extra_macro);

        // add element to dom
        _iDocument.__add(_embed);

        watchIframeSize(_iDocument, _iframe.node, (size) => {
            this.container()
                .style('maxHeight', size.height, true)
                .removeClass('slided');

            // track: attempt
            this.track();
        });
    }

    /**
     * Helper method.
     *
     * @return {Backfill}
     */
    track() {
        if (this.created() && !this.tracked() && this.container().visible() >= 50) {
            this.$tracked = true;

            this.__player.tracker.backfill();
        }

        return this;
    }
}

export default Backfill;
