// Function to handle the Postbacks //
const callSendAPI = require("./callSendAPI"),
passThread = require("./pass_thread"),
updateCheck = require("../database/updateCheck"),
getAll = require("../database/get_all"),
updateState = require("../database/update_state"),
getAllFunds = require("../database/get_all_funds"),

fs = require("fs"),
getAllEvents = require("../database/get_all_events"),
getUserData = require("../database/get_user_data");

module.exports = async (sender_psid, webhook_event, application) => {
// Sending Mark Seen and Typing On Actions.
state = await senderEffect(sender_psid, app, "mark_seen");
state = await senderEffect(sender_psid, app, "typing_on");

// Check if the Postback is Quick Reply or Regular Postback
if (webhook_event.postback){
  payload = webhook_event.postback.payload;
  console.log(payload + " Postback Received!!");
} else{
  payload = webhook_event.message.quick_reply.payload;
  console.log(payload + " Quick_Reply Postback Received!!");
}

// Get the data for Admins and Users everytime we receive Postback
check = await updateCheck(sender_psid);



// Handling Payloads with if-else statement?
// If the payload is user start.
if (payload === 'GET_STARTED') {
    if (sender_psid === process.env.FIRST_ADMIN || sender_psid === process.env.SECOND_ADMIN){
      response = { "text":`Hi ${check.Item.first_name.S}, you are Admin of this Experience!\nYou have the following controls:\n1- You can search users, get their logs, and contact them if needed.\n2- You can send Notification to all Subscribed users.\n3- You can add events from this conversation.\n** When any events are added or Fundraising Starteted, all users on Messenger and the Website will receive Automated Notification!`};
      action = null;
      callSendAPI(sender_psid, response, action, "first")
    } else {
        response = { "text":`👋 Hi ${check.Item.first_name.S}, welcome to our Chatbot!\n** Here you can **\n🔍Find any Nonprofit in the USA, start Fundraising, and share with friends!\n👀 Browse all our current Fundraisings and Events.\n💰 Donate with your Amazon Account`};
        action = null;
        await callSendAPI(sender_psid, response, action, "first");
        response = { "text":`You need to login with Amazon Account to donate.\nYou can test the App using Sandbox Credentials.\nEmail: test@dummy.fun\nPassword: 123456\n* If you are using IOS Lite Messenger, you don't need to use Amazon Login. Just enter the credentials in the donation page, and choose (keep me signed in).\nIf you are using Desktop, you can Login with Sandbox Account.\n** Most of the Messenger Versions supports Amazon Login & Amazon Pay in the production view!!`};
        action = null;
        await callSendAPI(sender_psid, response, action, "first");
        userMenu(sender_psid);
    }
} 


// Menu Payload
else if (payload === 'MENU'){
  userMenu(sender_psid);
}



// If the user choose Notify Me
else if (payload === "NOTIFY"){
  if(!check.Item.general_state.S.includes("customer service")){
  t = await(updateState(sender_psid,"general_state", "user select notification"))
  response = {"attachment": {
    "type":"template",
    "payload": {
    "template_type":"one_time_notif_req",
    "title":"Keep Me Updated!",
    "payload":"APPROVED"
    }}}
    action = null;
    state = await callSendAPI(sender_psid, response, action, "first");
    response = {
      "text": "When you click 'Notify Me', we will send you 'One Message' in the Future when any Fundraising or Event Started.\nTo keep recieving Notification, you need to subscribe again after each Notification.", 
      "quick_replies":[
        {
          "content_type":"text",
          "title":"Go Back",
          "payload":"MENU"
        }]
    }    
    action = null;
    state = await callSendAPI(sender_psid, response, action, "inbox");
}else{
  response = { "text":"You are connected with Customer Service.\nSend (#back) to go back."};
  action = null;
  state = await callSendAPI(sender_psid, response, action, "inbox");
}}



// If the user choose Customer Service
else if (payload === 'CUSTOMER_SERVICE'){
  if(!check.Item.general_state.S.includes("customer service")){
  t = await(updateState(sender_psid,"general_state", "User customer service"))
  // If not already connected  
    t = await passThread(sender_psid, 'inbox');   
    // Sending instructions and a way to go back.
    response = { "text":`Hi ${check.Item.first_name.S}, you are now in the page Inbox.\nYou cannot cocmunicate with the Bot anymore.`};
    action = null;
    state = await callSendAPI(sender_psid, response, action, "inbox");  
    response = { "text":"Someone will be with you shortly..."};
    action = null;
    state = await callSendAPI(sender_psid, response, action, "inbox");
    response = { "text":"If you want to go back to the Bot at anytime, please type (#back)."};
    action = null;
    state = await callSendAPI(sender_psid, response, action, "inbox");
} else{
    response = { "text":"You are already connected with Customer Service.\nSend (#back) to go back."};
    action = null;
    state = await callSendAPI(sender_psid, response, action, "inbox");
}}



// If the user is searching Charities.
else if (payload === 'SEARCH_CHARITIES'){
  if(!check.Item.general_state.S.includes("customer service")){
    t = await(updateState(sender_psid,"general_state", "user searching charities"))
    response = {"text" : "You can search Non-Profit Orgnizations in the USA, find their Information, and Start a Fundraising on our Platform!!"}
    action = null;
    await callSendAPI(sender_psid, response, action, "first");
    response = {
      "text": "To start, please enter Name or Keyword for the orgnization.\nEX: Youth, Orphan, Senior, Atlas,...", 
      "quick_replies":[
        {
          "content_type":"text",
          "title":"Go Back",
          "payload":"MENU"
        }]
      }
    action = null;
    await callSendAPI(sender_psid, response, action, "first");
  }else{
    response = { "text":"You are connected with Customer Service.\nSend (#back) to go back."};
    action = null;
    state = await callSendAPI(sender_psid, response, action, "inbox");
}}


// If the user is searching Events.
else if (payload === 'SEARCH_EVENTS'){
  if(!check.Item.general_state.S.includes("customer service")){
    eve = await getAllEvents();
    
  elements = [];

  for(i = 0 ; i < eve.length ; ++i){
    title = `${eve[i].event_name.S}`;
    uri = `${process.env.URL}event?name=${eve[i].event_name.S}`;
    abstract = `${eve[i].event_category.S}, ${eve[i].event_info.S},\n${eve[i].event_location.S}, ${eve[i].event_dates.S}`;
    elements[elements.length]={"title": title , "image_url":`${process.env.URL}S_Logo.png`,  "subtitle":abstract, "default_action": {"type": "web_url","url": `${process.env.URL}event?name=${eve[i].event_name.S}`,"messenger_extensions": "false","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":`${process.env.URL}event?name=${eve[i].event_name.S}`,"title":"Event Page"}]}
    if (i  == 9){
      i = eve.length;
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
  t = await(updateState(sender_psid,"general_state", "User search Events"))
  msg = {
    "text": "These are the most popular events.", 
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Go Back",
        "payload":`MENU`
      }]
    }
    action = null;
    callSendAPI(sender_psid, msg, action, "first")
}else{
  response = { "text":"You are connected with Customer Service.\nSend (#back) to go back."};
  action = null;
  state = await callSendAPI(sender_psid, response, action, "inbox");
}}



