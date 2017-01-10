/**
 * Current device browser.
 */
class Device {
    constructor() {
        this.agent = navigator.userAgent;

        this.platform = navigator.platform;
    }

    /**
     * @return {Boolean}
     */
    mobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(this.agent);
    }

    /**
     * @return {Boolean}
     */
    igadget() {
        return /webOS|iPhone|iPad|iPod/i.test(this.agent)
    }

    /**
     * @return {Boolean}
     */
    iphone() {
        const agent = /iPhone|iPod/i.test(this.agent),
            platform = /iPhone|iPod/i.test(this.platform);

        return agent && platform;
    }

    /**
     * @return {Boolean}
     */
    safari() {
        return /Safari/i.test(this.agent);
    }

    /**
     * Check IOS version for video inline support.
     *
     * @return {Boolean}
     */
    iphoneInline() {
        if (!this.safari()) {
            return true;
        }

        if (!this.igadget()) {
            return true;
        }

        const matched = this.agent.match(/Version\/(.*?)\s/);
        if (matched) {
            return parseInt(matched[1]) >= 10;
        }

        return false;
    }

    /**
     * @return {Boolean}
     */
    flash() {
        let flash = false;
        Object.keys(navigator.plugins).forEach((key) => {
            const plugin = navigator.plugins[key];

            Object.keys(plugin).forEach((key) => {
                const mime = plugin[key];

                if (mime.type == 'application/x-shockwave-flash') {
                    flash = true;
                }
            })
        })

        return flash;
    }
}

export default (() => {
    return new Device();
})();
