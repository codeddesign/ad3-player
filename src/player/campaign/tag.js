import { extend_object } from '../../utils/extend_object';

class Tag {
    /**
     * Creates Tag with given information
     * received after a /campaign request.
     *
     * @param {Object} info
     * @param {Campaign} campaign
     *
     * @return {Tag}
     */
    constructor(info) {
        extend_object(this, info);
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
    uri() {
        return this.$url;
    }

    /**
     * It returns Vast object if it succeded
     * or Boolean 'false'.
     *
     * @return {Vast|Boolean}
     */
    vast() {
        return this.$vast;
    }

    /**
     * @param {Boolean} byGuarantee
     *
     * @return {Integer}
     */
    priority(byGuarantee = false) {
        if (!byGuarantee) {
            return this.$priority_count;
        }

        return this.$guarantee_order;
    }

    /**
     * Delay time in milliseconds.
     *
     * @return {Integer}
     */
    delay() {
        return parseInt(this.$delay_time);
    }

    /**
     * Timeout time in milliseconds.
     *
     * @return {Integer}
     */
    timeOut() {
        return parseInt(this.$timeout_limit);
    }

    /**
     * @return {Integer}
     */
    wrapperLimit() {
        return this.$wrapper_limit;
    }

    /**
     * @return {Boolean}
     */
    isGuaranteed() {
        if (!this.$guarantee_enabled) {
            return false;
        }

        return (this.$guaranteed_count || 0) <= this.$guarantee_limit;
    }

    /**
     * @return {Boolean}
     */
    isActive() {
        return this.$active;
    }

    /**
     * @return {String}
     */
    platformType() {
        return this.$platform_type;
    }

    /**
     * @return {Boolean}
     */
    forAll() {
        return this.platformType() == 'all';
    }

    /**
     * @return {Boolean}
     */
    forMobile() {
        return this.platformType() == 'mobile';
    }
}

export default (info, campaign) => {
    return (new Tag(info, campaign));
};
