// Function to create a Web user //
const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
module.exports = async (email,password, name, area) => {
    const params = {
        TableName: 'CHARITY_WEBSITE',
        Item: {
            'email' : {S: `${email}`},
            'password' : {S: `${password}`},
            'u_name' : {S: `${name}`},
            'area' : {S: `${area}`},
            'donations' : {L:  [{"S": "donations"}]},
            'donated_for' : {L:  [{"S": "donation for"}]},
            'receipt_number' : {L:  [{"S": "order refernce id"}]},
            'donation_time' : {L:  [{"S": "donation time"}]}
        }};
    const request = ddb.putItem(params);
    const result = await request.promise();
    return result;
};

          