/// Function used to add the user data ///
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
        'user_type' : {S: `user`},
        'general_state' : {S: `new`},
        'email' : {S: ``},
        'area' : {S: ""},
        'donations' : {L:  [{"S": "donations"}]},
        'donated_state' : {L:  [{"S": "donated State"}]},
        'receipt_number' : {L:  [{"S": "order refernce id"}]},
        'donation_time' : {L:  [{"S": "donation time"}]},
        'inbox_msg' : {L:  [{"S": "inbox messages"}]},
        'inbox_review_till' : {N: `0`},
        'bot_msg' : {L:  [{"S": "bot messages"}]},
        'bot_review_till' : {N: `0`},
        'general_counter' : {N: `0`},
        'Notification_token' : {S: ''},
        'search_name' : {S: ''},
        'search_city' : {S: ''}
    }};
    const request = ddb.putItem(params);
    const result = await request.promise();
    return result;
};

          