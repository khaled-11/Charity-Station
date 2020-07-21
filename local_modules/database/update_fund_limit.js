// Function to update the Current reached limit for a specific Fundraising //
const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();
 module.exports = async (fundName, count) => {
    const params = {
        TableName: 'CHARITY_FUND_DATA',
        Key: {
        "fundraising_name" : fundName,
        },
        ExpressionAttributeNames : {
            "#current": "fundraising_current_limit"
        },
        UpdateExpression: `set #current = #current + :ss`,
        ExpressionAttributeValues:{
            ":ss":count
        },
    };
     const request = docClient.update(params);
         const result = await request.promise();
         return result;
};