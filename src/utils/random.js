export default () => {
    return Math.random().toString().replace('.', '');
};

export const randomString = () => {
    return Math.random().toString(36).replace('.', '') + Math.random().toString(36).replace('.', '');
};
