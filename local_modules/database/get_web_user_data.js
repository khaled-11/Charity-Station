const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
module.exports = async email => {
  var data;
  try{
    const params = {
      TableName: 'CHARITY_WEBSITE',
      Key: {
        'email': {S: email}
      },
      ProjectionExpression: 'email, u_name, area ,donated_for, donation_time , donations , receipt_number'
    };
  
  const request = ddb.getItem(params);
  data = await request.promise();

  } catch(e){
throw(e);
  }
    // in case no blocks are found return undefined
    return data;
  };
