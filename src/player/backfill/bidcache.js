import config from './config';

/**
 * Prefix for local storage keys.
 *
 * @type {String}
 */
const KEY_PREFIX = '__a3m_pbjs';

class BidCache {
    /**
     * @return {BidCache}
     */
    constructor() {
        this.$supported = typeof Storage != 'undefined';

        this.__setItems();
    }

    /**
     * @return {Boolean}
     */
    isSupported() {
        return this.$supported;
    }

    /**
     * Get a list of cached bids
     *
     * @return {Array}
     */
    cached() {
        const $cached = [];

        if (!this.isSupported()) {
            return $cached;
        }

        const pattern = this.__pattern();
        for (const key in localStorage) {
            const matched = key.match(pattern);
            if (!matched) {
                continue;
            }

            const [_matched_key, width, height, timestamp] = matched;

            const hours = (Date.now() - parseInt(timestamp)) / 36e5;
            if (hours >= config.cache_expiration) {
                this.delete(key);

                continue;
            }

            let value = false;
            try {
                value = JSON.parse(localStorage[key]);
                value.cached_key = key;
            } catch (e) {
                this.delete(key);

                continue;
            }

            const size = `${width}x${height}`;
            if (!$cached[size]) {
                $cached[size] = [];
            }

            $cached[size].push(value);
        }

        return $cached;
    }

    /**
     * Expects "width x height" (no spaces)
     *
     * @param {String} size
     *
     * @return {Array}
     */
    read(size) {
        return this.$items[size] || [];
    }

    /**
     * Expects "width x height" (no spaces)
     *
     * @param {String} size
     *
     * @return {Array}
     */
    allocate(size) {
        return this.read(size).shift() || false;
    }

    /**
     * @param {Object} bid
     *
     * @return {Boolean|Object}
     */
    save(bid) {
        if (!this.isSupported()) {
            return false;
        }

        const key = this.__key(bid.width, bid.height),
            value = JSON.stringify(bid);

        localStorage.setItem(key, value);

        return { key, value };
    }

    /**
     * @param {String} key
     *
     * @return {BidCache}
     */
    delete(key) {
        if (!this.isSupported()) {
            return this;
        }

        if (key) {
            localStorage.removeItem(key);
        }

        return this;
    }

    /**
     * @return {BidCache}
     */
    truncate() {
        if (!this.isSupported()) {
            return this;
        }

        const pattern = this.__pattern();
        for (const key in localStorage) {
            const matched = key.match(pattern);
            if (matched) {
                this.delete(key);
            }
        }

        return this;
    }

    /**
     * @return {BidCache}
     */
    __setItems() {
        this.$items = this.cached();

        return this;
    }

    /**
     * @param {Integer|String} width
     * @param {Integer|String} height
     *
     * @return {String}
     */
    __key(width, height) {
        return `${KEY_PREFIX}:${width}x${height}:${Date.now()}`;
    }

    /**
     * @return {RegExp}
     */
    __pattern() {
        return new RegExp(`${KEY_PREFIX}:([0-9]+)x([0-9]+):([0-9]+)`);
    }
}

export default (() => {
    return new BidCache();
})();
