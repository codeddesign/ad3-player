import device from '../../utils/device';
import { decode_uri } from '../../utils/uri';

/**
 * Preferences of media file types
 * in order.
 *
 * @type {Set}
 */
const MEDIA_PRIORITY = new Set([
    'video/mp4',
    'video/ogg',
    'video/webm',
    'video/x-flv',
    'text/javascript',
    'application/javascript',
    'application/x-javascript',
    'application/x-shockwave-flash'
]);

class Media {
    constructor(player) {
        this.__player = player;

        this.$framework = false;

        if (!device.flash()) {
            MEDIA_PRIORITY.delete('video/x-flv');
            MEDIA_PRIORITY.delete('application/x-shockwave-flash');
        }

        this.$priority = [...MEDIA_PRIORITY];

        this.$preferred = [];
    }

    /**
     * Sets $framework to true,
     * making the ones with vpaid a priority.
     *
     * @return {Media}
     */
    preferFramework() {
        this.$framework = true;

        return this;
    }

    /**
     * Sets, filters and prioritize
     * given media files.
     *
     * @param {Array} mediaFiles
     *
     * @return {Media}
     */
    setMediaFiles(mediaFiles) {
        this.$mediaFiles = mediaFiles;

        this._setByFramework()
            ._removeUnsupportedByDevice()
            ._setByPriority()
            ._setByFirstType()
            ._setBySizes()
            ._decodeSource();

        return this;
    }

    /**
     * @return {MediaFile|Boolean}
     */
    preferred() {
        if (this.$preferred.length) {
            return this.$preferred[0];
        }

        return false;
    }

    /**
     * @return {Media}
     */
    _setByFramework() {
        this.$preferred = this.$mediaFiles.filter((media) => {
            if (this.$framework && media.isVPAID()) {
                return true;
            }

            return !media.isVPAID();
        });

        if (!this.$preferred.length) {
            this.$preferred = this.$mediaFiles;
        }

        return this;
    }

    /**
     * @return {Media}
     */
    _removeUnsupportedByDevice() {
        this.$preferred = this.$preferred.filter((media) => {
            if (!device.flash() && media.requiresFlash()) {
                return false;
            }

            return true;
        });

        return this;
    }

    /**
     * @return {Media}
     */
    _setByPriority() {
        this.$preferred.sort((a, b) => {
            return this.__priorityIndex(a.type()) - this.__priorityIndex(b.type());
        });

        return this;
    }

    /**
     * @return {Media}
     */
    _setByFirstType() {
        if (!this.$preferred.length) {
            return this;
        }

        const type = this.$preferred[0].type();

        this.$preferred = this.$preferred.filter((media) => {
            return media.type() == type;
        });

        return this;
    }

    /**
     * @return {Media}
     */
    _setBySizes() {
        this.$preferred.sort((a, b) => {
            if (device.mobile()) {
                return a.width() - b.width();
            }

            return a.width() - this.__player.size.width;
        });

        return this;
    }

    /**
     * @return {Media}
     */
    _decodeSource() {
        this.$preferred.forEach((media, index) => {
            this.$preferred[index].$source = decode_uri(
                media.source()
            );
        });

        return this;
    }

    /**
     * @return {Integer}
     */
    __priorityIndex(type) {
        const index = this.$priority.indexOf(type);

        return (index === -1) ? this.$priority.length : index;
    }
}

export default Media;
