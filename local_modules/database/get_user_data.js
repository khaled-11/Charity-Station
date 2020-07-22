/// Function to get user data from the Database ///
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
      ProjectionExpression: 'PSID, profile_pic_url ,first_name, last_name , user_type , general_state, email, area, donations, donated_state, receipt_number, donation_time, inbox_msg, inbox_review_till, bot_msg, bot_review_till, general_counter, Notification_token, search_name, search_city'
    };
  
  const request = ddb.getItem(params);
  data = await request.promise();

  } catch(e){
throw(e);
  }
    // in case no blocks are found return undefined
    return data;
  };
