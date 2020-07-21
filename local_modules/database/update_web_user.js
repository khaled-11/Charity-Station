// Function to update the user account with transaction info //
const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();

var docClient = new AWS.DynamoDB.DocumentClient();
 module.exports = async (email, value, len, data) => {
    const params = {
        TableName: 'CHARITY_WEBSITE',
        Key: {
        "email" : email,
        },
  UpdateExpression: `SET ${value}[${len}] =  :attrValue`,
  ExpressionAttributeValues: {
    ":attrValue": `${data}`
         }    
    };
    const request = docClient.update(params);
    const result = await request.promise();
         return result;
  };