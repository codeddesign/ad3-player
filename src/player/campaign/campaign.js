import { extend_object } from '../../utils/extend_object';

class Campaign {
    /**
     * Creates a Campaign with given response
     * of the request made to /campaign request.
     *
     * Info: assigns all data corresponding to response.campaign
     * directly in the Campaign (check 'extend_object()').
     *
     * @param {Object} response
     *
     * @return {Campaign}
     */
    constructor(response) {
        extend_object(this, response, ['campaign']);
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
     * @return {Array}
     */
    tags() {
        return this.$tags;
    }
}

export default Campaign;
