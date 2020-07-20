const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
module.exports = async sender_psid => {
  var data;
  try{
    const params = {
      TableName: 'CHARITY_USERS',
      Key: {
        'PSID': {S: sender_psid}
      },
      ProjectionExpression: 'PSID, profile_pic_url ,first_name, last_name , user_type , general_state, general_counter, emailing_email, emailing_subject'
    };
    
  const request = ddb.getItem(params);
  data = await request.promise();

  } catch(e){
throws(e);
  }
    // in case no blocks are found return undefined
    return data;
  };
