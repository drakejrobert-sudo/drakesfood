function serializeQueryString(querystring) {
  var pairs = [];

  Object.keys(querystring).forEach(function (key) {
    var parameter = querystring[key];
    var values = parameter.multiValue || [{ value: parameter.value || '' }];

    values.forEach(function (item) {
      pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(item.value || ''));
    });
  });

  return pairs.length > 0 ? '?' + pairs.join('&') : '';
}

function handler(event) {
  var request = event.request;
  var targetBaseUrl = __GAME_SHORTLINK_TARGET_URL__;

  return {
    statusCode: 302,
    statusDescription: 'Found',
    headers: {
      location: {
        value: targetBaseUrl + request.uri + serializeQueryString(request.querystring),
      },
      'cache-control': {
        value: 'no-store',
      },
    },
  };
}
