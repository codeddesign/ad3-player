import { wrapper } from './templates';
import device from '../../utils/device';
import proportion from '../../utils/proportion';
import scrolling from '../../utils/scrolling';

class View {
    constructor(player, source) {
        this.__player = player;

        this.$source = source;

        this.$els = {};

        this.$els.wrapper = source.script.replaceHtml(
            wrapper(source.id)
        );

        ['backfill', 'container', 'slot.video', 'sound'].forEach((name) => {
            const selector = `a3m-${name}`;

            this.$els[name] = this.wrapper().find(selector);
        });

        this.saveSize();

        this.setup();
    }

    /**
     * Save size:
     * - to instance
     * - to wrapper as data
     *
     * @return {View}
     */
    saveSize() {
        this.__player.size = proportion(this.wrapper().size().width);

        this.wrapper().sizeAsData(this.__player.size);

        return this;
    }

    /**
     * @return {Element}
     */
    wrapper() {
        return this.get('wrapper');
    }

    /**
     * @return {Element}
     */
    backfill() {
        return this.get('backfill');
    }

    /**
     * @return {Element}
     */
    container() {
        return this.get('container');
    }

    /**
     * @return {Element}
     */
    video() {
        return this.get('slot.video');
    }

    /**
     * @return {Element}
     */
    sound() {
        return this.get('sound');
    }

    /**
     * @param {String} name
     *
     * @return {Element}
     */
    get(name) {
        if (!this.$els[name]) {
            throw new Error(`View: unknown element '${name}'.`);
        }

        return this.$els[name];
    }

    /**
     * Prepare view elements.
     *
     * @return {View}
     */
    setup() {
        const campaign = this.__player.campaign;

        if (campaign.isOnscroll()) {
            this.container()
                .addClass('nowait slide slided')
                .removeClass('nowait', true);
        }

        return this;
    }

    /**
     * Sound control:
     * - on videostart - show sound element on mobile
     * - on video skipped/stopped/complete/error - hide sound element and reset
     *
     * @param {Boolean} reset
     *
     * @return {View}
     */
    soundControl(reset = false) {
        if (device.mobile() && !reset) {
            this.sound().show();
        }

        if (reset) {
            this.sound()
                .hide()
                .removeClass('on')
                .addClass('off');
        }

        return this;
    }

    /**
     * @param {Boolean} show
     *
     * @return {View}
     */
    transition(show = true) {
        const campaign = this.__player.campaign;

        const _target = this.container();

        if (campaign.isOnscroll()) {
            const _class = 'slided';

            if (show) {
                this.resize();

                _target.removeClass(_class);

                return this;
            }

            _target.addClass(_class);
        }

        return this;
    }

    /**
     * Resize video.
     *
     * Note: using $selected directly.
     *
     * @param {Object} size
     *
     * @return {View}
     */
    resize(size) {
        size = size || this.__player.size;

        try {
            // width and height only
            size = { width: size.width, height: size.height };

            const _selected = this.__player.$selected;

            // video
            _selected.video().resize(
                size.width,
                size.height
            );

            // slot
            _selected.element().size(size);

            // iframe
            const _iframe = _selected.element().find('iframe', false);
            if (_iframe) {
                _iframe.size(size);
            }
        } catch (e) {
            // console.warn(e);
        };

        return this;
    }

    /**
     * @return {Boolean}
     */
    mustStart() {
        let percentage = scrolling.down() ? 50 : 100;

        return this.wrapper().visible() >= percentage;
    }

    /**
     * @return {Boolean}
     */
    mustResume() {
        return this.wrapper().visible() >= 50;
    }

    /**
     * @return {Boolean}
     */
    mustPause() {
        return !this.mustResume();
    }
}

export default View;