// If the user is Login with Amazon.
else if (payload === 'Amazon_login'){
  if(!check.Item.general_state.S.includes("customer service")){
  t = await(updateState(sender_psid,"general_state", "User amazon login"))
  response = { 
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text":"Please click on the link below to Login with your Amazon Account.\nIf you are using Desktop, another links (Production & Sanbox) will appear after you click this button.",
        "buttons":[
          {
            "type":"web_url",
            "url":`${process.env.URL}?s=${sender_psid}`,
            "title":"Amazon Login",
            "webview_height_ratio": "full",
            "messenger_extensions": "true",
            "fallback_url": `${process.env.URL}desktop?s=${sender_psid}`
          }
        ]
      }
    }
  }    
  action = null;
  await callSendAPI(sender_psid, response, action, "first")
  msg = {
    "text": "Do you want to go back?", 
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Go Back",
        "payload":`MENU`
      }]
    }
    action = null;
    callSendAPI(sender_psid, msg, action, "first")
} else{
  response = { "text":"You are connected with Customer Service.\nSend (#back) to go back."};
  action = null;
  state = await callSendAPI(sender_psid, response, action, "inbox");
}}


// If the user is Donating.
else if (payload === 'DONATE'){
  if(!check.Item.general_state.S.includes("customer service")){
  t = await(updateState(sender_psid,"general_state", "User donate"))
  response = { 
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text":"Thanks for your kind heart. Please click on the button below to Donate.",
        "buttons":[
          {
            "type":"web_url",
            "url":`${process.env.URL}donate?name=General Donation&s=${sender_psid}`,
            "title":"Donate with Amazon",
            "webview_height_ratio": "full"
          }, {
            "type":"web_url",
            "url":`${process.env.URL}sandbox?name=General Donation&s=${sender_psid}`,
            "title":"Sandbox Donation",
            "webview_height_ratio": "full"
          }
        ]
      }
    }
  }    
  action = null;
  await callSendAPI(sender_psid, response, action, "first")
  msg = {
    "text": "Do you want to go back?", 
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Go Back",
        "payload":`MENU`
      }]
    }
    action = null;
    callSendAPI(sender_psid, msg, action, "first")
} else{
  response = { "text":"You are connected with Customer Service.\nSend (#back) to go back."};
  action = null;
  state = await callSendAPI(sender_psid, response, action, "inbox");
}}

