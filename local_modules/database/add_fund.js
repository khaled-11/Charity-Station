// Function to Add Fundraisings to the Database //
const _ = require("lodash");
const AWS = require("aws-sdk");

module.exports = async (name, tagline, u_name, limit, image, org_name, org_cat, ein, address) => {
    var result;
    try{
    ddb = new AWS.DynamoDB();
    params = {
        TableName: 'CHARITY_FUND_DATA',
        Item: {
        'fundraising_name' : {"S": name},
        'fundraising_tagline' : {"S": tagline},
        'fundraising_start' : {"S": u_name},
        'fundraising_limit' : {"N": limit},
        'fundraising_current_limit' : {"N": "0"},
        'fundraising_donors' : {L:  [{"S": "donors list"}]},
        'fundraising_image' : {"S": image},
        'org_name' : {"S": org_name},
        'org_cat' : {"S": org_cat},
        'org_ein' : {"S": ein},
        'org_address' : {"S": address}
    }};
    request = ddb.putItem(params);
    result = await request.promise();
    } catch (e){
        throw e;
    }
    return result;
};
