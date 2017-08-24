import config from '../../../config';

export const wrapper = (campaign_id) => {
    return `<a3m-wrapper data-campaign="${campaign_id}">
        <a3m-backfill class="none">
            <a3m-placeholder></a3m-placeholder>
        </a3m-backfill>
        <a3m-fixable>
            <a3m-container>
                <a3m-slot class="video none"></a3m-slot>
                <a3m-sound class="hidden off"></a3m-sound>
            </a3m-container>
            <a3m-target><a3m-target-text>Learn more</a3m-target-text><a3m-target-arrow></a3m-target-arrow></a3m-target>
        </a3m-fixable>
    </a3m-wrapper>`
};

/**
 * @param {Integer|String} width
 * @param {Integer|String} height
 * @param {bool} source
 *
 * @return {String}
 */
export const iframe_template = (width = '100%', height = '100%', source = false) => {
    if (width != '100%') {
        width = `${width}px`;
    }

    if (height != '100%') {
        height = `${height}px`;
    }

    let template = `<iframe frameborder="0" seamless="seamless" scrolling="no"
        allowtransparency="true" allowfullscreen="true"
        marginwidth="0" marginheight="0" vspace="0" hspace="0"
        width="${width}" height="${height}"`;

    if (source) {
        template += ` src="${source}"`;
    }

    template += '></iframe>';

    return template;
};