// If the user is searching Fundraisings.
else if (payload === 'SEARCH_FUNDRAISINGS'){
  if(!check.Item.general_state.S.includes("customer service")){
  t = await(updateState(sender_psid,"general_state", "Admin Search Fundraisings"))
  
  eve = await getAllFunds();
  elements = [];



  for(i = 0 ; i < eve.length ; ++i){
    if(eve[i].fundraising_image.S.includes("https://")){
      im = eve[i].fundraising_image.S;
    } else{
      im = `${process.env.URL}S_Logo.png`
    }
    title = `${eve[i].fundraising_name.S}`;
    uri = `${process.env.URL}fund_display?page=${eve[i].fundraising_name.S}`;
    abstract = `${eve[i].fundraising_tagline.S}\nOrg Name: ${eve[i].org_name.S},\n Started by: ${eve[i].fundraising_start.S}, Ask for: ${eve[i].fundraising_limit.S}, Current: ${eve[i].fundraising_current_limit.S}`;
    elements[elements.length]={"title": title , "image_url":`${im}`,  "subtitle":abstract, "default_action": {"type": "web_url","url": `${process.env.URL}fund_display?page=${eve[i].fundraising_name.S}`,"messenger_extensions": "false","webview_height_ratio": "full"},"buttons":[{"type":"web_url","url":`${process.env.URL}fund_display?page=${eve[i].fundraising_name.S}`,"title":"Fundraising Page"},{"type":"web_url","url":`${process.env.URL}donate?name=${eve[i].fundraising_name.S}&s=${sender_psid}`,"title":"Donate with Amazon"},{"type":"web_url","url":`${process.env.URL}sandbox?name=${eve[i].fundraising_name.S}&s=${sender_psid}`,"title":"Sandbox Donation"}]}
    if (i  == 9){
      i = eve.length;
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
msg = {
  "text": "Do you want to go back?", 
  "quick_replies":[
    {
      "content_type":"text",
      "title":"Go Back",
      "payload":`MENU`
    }]
  }
  action = null;
  callSendAPI(sender_psid, msg, action, "first")

  }else{
    response = { "text":"You are connected with Customer Service.\nSend (#back) to go back."};
    action = null;
    state = await callSendAPI(sender_psid, response, action, "inbox");
}}


else if (payload === 'ADD_EVENT'){
  t = await(updateState(sender_psid,"general_state", "Admin Adding Event"))
  response = { 
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text":"You can add events from the link below.",
        "buttons":[
          {
            "type":"web_url",
            "url":`${process.env.URL}add_event`,
            "title":"Add Event",
            "webview_height_ratio": "full"
          }
        ]
      }
    }
  }    
  action = null;
  await callSendAPI(sender_psid, response, action, "first")
}


