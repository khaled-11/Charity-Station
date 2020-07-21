//////////////////////////////////////////////////////////////
////      Create Fundraisings and Events Data Tables      ////
//////////////////////////////////////////////////////////////
const AWS = require("aws-sdk");
// Update the AWS Region.
AWS.config.update({region: 'us-east-1'});

module.exports = async () => {
  try {
  var ddb = new AWS.DynamoDB();
  var params = {
    AttributeDefinitions: [
      {
        AttributeName: 'event_name',
        AttributeType: 'S'
      }
    ],
    KeySchema: [
      {
        AttributeName: 'event_name',
        KeyType: 'HASH'
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    },
    TableName: 'CHARITY_EVENT_DATA',
    StreamSpecification: {
      StreamEnabled: false
    }
  };
  // Call DynamoDB to create the table if doesn't exist.
  const request = ddb.createTable(params);
  result = await request.promise();
  console.log("Table Created!");
  } catch (e){
    console.log("Table Exists!");
  }
  // The Fundraising Table //
  try {
    var ddb = new AWS.DynamoDB();
    var params = {
      AttributeDefinitions: [
        {
          AttributeName: 'fundraising_name',
          AttributeType: 'S'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'fundraising_name',
          KeyType: 'HASH'
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      },
      TableName: 'CHARITY_FUND_DATA',
      StreamSpecification: {
        StreamEnabled: false
      }
    };
    // Call DynamoDB to create the table if doesn't exist.
      const request = ddb.createTable(params);
      result = await request.promise();
      console.log("Table Created!");
      } catch (e){
        console.log("Table Exists!");
      }
  return;
};