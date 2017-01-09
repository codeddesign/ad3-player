import Collection from '../collection/collection';
import createMediaFile from './mediafile';

export class MediaFiles extends Collection {
    constructor(mediafiles) {
        super(mediafiles, createMediaFile);
    }
}

export default (mediafiles) => {
    return new MediaFiles(mediafiles);
};
