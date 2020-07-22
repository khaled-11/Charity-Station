// Function used to get All Messenger users Data //
const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
module.exports = async () => {
    const params = {
        TableName: 'CHARITY_USERS',
        ProjectionExpression: 'PSID, profile_pic_url ,first_name, last_name , user_type , general_state, email, postal_code, donations , general_counter , Notification, Notification_token'
      };
      
    const request = ddb.scan(params);
        const data = await request.promise();
            // in case no blocks are found return undefined
            return data.Items;
          };
