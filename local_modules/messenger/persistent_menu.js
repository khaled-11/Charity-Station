/// Function to set the Messenger Persistent Menu ///
const rp = require('request-promise');

module.exports = async (sender_psid, type) => {
token = process.env.PAGE_ACCESS_TOKEN;
// Construct the message body
var request_body;
// Create a request Body.
if (type === "user"){
request_body = {
  "psid": sender_psid,
  "persistent_menu": [
    {
        "locale": "default",
        "composer_input_disabled": false,
        "call_to_actions": [
          {
            "type": "nested",
            "title": "My Account",
            "call_to_actions": [
              {
                "type": "postback",
                "title": "Amazon Login",
                "payload": "Amazon_login"
            },{
                "type": "postback",
                "title": "Donate",
                "payload": "DONATE"
            }, {
            "type": "postback",
            "title": "Notify Me",
            "payload": "NOTIFY"
        }
              ]
        }, {
            "type": "nested",
            "title": "Search",
            "call_to_actions": [
              {
                "type": "postback",
                "title": "Events",
                "payload": "SEARCH_EVENTS"
            },{
                "type": "postback",
                "title": "Fundraisings",
                "payload": "SEARCH_FUNDRAISINGS"
            },{
                "type": "postback",
                "title": "Charities",
                "payload": "SEARCH_CHARITIES"
            }
              ]
        } , {
          "type": "postback",
          "title": "Customer Service",
          "payload": "CUSTOMER_SERVICE"
      }
        ]
    }
]
}
} else{
request_body = {
  "psid": sender_psid,
  "persistent_menu": [
    {
        "locale": "default",
        "composer_input_disabled": false,
        "call_to_actions": [
            {
                "type": "postback",
                "title": "Add Event",
                "payload": "ADD_EVENT"
            }, {
              "type": "postback",
              "title": "Search Users",
              "payload": "SEARCH_USERS"
          },{
            "type": "postback",
            "title": "Notify Users",
            "payload": "NOTIFY_USERS"
        }
      ]}
  ]}
}
  // Try the request after setting up the request_body.
  try{
    var options = {
      method: 'POST',
      uri: `https://graph.facebook.com/v7.0/me/custom_user_settings?access_token=${token}`,
      body: request_body,
      json: true
    };
  state = await rp(options);
  console.log("Persistent Menu for User", sender_psid, ": " , state);
  }
  catch (e){
    console.log(e)
    console.log("User ", sender_psid, "Persistent menu has error")
  }
   return state;
}