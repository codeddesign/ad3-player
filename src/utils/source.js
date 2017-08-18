import { parse_uri } from '../utils/uri';

/**
 * Get information about current js element.
 */
class Source {
    constructor(script) {
        if (!script) {
            script = { src: '_CSS_CDN_' }; // being replaced by rollup
        }

        const link = parse_uri(script.src),
            matched = link.file_name.match(/\d+/g) || false;

        this.id = (matched) ? matched[0] : false;

        this.path = link.base;

        this.script = script;
    }
}

export default (() => {
    return new Source(document.currentScript);
})();