else if (payload === 'SEARCH_USERS'){
        quick_replies = [];
        quick_replies[quick_replies.length] = {"content_type":"text","title":`List All`,"payload":`LIST_ALL_USERS`};
        quick_replies[quick_replies.length] = {"content_type":"text","title":`Search By Name`,"payload":`LIST_ALL_USERS`};
        quick_replies[quick_replies.length] = {"content_type":"text","title":`Go Back`,"payload":`ADMIN_MENU`};
        response = {
          "text": "Do you want to search or list all!!", 
          "quick_replies":quick_replies
        }
        action = null;
        await callSendAPI(sender_psid, response, action, "first");
        }
    
    else if (payload === 'LIST_ALL_USERS'){
      t = await(updateState(sender_psid,"general_state", "Admin search users"))
      t = await getAll();
      quick_replies = [];
      if (t.length > 1){
      for(i=0; i<t.length; ++i){
        PSID = t[i].PSID.S
        if(PSID !== process.env.FIRST_ADMIN){
        name = t[i].first_name.S + " " +t[i].last_name.S;
        quick_replies[quick_replies.length] = {"content_type":"text","title":`${name}`,"payload":`VIEW_USER_${PSID}`};
      }}
      quick_replies[quick_replies.length] = {"content_type":"text","title":`Go Back`,"payload":`SEARCH_USERS`,"content_type":"text"};
      response = {
        "text": "We have the following users:", 
        "quick_replies":quick_replies
      }
      action = null;
        await callSendAPI(sender_psid, response, action, "first");
    } else{
      quick_replies[quick_replies.length] = {"content_type":"text","title":`Go Back`,"payload":`SEARCH_USERS`};
      response = {
        "text": "There is no users yet!!", 
        "quick_replies":quick_replies
      }
      action = null;
      await callSendAPI(sender_psid, response, action, "first");
    }
}


