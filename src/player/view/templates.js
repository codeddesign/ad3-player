import config from '../../../config';

const partial = {
    providedby: (_class = '') => {
        return `<a href="${config.app_path}" target="_blank" title="Presented by ${config.app_path}">
        <a3m-presentedby class="${_class}">Presented by <span>&Lambda;D <sup>&#179;</sup></span></a3m-presentedby>
        </a>`;
    }
};

export const wrapper = (campaign_id) => {
    return `<a3m-wrapper data-campaign="${campaign_id}">
        <a3m-backfill class="none">
            ${partial.providedby()}
            <a3m-placeholder></a3m-placeholder>
        </a3m-backfill>
        <a3m-fixable>
            <a3m-container>
                ${partial.providedby('video')}
                <a3m-slot class="video none"></a3m-slot>
                <a3m-sound class="hidden off"></a3m-sound>
            </a3m-container>
        </a3m-fixable>
    </a3m-wrapper>`
};

export const iframe_template = (width = '100%', height = '100%') => {
    return `<iframe frameborder="0" seamless="seamless" scrolling="no"
     allowtransparency="true" allowfullscreen="true"
     marginwidth="0" marginheight="0" vspace="0" hspace="0" width="${width}" height="${height}"></iframe>`;
};
