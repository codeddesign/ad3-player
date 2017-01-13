import { Vast } from '../factory/vast';
import { Ads } from '../factory/ads';
import { Ad } from '../factory/ad';
import { Creatives } from '../factory/creatives';
import { Creative } from '../factory/creative';
import { MediaFiles } from '../factory/mediafiles';
import { MediaFile } from '../factory/mediafile';

export default {
    vast: {
        name: Vast,
        type: false
    },
    ads: {
        name: Ads,
        type: 'collection'
    },
    ad: {
        name: Ad,
        type: false
    },
    creatives: {
        name: Creatives,
        type: 'collection'
    },
    creative: {
        name: Creative,
        type: false
    },
    mediafiles: {
        name: MediaFiles,
        type: 'collection'
    },
    mediafile: {
        name: MediaFile,
        type: false
    }
};
