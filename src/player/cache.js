import Builder from '../vast/builder/builder';
import config from '../../config';

/**
 * Prefix for local storage keys.
 *
 * @type {String}
 */
const KEY_PREFIX = '__a3m_tag';

class Cache {
    /**
     * @return {Boolean}
     */
    static support() {
        if (!config.caching) {
            return false;
        }

        return typeof Storage != 'undefined';
    }

    /**
     * @param {Campaign} campaign
     * @param {Tag} tag
     *
     * @return {Boolean}
     */
    static write(campaign, tag) {
        if (!this.support() || tag.vast()._fromCache) {
            return false;
        }

        const _key = this._name(campaign.id(), tag.id());

        localStorage.setItem(
            _key,
            Builder.toString(tag.vast())
        );

        tag.vast()._cacheKey = _key;

        return true;
    }

    /**
     * @param {Campaign} campaign
     * @param {Tag} tag
     *
     * @return {Boolean|Array}
     */
    static read(campaign, tag) {
        if (!this.support()) {
            return false;
        }

        const pattern = this._pattern(campaign.id(), tag.id());

        let key = false,
            vast = false;
        for (key in localStorage) {
            const matched = key.match(pattern);
            if (matched && !this._isAllocated(key)) {
                try {
                    vast = Builder.toVast(
                        localStorage.getItem(key)
                    );

                    vast._fromCache = true;
                    vast._cacheKey = key;

                    this._allocate(key);

                    return { key, vast };
                } catch (e) {
                    this.remove(key);
                }
            }
        }

        return false;
    }

    /**
     * @param {String} key
     *
     * @return {Cache}
     */
    static remove(key) {
        if (key) {
            localStorage.removeItem(key);
        }

        return this;
    }

    /**
     * @param {Integer} campaignId
     * @param {Integer} tagId
     *
     * @return {String}
     */
    static _name(campaignId, tagId) {
        return `${KEY_PREFIX}:${campaignId}:${tagId}:${Date.now()}`;
    }

    /**
     * @param {Integer} campaignId
     * @param {Integer} tagId
     *
     * @return {RegExp}
     */
    static _pattern(campaignId, tagId) {
        return new RegExp(`${KEY_PREFIX}:(${campaignId}):(${tagId}):([0-9]+)`);
    }

    /**
     * @param {String} key
     *
     * @return {Cache}
     */
    static _allocate(key) {
        if (!this._allocated) {
            this._allocated = new Set();
        }

        this._allocated.add(key);

        return this;
    }

    /**
     * @param {String} key
     *
     * @return {Boolean}
     */
    static _isAllocated(key) {
        if (!this._allocated) {
            return false;
        }

        return this._allocated.has(key);
    }
}

export default Cache;
