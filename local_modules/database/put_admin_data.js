/// Function used to add the Admin Data ///
const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
module.exports = async (data) => {
    const params = {
        TableName: 'CHARITY_USERS',
        Item: {
        'PSID' : {S: `${data.id}`},
        'profile_pic_url' : {S: `${data.profile_pic}`},
        'first_name' : {S: `${data.first_name}`},
        'last_name' : {S: `${data.last_name}`},
        'user_type' : {S: `admin`},
        'general_state' : {S: `Just Added`},
        'general_counter' : {N: `0`},
        'emailing_email' : {S:""},
        'emailing_subject' : {S:""}
        }};
    const request = ddb.putItem(params);
    const result = await request.promise();
    return result;
};

          