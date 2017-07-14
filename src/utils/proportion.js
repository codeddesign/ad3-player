import config from '../../config';

export default (width, _proportion) => {
    _proportion = _proportion || config.proportion;

    return {
        width,
        height: _proportion * width
    };
};
