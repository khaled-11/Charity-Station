// Function to update the donors list for a specific Fundraising //
const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();

var docClient = new AWS.DynamoDB.DocumentClient();
 module.exports = async (fundName, data) => {
    const params = {
          TableName: 'CHARITY_FUND_DATA',
          Key: {
               "fundraising_name" : fundName,
          }, ExpressionAttributeNames : {
               "#current": "fundraising_donors"
          },
          UpdateExpression: "set #current[9999] = :attrValue",
  ExpressionAttributeValues: {
    ":attrValue": `${data}`
         }    
    };
    const request = docClient.update(params);
    const result = await request.promise();
     return result;
  }; 