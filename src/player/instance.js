class Instance {
    constructor() {}

    /**
     * @param {Object} data
     */
    add(data = {}) {
        const isObject = data instanceof Object;
        if (!isObject) {
            throw new Error(`Instance: add() is expecting an Object.`);

            return this;
        }

        Object.assign(this, data);

        return this;
    }

    /**
     * Fetch one or more instances.
     *
     * @param {String|Array} name
     *
     * @return {Mixed}
     */
    fetch(name) {
        if (name instanceof Array) {
            const instances = {};
            name.forEach((_name) => {
                instances[_name] = this[_name];
            });

            return instances;
        }

        return this[name];
    }

    /**
     * @param {String} name
     *
     * @return {Boolean}
     */
    has(name) {
        return typeof this[name] !== 'undefined';
    }
};

export default (() => {
    return new Instance;
})();
