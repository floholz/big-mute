export function urlToId(url) {
    return 'url-list-item-' + url.hostname.replaceAll('.', '_');
}

export function urlToEntry(url) {
    return `${url.protocol}//${url.hostname}/`;
}





