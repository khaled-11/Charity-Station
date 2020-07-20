const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
module.exports = async event_name => {
  var data;
  try{
    const params = {
      TableName: 'CHARITY_EVENT_DATA',
      Key: {
        'event_name': {S: event_name}
      },
      ProjectionExpression: 'event_name, event_category ,event_dates, event_location, event_info, event_image'
    };
    
  const request = ddb.getItem(params);
  data = await request.promise();

  } catch(e){
      throw(e);
  }
    // in case no blocks are found return undefined
    return data;
  };
