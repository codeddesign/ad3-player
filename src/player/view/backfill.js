import { iframe_template } from '../view/templates';
import $ from '../../utils/element';
import { referrer } from '../../utils/uri';
import watchIframeSize from '../../utils/watch_iframe_size';

class Backfill {
    constructor(player) {
        this.__player = player;

        this.$created = false;

        this.$tracked = false;

        this.$revealed = false;

        $().sub('scroll', () => {
            this.reveal();
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
     * @return {Boolean}
     */
    mustReveal() {
        return this.__player.view.wrapper().visible() >= 70;
    }

    /**
     * @return {Boolean}
     */
    revealed() {
        return this.$revealed;
    }

    /**
     * @return {Backfill}
     */
    reveal() {
        if (!this.created()) {
            return this;
        }

        if (!this.mustReveal()) {
            return this;
        }

        const player = this.__player;

        if (player.$selected && player.$selected.isPlaying()) {
            return this;
        }

        this.$revealed = true;

        // first: show
        this.show();

        // second: transition
        this.container()
            .removeClass('slided');

        // track: attempt
        this.track();

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

        // mark as created
        this.$created = true;

        // remove hidden/none
        this.show();

        if (campaign.isOnscroll()) {
            this.container()
                .addClass('nowait slide slided')
                .removeClass('nowait', true);
        }

        const placeholder = this.container().find('a3m-placeholder'),
            _iframe = placeholder.replaceHtml(iframe_template()),
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

        let currentHeight = 0;
        watchIframeSize(_iDocument, _iframe.node, (size) => {
            let _height = size.height;

            // assuming it has some content and add extra height
            if (_height >= 200) {
                _height += this.__player.view.presentedby().size().height;
            }

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

    /**
     * Helper method.
     *
     * @return {Backfill}
     */
    track() {
        if (this.created() && this.revealed() && !this.tracked() && this.container().visible() >= 50) {
            this.$tracked = true;

            this.__player.tracker.backfill();
        }

        return this;
    }
}

export default Backfill;
