export default (width, _proportion = 9 / 16) => {
    return {
        width,
        height: _proportion * width
    };
};
