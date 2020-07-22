// Function to handle the Messages //

const callSendAPI = require("./callSendAPI"),
updateCheck = require("../database/updateCheck"),
sendEmail = require("../other/mailServer"),
getCharity = require("../other/get_charity"),
updateState = require("../database/update_state");

module.exports = async (sender_psid, webhook_event, application) => {
  
  
check = await updateCheck(sender_psid);
general_state = check.Item.general_state.S;



//general_state = check[5];
state = await senderEffect(sender_psid, app, "mark_seen");
state = await senderEffect(sender_psid, app, "typing_on");


let received_message = webhook_event.message;


if (webhook_event === "BACK"){
  await updateState(sender_psid,"general_state", "user is back to bot")
  response = { "text":"You are back to the Bot."};
  action = null;
  state = await callSendAPI(sender_psid, response, action, "first");
  userMenu(sender_psid);
} else if(webhook_event === "AGREED"){
  response = { 
  "text":  "Thanks for subscribing!\nWe will Notify you in the Future.\nPlease don't forget to subscribe again after each Notification",  
  "quick_replies":[
    {
      "content_type":"text",
      "title":"Go Back",
      "payload":"MENU"
    }
  ]
}
action = null;
state = await callSendAPI(sender_psid, response, action, "first");
} 

else if(general_state === "user searching charities"){
  response = {
    "text": "Please enter the city for the orgnization.\nEx: New York, Brooklyn, Miami,..", 
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Back to Main Menu",
        "payload":"MENU"
      }]
    }
    action = null;
    await callSendAPI(sender_psid, response, action, "first");
  t = await(updateState(sender_psid,"search_name", received_message.text))
  t = await(updateState(sender_psid,"general_state", "user entering city for search"))
}

else if(general_state === "user entering city for search"){
  response = {
    "text": "Please enter Two Capital Abbreviations letters for the State.\nEX: NY , CA , NJ,...", 
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Back to Main Menu",
        "payload":"MENU"
      }]
    }
    action = null;
    await callSendAPI(sender_psid, response, action, "first");
  t = await(updateState(sender_psid,"search_city", received_message.text))
  t = await(updateState(sender_psid,"general_state", "user entering state for search"))
}

else if(general_state === "user entering state for search"){
  if(received_message.text.length>2){
    response ={"text":"Please enter only two abbreviation letters.\nEX: NY , CA , NJ,..."}
    action = null;
    await callSendAPI(sender_psid, response, action, "first");
  }else{
    st = received_message.text.toUpperCase();
    dat = await getCharity(check.Item.search_name.S,check.Item.search_city.S,st);
  if(dat.data.length >0){
  response = {"text": "Here are what we found:"};
  action = null;
  await callSendAPI(sender_psid, response, action, "first");

  elements = [];

  for(i = 0 ; i < dat.data.length ; ++i){
    title = `${dat.data[i].charityName}`;
    uri = `${process.env.URL}redirect?lk=${dat.data[i].url}`;
    abstract = `${dat.data[i].city}, ${dat.data[i].state}, ${dat.data[i].zipCode}\n${dat.data[i].category}\n${dat.data[i].missionStatement}`;
    elements[elements.length]={"title": title , "subtitle":abstract, "default_action": {"type": "web_url","url": `${uri}`,"messenger_extensions": "false","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":`${process.env.URL}fund?name=${dat.data[i].charityName}&ein=${dat.data[i].ein}&cat=${dat.data[i].category}&address=${dat.data[i].city}, ${dat.data[i].state} ${dat.data[i].zipCode}`,"title":"Start Fundraising"},{"type":"web_url","url":`${process.env.URL}redirect?lk=${dat.data[i].url}`,"title":"Info Page"},{"type":"web_url","url":`${process.env.URL}map?longitude=${dat.data[i].longitude}&latitude=${dat.data[i].latitude}`,"title":"Show on Map"}]}
    if (i  == 9){
      i = dat.data.length;
    }
  }
  
  response = { 
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements": elements
      }
    }
}
action = null;
await callSendAPI(sender_psid, response, action, "first");
await sleep(500);

  response = {
    "text": "You can visit the website, donate link, or go back to the main menu.", 
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Go Back",
        "payload":"MENU"
      }]
    }
    action = null;
    await callSendAPI(sender_psid, response, action, "first");
    t = await(updateState(sender_psid,"general_state", "user viewing results."))
  } else{
    response = {
      "text": "Sorry, we didn't find any matches!!", 
      "quick_replies":[
        {
          "content_type":"text",
          "title":"Go Back",
          "payload":"MENU"
        }]
      }
          action = null;
    await callSendAPI(sender_psid, response, action, "first");
    t = await(updateState(sender_psid,"general_state", "user finished results."))
  }
}}


else if(general_state === "Admin process send email"){
  response = {
    "text": "What is the body of the email?", 
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Back to Users",
        "payload":"SEARCH_USERS"
      }]
    }
    action = null;
    await callSendAPI(sender_psid, response, action, "first");
  t = await(updateState(sender_psid,"emailing_subject", received_message.text))
  t = await(updateState(sender_psid,"general_state", "Admin process send email step 2"))

} else if(general_state === "Admin process send email step 2"){
  response = {
    "text": "We are sending the email.", 
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Back to Users",
        "payload":"SEARCH_USERS"
      }]
    }
  action = null;
  await callSendAPI(sender_psid, response, action, "first");
  t = await(updateState(sender_psid,"general_state", "Admin sent email"))
  sendEmail.sendNotification(check.Item.emailing_email.S,check.Item.emailing_subject.S,received_message.text)
}


else if (received_message.text) {
  var text = received_message.text.trim().toLowerCase();
response = {"text":`Sorry, we can't understand '${received_message.text}' now!!\nPlease use the menu instead, sorry for any inconvienience.`}
action = null;
callSendAPI(sender_psid, response, action, "first")
  
} 

/////////////////////////////////////////////////////////

 ////////////////////////////////////////////////////////
     // Funtion for the user Menu //
     function userMenu(sender_psid) {
      response = {
        "text": "This is our main menu:", 
        "quick_replies":[
          {
            "content_type":"text",
            "title":"Amazon Login",
            "payload":"Amazon_login"
          }, {
            "content_type":"text",
            "title":"Donate",
            "payload":"DONATE"
          }, {
            "content_type":"text",
            "title":"Events",
            "payload":"SEARCH_EVENTS"
          }, {
            "content_type":"text",
            "title":"Fundraisings",
            "payload":"SEARCH_FUNDRAISINGS"
          }, {
            "content_type":"text",
            "title":"Charities",
            "payload":"SEARCH_CHARITIES"
          }, {
            "content_type":"text",
            "title":"Notify Me",
            "payload":"NOTIFY"
          }, {
            "content_type":"text",
            "title":"Customer Serivce",
            "payload":"CUSTOMER_SERVICE"
          }
        ]
        }
      action = null;
      callSendAPI(sender_psid, response, action, "first")
    }
  // Sleep Funtion to put the App to wait before replying //
  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  // Function to send Sender Effects //
  async function senderEffect(sender_psid, app, action_needed){
    try{
      response = null;
      action = action_needed;
      state = await callSendAPI(sender_psid, response, action, app);   
    }
    catch(e){
      throw (e);
    }
    return state;
  }

}