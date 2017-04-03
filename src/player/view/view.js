import { wrapper } from './templates';
import device from '../../utils/device';
import proportion from '../../utils/proportion';
import scrolling from '../../utils/scrolling';
import config from '../../../config';

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

        if (campaign.isOnscroll() && this.__onscrollBasic()) {
            if (show) {
                if (this.__player.backfill.created()) {
                    this.__player.backfill.hide();
                }

                this.container().size(this.__player.size);

                this.container().removeClass('slided');

                return this;
            }

            this.container().addClass('slided');

            if (this.__player.backfill.created()) {
                this.container().attrRemove('style'); // 'cancel' transition

                this.__player.backfill.show();
            }

            return this;
        }

        if (campaign.isOnscroll() && this.__onscrollAside()) {
            if (show) {
                this.container().removeClass('slided');

                return this;
            }

            this.wrapper().attrRemove('style');

            this.container()
                .removeClass('fixed-custom')
                .attrRemove('style');

            if (!this.__player.backfill.created()) {
                this.container().size(this.__player.size);
            }

            this.container()
                .addClass('slided');

            return this;
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

        const campaign = this.__player.campaign;

        if (campaign.isOnscroll()) {
            if (this.wrapper().visible() >= 50 && !this.__player.backfill.created()) {
                this.__removeCustomPosition();
            } else {
                this.__addCustomPosition();
            }

            if (this.__onscrollAside()) {
                return true;
            }
        }

        return this.wrapper().visible() >= percentage;
    }

    /**
     * @return {Boolean}
     */
    mustResume() {
        const campaign = this.__player.campaign;

        if (campaign.isOnscroll()) {
            if (this.__onscrollAside()) {
                return true;
            }
        }

        return this.wrapper().visible() >= 50;
    }

    /**
     * @return {Boolean}
     */
    mustPause() {
        return !this.mustResume();
    }

    /**
     * @return {View|Boolean}
     */
    __addCustomPosition() {
        if (!this.__onscrollAside()) {
            return false;
        }

        const $script = this.$source.script,
            mode = device.mobile() ? 'mobile' : 'desktop',
            styling = $script.attr(`styling-${mode}`) || $script.attr('styling') || 'left: 10, bottom: 10, width: 320',
            style = {
                width: this.__player.size.width
            };

        styling.split(',').forEach((key) => {
            key = key.trim();

            let value = '0';
            if (key.includes(':')) {
                [key, value] = key.split(':');
            }

            // ignore height if added
            if (key != 'height') {
                style[key.trim()] = parseInt(value.trim());
            }
        });

        // wrapper: keep size
        if (!this.__player.backfill.created() && this.__player.$selected && this.__player.$selected.isPlaying()) {
            this.wrapper().style('height', this.__player.size.height, true);
        }

        // container: add custom style
        Object.keys(style).forEach((key) => {
            const value = style[key];

            this.container().style(key, value, true);

            if (key == 'width') {
                // height: keep proportions; ignore given height if any
                style.height = proportion(value).height;

                this.container().style('height', style.height, true);
            }
        });

        // container: add custom fixed class
        this.container().addClass('fixed-custom');

        // video: resize
        this.resize(style);

        return this;
    }

    /**
     * @return {View|Boolean}
     */
    __removeCustomPosition() {
        if (!this.__onscrollAside()) {
            return false;
        }

        // container: remove custom fixed class, style, set new size
        this.container()
            .removeClass('fixed-custom')
            .attrRemove('style')
            .size(this.__player.size);

        // wrapper: remove kept size
        this.wrapper().attrRemove('style');

        // video: resize to initial size
        this.resize();

        return this;
    }

    /**
     * @return {Boolean}
     */
    __onscrollMode(name) {
        const mode = device.mobile() ? 'mobile' : 'desktop';

        return config.onscroll[mode] == name;
    }

    /**
     * @return {Boolean}
     */
    __onscrollBasic() {
        return this.__onscrollMode('basic');
    }

    /**
     * @return {Boolean}
     */
    __onscrollAside() {
        return this.__onscrollMode('aside');
    }
}

export default View;
