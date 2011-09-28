var fs = require('fs');
var querystring = require('querystring');
var redis = require('redis');
var client = redis.createClient();

var categories = ['SKU', 'Name', 'Vol', 'Price', 'Country', 'Type', 'Alc'];

client.on('error', function(err){
  console.log('Error ' + err);
});

client.del("alcoholType", function(){
  console.log('alcoholType deleted');
client.del("alcohol", function(){
  console.log('alcohol deleted');

  fs.readFile('./bcl_catalogue.html', 'utf8', function (err, data) {
    if (err) console.log(err);
    var dataArray = data.slice(data.search('<table')+6, data.search('</table>')).slice(data.search('>')).split('<tr');

    //Instead of a for make it an asynchronous for loop.
    for(var i = 2; i < dataArray.length-1; i++){
      data = dataArray[i].slice(dataArray[i].search('>')+1,dataArray[i].search('</tr>')).split('<td');
      for (var j = 0; j < data.length; j++){
        data[j] = data[j].slice(data[j].search('>')+1, data[j].search('</td>')).replace(/^\s+|\s+$/g, '');
        if (data[j].length === 0){
          data.splice(j,1);
          j--;
        }
      }
      client.sadd("alcoholType", data[5]);

      var volume = 1;
      var volume_mL = data[2].replace('mL', '');
      var volume_L = data[2].replace('L', '');
      if (volume_mL !== data[2]){
        var tempVolume = volume_mL.split('x');
        for (k in tempVolume) {
          volume *= tempVolume[k];
        }
      } else if (volume_L !== data[2]) {
        volume = volume_L*1000;
      }

      var value = 1/(volume*(data[6].replace('%', ''))/(data[3].replace('$', '').replace(',', '')));
   
      for (var j = 0; j < data.length && j < categories.length; j++){
        data[j] = categories[j]+':'+data[j];
      }

      if (isNaN(value)) {
        console.log('ERROR @ ' + i);
      } else {
//        console.log(i+': '+volume+', '+data[3]+', '+data[6]+', '+value);
      }
//        console.log(data.join(';'));
      client.zadd("alcohol", value, data.join(';'));
    }
    console.log("client quits");
    client.quit();
  });
});
});
