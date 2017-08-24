import { wrapper } from './templates';
import device from '../../utils/device';
import proportion from '../../utils/proportion';
import scrolling from '../../utils/scrolling';
import { referrer } from '../../utils/uri';
import { decode_uri } from '../../utils/uri';
import config from '../../../config';

class View {
    constructor(player, ins) {
        this.__player = player;

        this.$ins = ins;

        this.$els = {};

        this.setup()
            .addTargetListener();
    }

    /**
     * View setup
     *
     * @return {View}
     */
    setup() {
        // Set inview to 'true' when in test mode
        if (config.single_tag_testing && referrer.data._tid) {
            config.onscroll.desktop.inview = true;
            config.onscroll.mobile.inview = true;
        }

        // replace 'ins' with template
        this.$els.wrapper = this.$ins.replaceHtml(
            wrapper(this.$ins.campaign)
        );

        // add view elements
        ['backfill', 'fixable', 'container', 'slot.video', 'sound', 'target'].forEach((name) => {
            const selector = `a3m-${name}`;

            this.$els[name] = this.wrapper().find(selector);
        });

        // save size as data on wrapper
        this.wrapper().sizeAsData(this.__player.size);

        // prepare view for campaign type
        const campaign = this.__player.campaign;

        if (campaign.isOnscroll()) {
            this.container()
                .addClass('none nowait')
                .addClass('slide slided')
                .removeClass('none nowait', true);
        }

        if (campaign.isInfinity()) {
            this.wrapper()
                .style('top', 0)
                .style('position', 'sticky');
        }

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

    fixable() {
        return this.get('fixable');
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
     * @return {Element}
     */
    target() {
        return this.get('target');
    }

    /**
     * @return {View}
     */
    addTargetListener() {
        this.target().sub('click', () => {
            if (!this.__player.$selected) {
                return false;
            }

            const _selected = this.__player.$selected;

            _selected.videoListener('clickthrough');

            const uri = _selected.creative().clickThrough();
            if (uri && uri.length) {
                window.open(this.__player.macro.uri(decode_uri(uri)));
            }
        });

        return this;
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
                if (this.__player.backfill.revealed()) {
                    this.__player.backfill.hide();
                }

                this.container().removeClass('slided');

                return this;
            }

            this.container().addClass('slided');

            if (this.__player.backfill.filled()) {
                this.__player.backfill.show();

                if (this.__player.backfill.revealed()) {
                    this.container().attrRemove('style'); // 'cancel' transition

                    return this;
                }

                if (this.__player.backfill.mustReveal()) {
                    this.__player.backfill.reveal();

                    return this;
                }

                return this;
            }

            return this;
        }

        if (campaign.isOnscroll() && this.__onscrollAside()) {
            if (show) {
                // add none+hidden in case there's no 'clickthrough'
                this.target().hide(true);

                if (!this.__player.$selected) {
                    return this;
                }

                const uri = this.__player.$selected.creative().clickThrough();
                if (uri && uri.length) {
                    this.target().show(true).addClass('active');
                }

                // sanity call: add/remove custom position
                this.mustStart();

                this.__player.$selected.show();

                this.container().removeClass('slided');

                return this;
            }

            this.target().hide().removeClass('active');

            this.wrapper().attrRemove('style');

            if (!this.__player.backfill.revealed()) {
                if (this.__player.backfill.mustReveal()) {
                    this.__player.backfill.reveal();
                }

                if (this.container().hasClass('customfixed')) {
                    this.container()
                        .attrRemove('style');
                }
            }

            this.container()
                .addClass('slided');

            return this;
        }

        if (campaign.isInfinity()) {
            if (show) {
                this.container().show();

                this.__player.backfill.hide();

                const slot = this.__player.$selected.element(),
                    size = proportion(slot.size().width);

                this.container().size({
                    width: size.width,
                    height: size.height
                });

                slot.size(size);
            } else {
                this.container().hide();

                this.__player.backfill
                    .reveal()
                    .show();
            }
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

        const width = size.width;

        try {
            const _selected = this.__player.$selected;

            size = proportion(width, _selected.proportion());

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
        if (!this.__onscrollInview()) {
            return true;
        }

        let percentage = scrolling.down() ? 50 : 100;

        const campaign = this.__player.campaign;

        if (campaign.isOnscroll()) {
            if (this.wrapper().visible() >= 50 && !this.__player.backfill.revealed()) {
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
        if (!this.__onscrollInview()) {
            return true;
        }

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
        if (!this.__onscrollInview()) {
            return false;
        }

        return !this.mustResume();
    }

    /**
     * @return {View|Boolean}
     */
    __addCustomPosition() {
        if (!this.__onscrollAside()) {
            return false;
        }

        const mode = device.mobile() ? 'mobile' : 'desktop',
            styling = this.$ins.attr(`styling-${mode}`) || this.$ins.attr('styling') || 'left: 10, bottom: 10, width: 400',
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

        // don't allow the width to be less than 400
        if (style.width < 400) {
            style.width = 400;
        }

        if (!this.__player.$selected) {
            return false;
        }

        // wrapper: keep size
        if (
            this.__player.$selected.isPlaying() &&
            !this.__player.backfill.revealed() &&
            !this.wrapper().attr('style')
        ) {
            this.wrapper().style('height', this.__player.$selected.size().height, true);
        }

        // container: add custom style
        Object.keys(style).forEach((key) => {
            const value = style[key];

            this.fixable().style(key, value, true);

            if (key == 'width') {
                // height: keep proportions; ignore given height if any
                style.height = proportion(value, this.__player.$selected.proportion()).height;

                this.fixable().style('min-height', style.height, true);
            }
        });

        // container: add custom fixed class
        this.fixable().addClass('customfixed');

        // video: resize
        if (this.__player.$selected.isPlaying()) {
            this.resize(style);
        }

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
        this.fixable()
            .removeClass('customfixed')
            .attrRemove('style');

        // video: resize to initial size
        if (this.__player.$selected.isPlaying()) {
            this.resize();
        }

        // wrapper: remove height as final action
        this.wrapper().attrRemove('style');

        return this;
    }

    /**
     * @return {Boolean}
     */
    __onscrollMode(name) {
        const platform = device.mobile() ? 'mobile' : 'desktop';

        return config.onscroll[platform].mode == name;
    }

    /**
     * @return {Boolean}
     */
    __onscrollInview() {
        if (this.__onscrollAside()) {
            return true;
        }

        const platform = device.mobile() ? 'mobile' : 'desktop';

        return config.onscroll[platform].inview;
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
