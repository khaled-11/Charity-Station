// Function to get all the Fundraisings in the Database //
const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
module.exports = async () => {
    const params = {
        TableName: 'CHARITY_FUND_DATA',
        ProjectionExpression: 'fundraising_name, fundraising_image ,fundraising_limit, fundraising_current_limit, fundraising_donors, fundraising_start, fundraising_tagline, org_address, org_cat, org_ein, org_name'
      };
      
    const request = ddb.scan(params);
        const data = await request.promise();
            // in case no blocks are found return undefined
            return data.Items;
          };
