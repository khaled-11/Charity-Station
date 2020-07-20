const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
module.exports = async (data,type) => {
    const params = {
        TableName: 'CHARITY_DATA',
        Item: {
        'event_name' : {L:  [{"S": "event name"}]},
        'event_tagline' : {L:  [{"S": "event tagLine"}]},
        'event_webpage' : {L:  [{"S": "event webpage"}]},
        'event_image' : {L:  [{"S": "event image"}]},
        'event_location' : {L:  [{"S": "event location"}]},
        'fundraising_name' : {L:  [{"S": "fundraising name"}]},
        'fundraising_tagline' : {L:  [{"S": "fundraising tagLine"}]},
        'fundraising_webpage' : {L:  [{"S": "fundraising website"}]},
        'fundraising_image' : {L:  [{"S": "fundraising image"}]},
        'fundraising_limit' : {L:  [{"S": "fundraising limit"}]},
        'fundraising_current_limit' : {L:  [{"S": "fundraising current limit"}]}
        }};
    const request = ddb.putItem(params);
    const result = await request.promise();
    return result;
};

          