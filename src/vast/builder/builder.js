import rules from './rules';

/**
 * Helper class.
 *
 * - creates a JSON string with VAST's clean version.
 * - creates an instance of VAST from a JSON string.
 */
class Builder {
    /**
     * @param {Vast} vast
     *
     * @return {String}
     */
    static toString(vast) {
        const isVast = vast instanceof rules.vast.name;
        if (!isVast) {
            throw new Error(`Builder: tostring() expects a Vast, but got ${vast}.`);
        }

        return JSON.stringify(vast.clean());
    }

    /**
     * @param {String} stringified
     *
     * @return {Vast}
     */
    static toVast(stringified) {
        const isString = typeof stringified == 'string';
        if (!isString) {
            throw new Error(`Builder: toVast() expects a string, but got ${stringified}.`);
        }

        return this._build('vast', JSON.parse(stringified))
    }

    /**
     * @param {String} name
     * @param {Mixed} json
     *
     * @return {Vast}
     */
    static _build(name, json) {
        name = name.replace('$', '');

        const builder = rules[name];
        if (!builder) {
            return json;
        }

        let tag = Object.create(builder.name.prototype);

        if (builder.type == 'collection') {
            tag.$items = [];

            json.forEach((value) => {
                // Singularize name.
                // Remove last 's' from collection 'name'.
                const singular = name.slice(0, -1);

                tag.$items.push(
                    this._build(singular, value)
                );
            });

            return tag;
        }

        Object.assign(tag, json);

        Object.keys(tag).forEach((key) => {
            if (tag[key] instanceof Object) {
                tag[key] = this._build(key, tag[key]);
            }
        });

        return tag;
    }
}

export default Builder;
