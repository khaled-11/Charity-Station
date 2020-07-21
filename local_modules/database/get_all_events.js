// Function to get all the events in the Database //
const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
module.exports = async () => {
    const params = {
        TableName: 'CHARITY_EVENT_DATA',
        ProjectionExpression: 'event_name, event_category, event_dates, event_location, event_info'
      };
      
    const request = ddb.scan(params);
        const data = await request.promise();
            // in case no blocks are found return undefined
            return data.Items;
          };
