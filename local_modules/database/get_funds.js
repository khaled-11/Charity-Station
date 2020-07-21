// Function to get a specific Fundraising from the Database //
const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
module.exports = async fund_name => {
  var data;
  try{
    const params = {
      TableName: 'CHARITY_FUND_DATA',
      Key: {
        'fundraising_name': {S: fund_name}
      },
      ProjectionExpression: 'fundraising_name, fundraising_image ,fundraising_limit, fundraising_current_limit, fundraising_donors, fundraising_start, fundraising_tagline, org_address, org_cat, org_ein, org_name'
    };
    
  const request = ddb.getItem(params);
  data = await request.promise();

  } catch(e){
      throw(e);
  }
    // in case no blocks are found return undefined
    return data;
  };
