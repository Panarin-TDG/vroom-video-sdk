// Helper to parse query string
function getQueryStringValue(name: string) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    let regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// Helper to escape XML tags
function escapeXmlTags(value: string) {
    if (value) {
        let escapedValue = value.replace(new RegExp('<', 'g'), '&lt');
        escapedValue = escapedValue.replace(new RegExp('>', 'g'), '&gt');
        return escapedValue;
    }
}


export {
    getQueryStringValue,
    escapeXmlTags
}