else if (payload.includes('VIEW_USER')){
  t = await(updateState(sender_psid,"general_state", "Admin view user"))
  PSID = payload.substring(10);
  user_data = await getUserData(PSID);
  if(user_data.Item.Notification_token.S === ""){
    n_status = "Neutral";
  } else{
    n_status = "Subscribed";
  }
    response = {
      "attachment":{
        "type":"image", 
        "payload":{
          "url":`${user_data.Item.profile_pic_url.S}`, 
          "is_reusable":false
        }
      }}
      action = null;
      await callSendAPI(sender_psid, response, action, "first");
      s = "";
      for(i = 1 ; i < user_data.Item.donations.L.length ; i++){
        s += `${user_data.Item.donations.L[0].S} `;
        if(i != user_data.Item.donations.L.length - 1){
          s += ", ";
        }
      }
      quick_replies =[];

      quick_replies[quick_replies.length] = {"content_type":"text","title":`Go Back`,"payload":`SEARCH_USERS`,"content_type":"text"};
      quick_replies[quick_replies.length] = {"content_type":"text","title":`Contact ${user_data.Item.first_name.S}`,"payload":`CONTACT_${PSID}`};
      quick_replies[quick_replies.length] = {"content_type":"text","title":`${user_data.Item.first_name.S} Logs`,"payload":`LOGS_${PSID}`};
      
      response = {
        "text": `Name: ${user_data.Item.first_name.S} ${user_data.Item.last_name.S}\nLocation: ${user_data.Item.area.S}\nEmail: ${user_data.Item.email.S}\nNotification Status: ${n_status}\nDonations: ${s}`, 
        "quick_replies":quick_replies
        }
        
      action = null;
        await callSendAPI(sender_psid, response, action, "first");
    }

    if (!fs.existsSync(`./files/${sender_psid}`)){
      fs.mkdirSync(`./files/${sender_psid}`);
    }
    

    else if (payload.includes("LOGS_")){
      PSID = payload.substring(5);
      user_data = await getUserData(PSID); 
      var botLog ="";
      var inboxLog = "";
      for ( i = 0 ; i < user_data.Item.bot_msg.L.length ; ++i){
        botLog += user_data.Item.bot_msg.L[i].S;
        botLog += "\n"
      }

      if (!fs.existsSync(`./files/${sender_psid}`)){
        fs.mkdirSync(`./files/${sender_psid}`);
      }

      for ( i = 0 ; i < user_data.Item.inbox_msg.L.length ; ++i){
        inboxLog += user_data.Item.inbox_msg.L[i].S;
        inboxLog += "\n"
      }


      state = await fs.writeFile(`./files/${sender_psid}/bot_log.txt`, botLog, function(err) {
        if (err) {
                  return console.log(err)
                  }
                  console.log("The file was saved!")
          })

          state = await fs.writeFile(`./files/${sender_psid}/inbox_log.txt`, inboxLog, function(err) {
            if (err) {
                      return console.log(err)
                      }
                      console.log("The file was saved!")
              })

              await sleep(800);

              fileN= `./files/${sender_psid}/bot_log.txt`
              response = null;
              action = null;
              await callSendAPI(sender_psid, response, action, "first", fileN);

              fileN= `./files/${sender_psid}/inbox_log.txt`
              response = null;
              action = null;
              await callSendAPI(sender_psid, response, action, "first", fileN);

              quick_replies =[];

              quick_replies[quick_replies.length] = {"content_type":"text","title":`Back to User`,"payload":`VIEW_USER_${PSID}`};
              quick_replies[quick_replies.length] = {"content_type":"text","title":`Contact ${user_data.Item.first_name.S}`,"payload":`CONTACT_${PSID}`};

              response = {
                "text": "You got the logs, what you want to do now?:", 
                "quick_replies":quick_replies
                }
                
              action = null;
              await callSendAPI(sender_psid, response, action, "first");
   
   
              }

    else if (payload.includes('CONTACT')){
      t = await(updateState(sender_psid,"general_state", "Admin contact user"))
      PSID = payload.substring(8);
      user_data = await getUserData(PSID);
      quick_replies=[];
      if(user_data.Item.email.S){
        quick_replies[quick_replies.length] = {"content_type":"text","title":`Email ${user_data.Item.first_name.S}`,"payload":`EMAIL_USER_${PSID}`};
      }
      if(user_data.Item.Notification_token.S){
        quick_replies[quick_replies.length] = {"content_type":"text","title":`OTN (Text) ${user_data.Item.first_name.S}`,"payload":`USER_OTN_TEXT_${PSID}`};
        quick_replies[quick_replies.length] = {"content_type":"text","title":`OTN (Template) ${user_data.Item.first_name.S}`,"payload":`USER_OTN_TEMPLATE_${PSID}`};
      }
      quick_replies[quick_replies.length] = {"content_type":"text","title":`Message ${user_data.Item.first_name.S}`,"payload":`SEND_REGULAR_MESSAGE_${PSID}`};
      quick_replies[quick_replies.length] = {"content_type":"text","title":`Back to user`,"payload":`VIEW_USER_${PSID}`};
      response = {"text": `You can contact the user using the following methods:`, 
      "quick_replies":quick_replies}
      action = null;
      await callSendAPI(sender_psid, response, action, "first");
    }


    else if (payload.includes('EMAIL_USER')){
      PSID = payload.substring(11)
      user_data = await getUserData(PSID);
      t = await(updateState(sender_psid,"emailing_email", user_data.Item.email.S))
      response = {
        "text": "Please enter the subject email:", 
        "quick_replies":[
          {
            "content_type":"text",
            "title":"Go Back",
            "payload":`VIEW_USER_${PSID}`
          }]
        }
      action = null;
        await callSendAPI(sender_psid, response, action, "first");
      t = await(updateState(sender_psid,"general_state", "Admin process send email"))
    }

else if (payload === 'NOTIFY_USERS'){
  t = await(updateState(sender_psid,"general_state", "Admin Notifying"))
  response = {
    "text": "How do you want to notify the users:", 
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Messenger Text",
        "payload":"MENU"
      },
      {
        "content_type":"text",
        "title":"Messenger Template",
        "payload":"MENU"
      },
      {
        "content_type":"text",
        "title":"Email",
        "payload":"MENU"
      },
      {
        "content_type":"text",
        "title":"back",
        "payload":"MENU"
      }]
    }
  action = null;
    await callSendAPI(sender_psid, response, action, "first");
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

    // Sleep Funtion to put the App to wait before replying //
    function sleep(ms) {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    }

}