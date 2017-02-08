import $instance from '../instance';
import Media from './media';

class Slot {
    constructor(tag) {
        this.__tag = tag; // Note: tag contains $slots - possible circular problem

        this.$ad = false;

        this.$creative = false;

        this.$media = false;

        this.$video = false;

        this.$element = false;
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
            const bestMedia = new Media();
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
                    this.$video = true; // new HTML5(this);

                    break;
                case 'video/x-flv':
                    this.$video = true; // new Flash(this);

                    break;
                case 'application/x-shockwave-flash':
                    this.$video = true; // new VPAIDFlash(this);

                    break;
                case 'text/javascript':
                case 'application/javascript':
                case 'application/x-javascript':
                    this.$video = true; // new VPAIDJavaScript(this);

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

            this.$element = $instance.view.container().append('a3m-slot', attributes);
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
}

export default Slot;
