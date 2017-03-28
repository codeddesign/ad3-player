import $script from '../../utils/source';
import random from '../../utils/random';

class Flash {
    constructor(player, slot) {
        this.__player = player;
        this.__slot = slot;

        this.$id = `v${random()}`;

        this.$unit = false;
        this.$called = {};

        this.$volume = false;

        this.$config = {
            view: 'transparent',
            bitrate: this.slot().media().bitrate() || 59.97,
            width: this.__player.size.width,
            height: this.__player.size.height
        };

        this.$meta = false;
        this.$time = false;

        this.$checkPoints = {};
        this.$checkPointsChecked = new Set();
    }

    /**
     * Unique id for flash listener.
     *
     * @return {String}
     */
    id() {
        return this.$id;
    }

    /**
     * @return {Slot}
     */
    slot() {
        return this.__slot;
    }

    /**
     * @return {DOMElement}
     */
    unit() {
        return this.$unit;
    }

    /**
     * @param {String} name
     *
     * @return {Boolean}
     */
    called(name) {
        return this.$called[name] || false;
    }

    /**
     * @return {String}
     */
    template() {
        return `<object type="application/x-shockwave-flash"
            width="${this.$config.width}"
            height="${this.$config.height}"
            data="${$script.path}/assets/swf/flv.swf">
            <param name="wmode" value="transparent"></param>
            <param name="allowScriptAccess" value="always"></param>
            <param name="quality" value="high"></param>
            <param name="FlashVars" value="handler=handler_${this.id()}&target=${this.slot().creative().clickThrough()}"></param>
        </object>`;
    }

    /**
     * @return {Flash}
     */
    create() {
        this._addWindowListener();

        this.$unit = this.slot().element().html(this.template()).node;

        return this;
    }

    /**
     * @return {Flash}
     */
    handShake() {
        this.unit().loadUnit({ src: this.slot().media().source() })

        return this;
    }

    /**
     * @return {Flash}
     */
    start() {
        if (this.called('loaded')) {
            this.unit().start();
        }

        return this;
    }

    /**
     * @return {Flash}
     */
    stop() {
        this.unit().stop();

        return this;
    }

    /**
     * @return {Flash}
     */
    pause() {
        this.unit().pause();

        return this;
    }

    /**
     * @return {Flash}
     */
    resume() {
        this.unit().resume();

        return this;
    }

    /**
     * @return {Flash}
     */
    skip() {
        this.unit().skip();

        return this;
    }

    /**
     * @param {Boolean|undefined} volume
     *
     * @return {Flash|Boolean}
     */
    volume(volume) {
        if (typeof volume == 'undefined') {
            // Note: needs to be reversed
            return !this.$volume
        }

        this.$volume = volume;

        this.unit().setVolume((volume) ? 1 : 0);

        return this;
    }

    /**
     * @return {Float|Integer}
     */
    duration() {
        return this.$meta.duration;
    }

    /**
     * @return {Float|integer|Boolean}
     */
    remainingTime() {
        if (!this.$meta) {
            return false;
        }

        return this.$meta.duration - this.$time;
    }

    /**
     * @param {Integer} width
     * @param {Integer} height
     *
     * @return {Flash}
     */
    resize(width, height) {
        if (!width || !height) {
            return false;
        }

        this.unit().setAttribute('width', width);
        this.unit().setAttribute('height', height);

        return this;
    }

    /**
     * @return {Flash}
     */
    _addWindowListener() {
        const handler = `handler_${this.id()}`;

        window[handler] = (typeName, typeId, data) => {
            const info = { typeName, typeId, data };

            if (typeName == 'method') {
                this._method(typeId, data);

                return false;
            }

            if (typeName == 'event') {
                if (typeId == 'loaded') {
                    this.$meta = data;
                }

                if (typeId == 'timeupdate') {
                    this.$time = data;

                    Object.keys(this.$checkPoints).forEach((point) => {
                        const _checkPointTime = this.$checkPoints[point];
                        if (!this.$checkPointsChecked.has(point) && data >= _checkPointTime) {
                            this.$checkPointsChecked.add(point);

                            this._event(point);
                        }
                    });
                }

                this._event(typeId, data);

                return false;
            }
        };

        return this;
    }

    /**
     * @param {String} name
     * @param {Mixed} data
     *
     * @return {Flash}
     */
    _method(name, data) {
        if (this[name]) {
            this[name](data);
        }

        return this;
    }

    /**
     * @param {String} name
     * @param {Mixed} data
     *
     * @return {Flash}
     */
    _event(name, data) {
        // console.warn('flash event', name, data);

        this.$called[name] = true;

        if (name == 'loaded') {
            this.$checkPoints = {
                impression: 0,
                videofirstquartile: Math.round(.25 * this.duration()),
                videomidpoint: Math.round(.5 * this.duration()),
                videothirdquartile: Math.round(.75 * this.duration()),
            };
        }

        this.slot().videoListener(name, data);

        return this;
    }
}

export default Flash;
