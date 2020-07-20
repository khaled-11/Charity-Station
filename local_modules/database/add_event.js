const _ = require("lodash");
const AWS = require("aws-sdk");

module.exports = async (name, category, locatn, dates, info, image) => {
    var result;
    try{
    ddb = new AWS.DynamoDB();
    params = {
        TableName: 'CHARITY_EVENT_DATA',
        Item: {
        'event_name' : {"S": name},
        'event_category' : {"S": category},
        'event_location' : {"S": locatn},
        'event_dates' : {"S": dates},
        'event_info' : {"S": info},
        'event_image' : {"S": image}
    }};
    request = ddb.putItem(params);
    result = await request.promise();
    } catch (e){
        throw e;
    }
    return result;
};
