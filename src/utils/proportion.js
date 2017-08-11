import config from '../../config';

const proportion = (width, _proportion) => {
    _proportion = _proportion || config.proportion;

    return {
        width,
        height: _proportion * width
    };
}

export const proportion_minimal = (size, _proportion) => {
    if (size.width < 640) {
        return proportion(640, _proportion);
    }

    return size;
}

export default (width, _proportion) => {
    return proportion(width, _proportion);
};
