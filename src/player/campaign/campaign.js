import Tag from './tag';
import { extend_object } from '../../utils/extend_object';
import config from '../../../config';

class Campaign {
    /**
     * Creates a Campaign with given response
     * of the request made to /campaign request.
     *
     * Info: assigns all data corresponding to response.campaign
     * directly in the Campaign (check 'extend_object()').
     *
     * @param {Player} player
     * @param {Object} response
     *
     * @return {Campaign}
     */
    constructor(player, response) {
        extend_object(this, response, ['campaign']);

        this.__player = player;

        this.$nonguaranteed = [];
        this.$guaranteed = [];

        this.separateTags()
            .sortTags();
    }

    /**
     * @return {Boolean}
     */
    startsWithSound() {
        const info = this.__typeInfo();

        return (info) ? info.with_sound : true;
    }

    /**
     * @return {Boolean}
     */
    startsByUser() {
        const info = this.__typeInfo();

        return (info) ? info.by_user : true;
    }

    /**
     * @return {Boolean}
     */
    isOnscroll() {
        const info = this.__typeInfo();

        return (info) ? info.name == 'onscroll' : false;
    }

    /**
     * @return {Boolean}
     */
    isInfinity() {
        const info = this.__typeInfo();

        return (info) ? info.name == 'infinity' : false;
    }

    /**
     * @return {Boolean}
     */
    isPreroll() {
        const info = this.__typeInfo();

        return (info) ? info.name == 'preroll' : false;
    }

    /**
     * @return {Boolean|Object}
     */
    __typeInfo() {
        let info = false;
        config.campaigns.forEach((campaign) => {
            if (campaign.ad_type_id == this.$ad_type) {
                info = campaign;
            }
        });

        return info;
    }

    /**
     * @return {String|Integer}
     */
    id() {
        return this.$id;
    }

    /**
     * @return {String}
     */
    ip() {
        return this.$ip;
    }

    /**
     * @return {Integer}
     */
    websiteId() {
        return this.$website_id;
    }

    /**
     * Returns guaranteed or
     * non-guaranteed tags.
     *
     * @return {Array}
     */
    tags() {
        if (this.hasGuarantees()) {
            return this.$guaranteed;
        }

        return this.$nonguaranteed;
    }

    /**
     * @return {Boolean}
     */
    hasGuarantees() {
        return this.$guaranteed.length;
    }

    /**
     * Loops through response tags and
     * creates an instance of Tag for each one.
     *
     * Based on tags' type guaranteed or not
     * it adds to it's specific list.
     *
     * @return {Campaign}
     */
    separateTags() {
        const nonguaranteed = [],
            guaranteed = [],
            loadable = [];

        if (!(this.$tags instanceof Array)) {
            const tags = [];
            Object.keys(this.$tags).forEach((key) => {
                tags.push(this.$tags[key]);
            });

            this.$tags = tags;
        }

        this.$tags.forEach((tag, index) => {
            tag = new Tag(this.__player, tag);

            // Handle guaranteed tag exception
            if (!tag.isGuaranteed() && tag.guaranteeLimit()) {
                if (tag.guaranteedCount() > tag.guaranteeLimit()) {
                    delete this.$tags[index];

                    return false;
                }
            }

            if (!tag.canBeLoaded()) {
                delete this.$tags[index];

                return false;
            }

            loadable.push(tag);

            if (tag.isGuaranteed()) {
                guaranteed.push(tag);

                return false;
            }

            nonguaranteed.push(tag);
        });

        this.$tags = loadable;
        this.$nonguaranteed = nonguaranteed;
        this.$guaranteed = guaranteed;

        return this;
    }

    /**
     * Sorts all tags and guaranteed ones
     * based on their type (check tag.priority()).
     *
     * @return {Campaign}
     */
    sortTags() {
        ['nonguaranteed', 'guaranteed'].forEach((key) => {
            const _by = (key == 'nonguaranteed') ? false : true;

            this[`$${key}`].sort((a, b) => {
                if (!b.priority(_by)) {
                    return false;
                }

                if (a.priority(_by) < b.priority(_by)) {
                    return false;
                }

                return true;
            });
        });

        return this;
    }

    /**
     * Request campaign's tags.
     *
     * @return {Campaign}
     */
    requestTags() {
        this.tags().forEach((tag) => {
            tag.request();
        });

        return this;
    }

    /**
     * @return {Campaign}
     */
    createTagsSlots() {
        this.tags().forEach((tag) => {
            tag.createSlots();
        });

        return this;
    }
}

export default Campaign;
