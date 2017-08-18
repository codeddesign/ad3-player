import $ from './element';

class ElementObserver {
    constructor() {
        this.$selectors = {};

        this.$observer = new MutationObserver((mutations) => {
            Object.keys(this.$selectors).forEach((selector) => {
                this.check(selector, this.$selectors[selector]);
            });
        });

        this.$observer.observe(document, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false,
        });
    }

    /**
     * @param {String} selector
     * @param {Function} callback
     *
     * @return {ElementObserver}
     */
    listen(selector, callback) {
        this.$selectors[selector] = callback;

        // check right away
        this.check(selector, callback);

        return this;
    }

    /**
     * @param {String} selector
     * @param {Function} callback
     *
     * @return {ElementObserver}
     */
    check(selector, callback) {
        $().findAll(selector).forEach((element) => {
            // We're saving 'existence_handled' property on 'node'
            if (element.node.existence_handled) {
                return false;
            }

            element.node.existence_handled = true;

            callback.call(this, element);
        });

        return this;
    }
}

export default (() => {
    return new ElementObserver();
})();
