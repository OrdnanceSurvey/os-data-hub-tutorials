var prettyjson = {
    // returns object
    stringReplacer: function(json) {
        return JSON.parse(JSON.stringify(json)
            .replace(/\"\[/g, '[').replace(/\]\"/g, ']')
            .replace(/\"\{/g, '{').replace(/\}\"/g, '}')
            .replace(/\\\"/g, '"'));
    },
    // returns string
    syntaxHighlight: function(json) {
        return JSON.stringify(json, undefined, 2)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
                var cls = 'json-number';
                if( /^"/.test(match) )
                    cls = (/:$/.test(match)) ? 'json-key' : 'json-string';
                else if( /true|false/.test(match) )
                    cls = 'json-boolean';
                else if( /null/.test(match) )
                    cls = 'json-null';
                return '<span class="' + cls + '">' + match + '</span>';
            });
    }
}


