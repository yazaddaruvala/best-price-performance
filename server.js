var express = require('express')
,   app = express.createServer();
var redis = require('redis');
var client = redis.createClient();
var querystring = require('querystring');

var typeList;
client.smembers("alcoholType", function(err, tempTypeList){
  typeList = tempTypeList;
});

app.use(express.bodyParser());

var get20results = function(filter, page, next){
  
  client.zrange("alcohol", 0+(20*(page-2)), 20+(20*(page-2)), function(err, data){
    var validData = [];
    //Can make this for async
    for (var i = 0; i < data.length; i++) {
      data[i] = querystring.parse(data[i], ';', ':');
      if (filter !== 'All') {
        if (data[i].Type.search(filter) !== -1) {
          validData.push(data[i]);
          if (validData.length === 20) {
            break;
          }
        }
      } else {
        validData.push(data[i]);
      }
    }
    next(validData);
  });
};

app.get('/', function(req, res){
  if (!req.query.page) {
    req.query.page = 2;
  } else {
    if (req.query.page < 2){
      req.query.page = 2;
    } else {
      req.query.page++;
    }
  }
  if (!req.query.filterQuery) {
    req.query.filterQuery = 'All';
  }

  get20results(req.query.filterQuery, req.query.page, function(data){
    res.render('./index.jade', {
      layout: false
    , lastQuery: req.query.filterQuery
    , typeList: typeList
    , list_from_database: data
    , nextPage: querystring.stringify(req.query, '&', '=')
    });
  });
});

app.listen(8005);
