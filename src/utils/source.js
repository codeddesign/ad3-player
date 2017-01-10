import { parse_uri } from '../utils/uri';

/**
 * Get information about current js element.
 */
class Source {
    constructor(script) {
        const link = parse_uri(script.src),
            matched = link.file_name.match(/\d+/g) || [1];

        if (!matched.length) {
            throw new Error(`Source: is missing id '${link.file_name}'.`);
        }

        this.id = matched[0];

        this.path = link.base;

        this.script = script;
    }
}

export default (() => {
    return new Source(document.currentScript);
})();
