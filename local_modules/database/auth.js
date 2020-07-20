const _ = require("lodash");
const AWS = require("aws-sdk");
AWS.config.update({region: 'us-east-1'});


var ddb = new AWS.DynamoDB();
module.exports = async (email, password) => {
    const params = {
        TableName: 'CHARITY_WEBSITE',
        Key: {
          'email': {S: email}
        },
        ProjectionExpression: 'password',
      };
  
    const request = ddb.getItem(params);
        const data = await request.promise();
            if(data.Item && data.Item.password.S === password)
            exists = true;
            else
            exists = false;
            return exists;
          };