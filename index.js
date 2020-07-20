const express = require('express'),
bodyParser = require('body-parser'),
path = require("path"),
md5 = require("md5"),
fs = require("fs"),
session = require('express-session'),
sendEmail = require("./local_modules/other/mailServer"),
geo_coder = require('./local_modules/other/geocoder'),
getCharity = require("./local_modules/other/get_charity"),
createUsersTable = require("./local_modules/database/create_users_table"),
createDataTable = require("./local_modules/database/create_data_table"),
createWebTable = require("./local_modules/database/create_web_table"),
updateWebUser = require("./local_modules/database/update_web_user"),
getWebUser = require("./local_modules/database/get_web_user_data"),
getAllUsers = require("./local_modules/database/get_all_users"),
createWebUser = require("./local_modules/database/create_web_user"),
getAllWebEmails = require("./local_modules/database/get_all_web_emails"),
Auth = require("./local_modules/database/auth"),
addEvent = require("./local_modules/database/add_event"),
getEvents = require("./local_modules/database/get_events"),
getAllEvents = require("./local_modules/database/get_all_events");

// updateState = require("./local_modules/database/update_state"),
// exists = require("./local_modules/database/check_data"),
// getAllKey = require("./local_modules/database/get_all_keys"),

// mSetup = require("./local_modules/messenger/m_setUp"),
// whiteList = require("./local_modules/messenger/white_list"),
// callSendAPI = require("./local_modules/messenger/callSendAPI"),
// inboxLog = require("./local_modules/messenger/inbox_log"),
// botLog = require("./local_modules/messenger/bot_log"),
// firstMessages = require("./local_modules/messenger/first_handle_messages"),
// firstPostbacks = require("./local_modules/messenger/first_handle_postbacks"),
// takeControl = require("./local_modules/messenger/take_thread");

// Functions to Whitelist the domain and update the Messenger Webhook callback URL.
// whiteList();
// mSetup();

// Function to create the Database Tables if does not exist.
// Table for Messenger Users
createUsersTable();
// Data Table for Website and Messenger.
createDataTable();
// Users Table for Website.
createWebTable();

// Creating the App object in express.
app = express();

// Using Express Session for user login.
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

// Extent URL encoding function to read queries.
app.use(bodyParser.urlencoded({extended : true}));
// Using body parser to read the Requst Body from the webhook.
app.use(bodyParser.json());
// Setting Views & Public folders and using EJS engine for rendering
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// When Any one try to access the main domain page. This routes for the main page of the Application.
app.get(`/`, async function(request, response) {
  // If the user is coming from Facebook Messenger and using Messenger Lite for IOS.
  if (request.headers['user-agent'] && request.headers['user-agent'].includes("FBAN/MessengerLiteForiOS")){
    // Check if we already have the user email.
    check = await exists(request.query.s,"email");
    // If the user added his email, will pass a variable to hide the POST button.
    if(check == true){
      f_s = "none";
      p_a = "Thank you for adding your information!"
    } else{
      // If the user email does not exists, will pass a variable to show the POST button.
      f_s = "full";
      p_a = "Please click on the button below to link you Amazon account."
    }
    // Send Login Page for IOS Messenger Users with the assigned variables.
    response.render("IOS_index",{r_s:request.query.s, t:f_s, p:p_a});
  // If the user is visiting the index page from outside.
  } else{
    // Send Website Welcome Page.
    response.render("index");
  }
});

// Post Amazon Data for IOS users and save it in the database.
app.post('/', function (req, res) {
  // Get the Messenger Sender_PSID from the Request Query.
  s = req.query.s;
  // Get the Email from the Hidden Post Form.
  email = req.body.email;
  // If no email because of an error, send error page.
  if(email === ""){
    res.render('no_data');
  // If successful prcocess, send confirmation page.  
  } else{
    res.render('info_added');
    p_code = req.body.postalCode;
  // Default Postal Code if failed or missing.
  if (p_code === "" || p_code ==='undefined'){
    p_code = "NY 10009"
  }
  // Get the Area Deatils using GeoCoder
  geo_coder.geocode(p_code)
  .then((res)=> {
    area = res[0].formattedAddress.substring(2);
    // Send confirmation in Messenger.
    response = { "text":`Thank you for adding these informtion.\nWe added the email address: '${req.body.email}', and the area: '${area}'`};
    action = null;
    callSendAPI(s, response, action, "first");
    // Update the data in the database
    updateState(s,"email", req.body.email )
    updateState(s,"area", area )
  });
}});


// Success Page that load when the user make successful payment.
app.get(`/success`, async function(request, response) {
  // Get the cookie saved in the browser.
  ck = request.headers.cookie;
  s = "";
  // Loop to read the Messenger PSID from the cookie
  for(i = 0 ; i < ck.length ; ++i){
    if (ck[i] == 's' && ck[i + 1] =='_' && ck[i + 2] =='i'&& ck[i + 3] =='d' && ck[i + 4] =='_'){
      for(j = i+8 ; j < ck.length ; ++j){
        s += ck[j];
        if(ck[j+1] == ';'){
        j = ck.length;
        i = ck.length;
      }
        ++i;
      } 
    }
  }
  // This Messenger Receipt Template will be sent Once.
  // If the user refreshed the page, the cookie will be deleted.
  if(s !== ""){
  msg = {  
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"receipt",
        "recipient_name":"Lenda Ott",
        "order_number":request.query.orderReferenceId,
        "currency":"USD",
        "payment_method":"Amazon Account: len...@gm...",        
        "order_url":"https://49b40fcaffa9.ngrok.io/",         
        "summary":{
          "subtotal":request.query.amount,
          "total_cost":request.query.amount
        },
        "elements":[
          {
            "title":"Donation",
            "subtitle":"Thanks for your contributions!",
            "quantity":1,
            "price":request.query.amount,
            "currency":request.query.currencyCode,
            "image_url":"https://techolopia.com/wp-content/uploads/2020/07/Logo.png"
          }
        ]
      }
    }
  }
  action = null;
  callSendAPI(s, msg, action, "first")
  }
  // Sending the success page for IOS and Desktop users, and send website main page if refreshed or accessed from outside. 
  if(request.headers['user-agent'] && request.headers['user-agent'].includes("FBAN/MessengerLiteForiOS")){
    response.render("./donate/success_ios",{p_info:request.query, fb_id:s});
  } else if(request.headers.referer && (request.headers.referer.includes("https://payments.amazon.com/") || request.headers.referer.includes("https://payments-sandbox.amazon.com") || request.headers.referer.includes("https://apay-us.amazon.com/"))){
    rc=`---Charity Station Recipt---\nReceipt Number: ${request.query.orderReferenceId}\nAmazon Email: ${request.session.username}\n`;
    response.render("success",{p_info:request.query,email:request.session.username});
    t = await getWebUser(request.session.username);
    rc += `Name: ${t.Item.u_name.S}\n`
    await updateWebUser(request.session.username,"donations",t.Item.donations.L.length, request.query.amount )
    rc += `Amount: $${request.query.amount}\n`
    await updateWebUser(request.session.username,"donation_time",t.Item.donations.L.length, `${Date().substring(0,34)}` )
    rc += `Donation Time: ${Date().substring(0,34)}\n`
    await updateWebUser(request.session.username,"receipt_number",t.Item.donations.L.length, request.query.orderReferenceId)
    await updateWebUser(request.session.username,"donated_for",t.Item.donations.L.length, "general help" )
    rc += `------------------------\nThanks for your help!!`
    if (!fs.existsSync(`./rcs/${request.session.username}`)){
      fs.mkdirSync(`./rcs/${request.session.username}`);
    }
    await fs.writeFile(`./rcs/${request.session.username}/${request.query.orderReferenceId}.txt`, rc, function(err) {
      if (err) {
                return console.log(err)
                }
                console.log("The file was saved!")
        })
  }  else {
    response.render("index");
}
});

// Canceled page for IOS and Desktop users.
app.get(`/canceled`, function(request, response) {
  if(request.headers['user-agent'] && request.headers['user-agent'].includes("FBAN/MessengerLiteForiOS")){
    response.render("./donate/canceled_ios");
  } else if(request.headers.referer && (request.headers.referer.includes("https://payments.amazon.com/") || request.headers.referer.includes("https://payments-sandbox.amazon.com"))){
    response.render("./donate/canceled");
  } else {
    response.render("index");
  }
});

// Logout Page for the website.
app.get(`/logout`, function(request, response) {
  if (request.session.loggedin) {
    request.session.destroy()
    response.clearCookie('connect.sid')
    response.render("logout");
  } else {
    response.render("login");
  }
  response.end();
});

// Login with Amazon Page for the website.
app.get(`/a_login`, async function(request, response) {
  if (request.session.loggedin) {
    users = await getAllUsers();
    response.render("a_login",{t:"none", m:"You are now logged in!", users:users, view:'none', dis:'none'});
} else{
    users = await getAllUsers();
    sendData = [];
    for (i = 0 ; i < users.length ; i++){
      sendData[i] = users[i].email.S;
    }
    response.render("a_login",{t:"intial", m:"", users:users, view:'intial', dis:'full'});
  }
});

// Display Map Page for the Charities Search Results.
app.get('/map', async function(request, response) {
  if (request.session.loggedin) {
  response.render("show_map",{lo:request.query.longitude,la:request.query.latitude});
} else{
  response.render("login");
}
});

// Production Donation Custom Widget Page.
app.get(`/donate`, async function(request, response) {
  if (request.session.loggedin) {
  response.render("donate");
  } else{
    response.render("login");
  }
});

// Search Charities Page.
app.get(`/search_charity`, async function(request, response) {
  if (request.session.loggedin) {
  response.render("search_charity");
  } else{
    response.render("login");
  }
});

app.get(`/sandbox`, async function(request, response) {
  if (request.session.loggedin) {
  response.render("sand_box");
} else{
  response.render("login");
}
});

app.get(`/profile`, async function(request, response) {
  if (request.session.loggedin) {
    userData = await getWebUser(request.session.username)
    response.render("profile",{name: userData.Item.u_name.S ,donat: userData.Item.donated_for.L,donat2: userData.Item.donation_time.L, donat3: userData.Item.receipt_number.L, donat4: userData.Item.donations.L});
  } else{
    response.render("login");
  }});


app.get(`/events`, async function(request, response) {
  if (request.session.loggedin) {
    eve = await getAllEvents();
    if(request.session.username === "test@dummy.fun"){
      response.render("events",{dis:"full",data:eve});
    } else{
      response.render("events",{dis:"none",data:eve});
    }
  } else{
    response.render("login");
  }});

  app.get(`/add_event`, async function(request, response) {
    if (request.session.loggedin) {
      if(request.session.username === "test@dummy.fun"){
        response.render("add_event");
      } else{
        response.send("Why are you trying to access from here??");
      }
    } else{
      response.render("login");
    }});


app.post(`/add_event`, async function(request, response) {
  if (request.session.loggedin && request.session.username === "test@dummy.fun") {
    await addEvent(request.body.name, request.body.category, request.body.location, request.body.dates, request.body.info, request.body.image);
    response.redirect(`/event?page=${request.body.name}`)
    emails = await getAllWebEmails();
    for(i = 0 ; i < emails.length ; ++i){
      text ="";
      text += `Hi ${emails[i].u_name.S},\n\nThe following event just added! Please visit the link and share with your friends.\n\nEvent Name: ${request.body.name}\nEvent Link: ${process.env.URL}event?page=${request.body.name}\n\nThank you,\nCharity Station`
      sendEmail.sendNotification(emails[i].email.S,`New Event (${request.body.name}) is here!!`,text)
    }} else {
      response.render("index");
    }
});

app.get(`/event`, async function(request, response) {
  d = await getEvents(request.query.page);
  response.render('event',{name:d.Item.event_name.S, category:d.Item.event_category.S, location:d.Item.event_location.S, dates:d.Item.event_dates.S, info:d.Item.event_info.S, link:d.Item.event_image.S})
});

app.get(`/fundraisings`, async function(request, response) {
  if (request.session.loggedin) {
    response.render("fundraisings");
  } else{
    response.render("login");
  }
});

app.post(`/search_charity`, async function(request, response) {
  dat = await getCharity(request.body.name,request.body.city,request.body.state.toUpperCase());
  response.render("search_charity_results", { model: dat.data });

});

app.post(`/auth`, async function(request, response) {
  pass = md5(request.body.password);
  email = request.body.username.toLowerCase();
t = await Auth(email, pass);
if(t == true){
  request.session.loggedin = true;
  request.session.username = request.body.username;
  response.render("log")
} else {
  response.render("wrong_password")
}
});

app.get('/download', async function(request, response){
  response.download(`./rcs/${request.session.username}/${request.query.no}.txt`, `${request.query.no}.txt`);
});

app.post(`/a_login`, async function(request, response) {
  if(request.body.password && request.body.email && request.body.email.length > 1){
email = request.body.email.toLowerCase();
password = md5(request.body.password);
request.session.loggedin = true;
request.session.username = email;
response.render("confirm",{name:request.body.name});

if (request.body.postalCode === "" || request.body.postalCode ==='undefined'){
  p_code = "NY 10009"
} else{
  p_code = request.body.postalCode;
}

geo_coder.geocode(p_code)
.then((res)=> {
  area = res[0].formattedAddress.substring(2);
  // Update the data in the database
  createWebUser(email,password,request.body.name,area);
});
  } 
else if(request.body.name && request.body.email ){
  users = await getAllUsers();
  request.session.loggedin = true;
request.session.username = request.body.email;
  response.render("a_login",{t:"none", m:"You are now logged in!", users:users, view:'none', dis:'none'});
}else{
  response.render("a_login",{t:"none", m:"You are not logged in with the sandBox Account!", users:users, view:'none', dis:'none'});
}
});


app.post(`/s_login`, async function(request, response) {
  if(request.body.password && request.body.email && request.body.email.length > 1){
email = request.body.email;
password = md5(request.body.password);
request.session.loggedin = true;
request.session.username = email;
response.render("confirm",{name:request.body.name});

if (request.body.postalCode === "" || request.body.postalCode ==='undefined'){
  p_code = "NY 10009"
} else{
  p_code = request.body.postalCode;
}

geo_coder.geocode(p_code)
.then((res)=> {
  area = res[0].formattedAddress.substring(2);
  // Update the data in the database
  createWebUser(email,password,request.body.name,area);
});
  } 
else if(request.body.name && request.body.email ){
  users = await getAllUsers();
  request.session.loggedin = true;
  request.session.username = request.body.email;
  response.render("s_login",{t:"none", m:"You are now logged in!", users:users, view:'none', dis:'none'});
}else{
  response.render("s_login",{t:"none", m:"You are not logged in with your Amazon Account!", users:users, view:'intial', dis:'none'});
}
});

app.get("/fund", (req, res) => {
  res.render("start_Fund", { name: req.query.name });
});

app.get("/s_login", async (request, response) => {
  if (request.session.loggedin) {
    users = await getAllUsers();
    response.render("s_login",{t:"none", m:"You are now logged in!", users:users, view:'none', dis:'none'});
} else{
    users = await getAllUsers();
    sendData = [];
    for (i = 0 ; i < users.length ; i++){
      sendData[i] = users[i].email.S;
    }
    response.render("s_login",{t:"intial", m:"", users:users, view:'intial', dis:'full'});
  }});


// This page loads when the user click Amazon Login from Messenger and he is using Desktop.
app.get(`/desktop`, async function(request, response) {
  t = await getAllKey();
  l = false;
  for(i = 0 ; i < t.length ; ++i){
    if(t[i].PSID.S === request.query.s)
    l = true;
  }
  // If Messenger user, pass resources to send the new Desktop Login Link to the user.
  if(l == true){
  response.render("desktop",{call:callSendAPI, r:request});
  } else {
    response.render("index");
  }
});

// The Desktop Users will use this page to login.
app.get(`/desk_index`,async function(request, response) {
  // Check if the user added his Amazon Email or not.
  check = await exists(request.query.s,"email");
  // If the user added his email, will pass a variable to hide the POST form.
  if(check == true){
    f_s = "none";
    p_a = "Thank you for adding your information!"
  } else{
    // If the user email does not exists, will pass a variable to show the POST form.
    f_s = "full";
    p_a = "Please click on the button below to link you Amazon account."
  }
  // Check for users coming from Messenger.
  if(request.headers.referer && (request.headers.referer.includes("https://l.messenger.com/") || request.headers.referer.includes("https://l.facebook.com/") || request.headers.referer.includes("https://payments.amazon.com/"))){
    response.render("desk_index",{r_s:request.query.s, t:f_s, p:p_a});
  } else {
    // If the user is requesting the page from somewhere else.
    response.render("index")
  }
});

// Post Amazon Data for Desktop Messenger users and save it in the database.
app.post('/desk_index', function (req, res) {
  // Get the Messenger Sender_PSID from the Request Query.
  s = req.query.s;
  // Get the Email from the Hidden Post Form.
  email = req.body.email;
  // If no email because of an error, send error page.
  if(email === ""){
    res.render('no_data');
  // If successful prcocess, send confirmation page.  
  } else{
    res.render('info_added');
    p_code = req.body.postalCode;
  // Default Postal Code if failed or missing.
  if (p_code === "" || p_code ==='undefined'){
    p_code = "NY 10009"
  }
  geo_coder.geocode(p_code)
  .then((res)=> {
    area = res[0].formattedAddress.substring(2);
    // Send confirmation in Messenger.
    response = { "text":`Thank you for adding these informtion.\nWe added the email address: '${req.body.email}', and the area: '${area}'`};
    action = null;
    callSendAPI(s, response, action, "first");
    updateState(s,"email", req.body.email )
    updateState(s,"area", area )
  });
}});

// Rendering the donation pages.
am = ["5","10","20","50","100","250","500","1000"]
app.get(`/donate/${am[0]}`, function(request, response) {
  if((request.headers.referer && (request.headers.referer.includes("https://l.messenger.com/") || request.headers.referer.includes("https://l.facebook.com/") || request.headers.referer.includes("https://payments-sandbox.amazon.com"))) || (request.headers['user-agent'] && request.headers['user-agent'].includes("FBAN/MessengerLiteForiOS"))){
    response.render(`./donate/${am[0]}`,{s_id:request.query.s});
  } else{
    response.render("index");
  }
});

app.get(`/donate/${am[1]}`, function(request, response) {
  if((request.headers.referer && (request.headers.referer.includes("https://l.messenger.com/") || request.headers.referer.includes("https://l.facebook.com/") || request.headers.referer.includes("https://payments-sandbox.amazon.com"))) || (request.headers['user-agent'] && request.headers['user-agent'].includes("FBAN/MessengerLiteForiOS"))){
    response.render(`./donate/${am[1]}`,{s_id:request.query.s});
  } else{
    response.render("index");
}
});

app.get(`/donate/${am[2]}`, function(request, response) {
  if((request.headers.referer && (request.headers.referer.includes("https://l.messenger.com/") || request.headers.referer.includes("https://l.facebook.com/") || request.headers.referer.includes("https://payments-sandbox.amazon.com"))) || (request.headers['user-agent'] && request.headers['user-agent'].includes("FBAN/MessengerLiteForiOS"))){
  response.render(`./donate/${am[2]}`,{s_id:request.query.s});
} else{
  response.render("index");
}
});

app.get(`/donate/${am[3]}`, function(request, response) {
  if((request.headers.referer && (request.headers.referer.includes("https://l.messenger.com/") || request.headers.referer.includes("https://l.facebook.com/") || request.headers.referer.includes("https://payments-sandbox.amazon.com"))) || (request.headers['user-agent'] && request.headers['user-agent'].includes("FBAN/MessengerLiteForiOS"))){
    response.render(`./donate/${am[3]}`,{s_id:request.query.s});
} else{
  response.render("index");
}
});

app.get(`/donate/${am[4]}`, function(request, response) {
  if((request.headers.referer && (request.headers.referer.includes("https://l.messenger.com/") || request.headers.referer.includes("https://l.facebook.com/") || request.headers.referer.includes("https://payments-sandbox.amazon.com"))) || (request.headers['user-agent'] && request.headers['user-agent'].includes("FBAN/MessengerLiteForiOS"))){
    response.render(`./donate/${am[4]}`,{s_id:request.query.s});
  } else{
    response.render("index");
}
});

app.get(`/donate/${am[5]}`, function(request, response) {
  if((request.headers.referer && (request.headers.referer.includes("https://l.messenger.com/") || request.headers.referer.includes("https://l.facebook.com/") || request.headers.referer.includes("https://payments-sandbox.amazon.com"))) || (request.headers['user-agent'] && request.headers['user-agent'].includes("FBAN/MessengerLiteForiOS"))){
  response.render(`./donate/${am[5]}`,{s_id:request.query.s});
} else{
  response.render("index");
}
});

app.get(`/donate/${am[6]}`, function(request, response) {
  if((request.headers.referer && (request.headers.referer.includes("https://l.messenger.com/") || request.headers.referer.includes("https://l.facebook.com/") || request.headers.referer.includes("https://payments-sandbox.amazon.com"))) || (request.headers['user-agent'] && request.headers['user-agent'].includes("FBAN/MessengerLiteForiOS"))){
  response.render(`./donate/${am[6]}`,{s_id:request.query.s});
} else{
  response.render("index");
}
});

app.get(`/donate/${am[7]}`, function(request, response) {
  if((request.headers.referer && (request.headers.referer.includes("https://l.messenger.com/") || request.headers.referer.includes("https://l.facebook.com/") || request.headers.referer.includes("https://payments-sandbox.amazon.com"))) || (request.headers['user-agent'] && request.headers['user-agent'].includes("FBAN/MessengerLiteForiOS"))){
  response.render(`./donate/${am[7]}`,{s_id:request.query.s});
} else{
  response.render("index");
}
});

// This page loads when the user click Donate from Messenger and he is using Desktop.
app.get(`/donate/desk`, async function(request, response) {
  t = await getAllKey();
  l = false;
  for(i = 0 ; i < t.length ; ++i){
    if(t[i].PSID.S === request.query.s)
    l = true;
  }
  // If Messenger user, pass resources to send the new Donate Link to the user.
  if(l == true){
  response.render("./donate/desk",{call:callSendAPI, r:request});
  } else {
    response.render("index");
  }
});

// Redirect Page for all users.
app.get(`/redirect`, function(request, response) {
  response.render("redirect",{link:request.query.lk});
});

// /////////////////////////////////////////////////////////////
// /// Webhook Endpoint For the First Facebook Messenger App ///
// /////////////////////////////////////////////////////////////
// app.post('/webhook', (req, res) => {  
//     let body = req.body;
//     // Checks this is an event from a page subscription
//     if (body.object === 'page') {
//       // Iterates over each entry - there may be multiple if batched
//       body.entry.forEach(function(entry) {
//       // Gets the body of the webhook event
//       if(entry.messaging){
//         webhook_event = entry.messaging[0];

//         // Get the sender PSID
//         let sender_psid = webhook_event.sender.id;
//         // Check if the event is Pass Thread Control and if the user is coming from the Inbox.
//         // If so, will send the user to Handle Message Function in First Bot regardless the previous Bot.
//         if(webhook_event.pass_thread_control && webhook_event.pass_thread_control.metadata){
//           if (webhook_event.pass_thread_control.metadata.includes("from Page Inbox")){
//             firstMessages(sender_psid, "BACK", app);
//         }}
        
//         // If OTN Approval, will update variables in the DB and trigger the First App to confirm.
//         if (webhook_event.optin){
//           payload = webhook_event.optin.payload;
//           PSID = webhook_event.sender.id;
//           userToken =  webhook_event.optin.one_time_notif_token;
//           update = updateState(PSID, "Notification_token", `${userToken}`);
//           firstMessages(sender_psid, "AGREED", app);
//         }
//         if(webhook_event.message && webhook_event.message.is_echo == true && webhook_event.message.text){
//           botLog(webhook_event.recipient.id , webhook_event.message.text, "bot", "Message")
//         }
//         // Check if the event is a Message or Postback or Quick Replies.
//         // Pass the event to handlePostBack function if Quick Reply or Postback.
//         // Otherwise, pass the event to handleMessage function.
//         if (sender_psid != process.env.PAGE_ID && webhook_event.message && !webhook_event.message.quick_reply) {
//           botLog(webhook_event.sender.id , webhook_event.message.text, "user", "Message")
//           firstMessages(sender_psid, webhook_event,app);  
//         } else if (sender_psid != process.env.PAGE_ID && (webhook_event.postback || (webhook_event.message && webhook_event.message.quick_reply))) {
//           if(webhook_event.postback && webhook_event.postback.payload && webhook_event.postback.payload !== "GET_STARTED"){
//           botLog(webhook_event.sender.id , webhook_event.postback.title, "user", "Postback")
//           }
//           firstPostbacks(sender_psid, webhook_event,app);
//         }
//       } else {
//         // If it is a standby event track and listen to the coversation by the secondary receivers.
//         webhook_event = entry.standby[0]; 
//         let sender_psid = webhook_event.sender.id;
//         // The case which the message is sent from the page inbox.
//         if (webhook_event.message && sender_psid == process.env.PAGE_ID){
//           if (!webhook_event.message.app_id){
//               inboxLog(webhook_event.recipient.id , webhook_event.message.text, "inbox")
//               check_message = webhook_event.message.text;
//               recipient_id = webhook_event.recipient.id;
//               // It will be easier to send a like to move the user back to the Bot is the representative is using phone.
//               if(!check_message){
//                 console.log("customer service sent like");
//                 takeControl(recipient_id);
//               }
//             }
//         }
//         // The case which the user is sending a message to any of the secondary Apps.
//         if (webhook_event.message && webhook_event.message.text && sender_psid != process.env.PAGE_ID){
//           inboxLog(sender_psid , webhook_event.message.text, "user")
//           check_message = webhook_event.message.text;
//           recipient_id = webhook_event.recipient.id;
//           // If no customer service available, the user can send a text to go back to the main Bot.
//           check_message = check_message.toLowerCase();
//           if(check_message.includes("#back to bot") || (check_message.includes("#")) && check_message.includes("back")){
//             inboxLog(sender_psid , check_message, "user")
//             takeControl(sender_psid);
//           }
//         }}
//       });
//     // Returns a '200 OK' response to all requests
//     res.status(200).send('EVENT_RECEIVED');
//     } else {
//       // Returns a '404 Not Found' if event is not from a page subscription
//       res.sendStatus(404);
//     }
//   });
  
//   // Adds support for GET requests to our webhook
//   app.get('/webhook', (req, res) => {    
//     // Parse the query params
//     let mode = req.query['hub.mode'];
//     let token = req.query['hub.verify_token'];
//     let challenge = req.query['hub.challenge'];      
//     // Checks if a token and mode is in the query string of the request
//     if (mode && token) {
//       // Checks the mode and token sent is correct
//       if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {   
//         // Responds with the challenge token from the request
//         console.log('WEBHOOK_VERIFIED');
//         res.status(200).send(challenge);  
//       } else {
//       // Responds with '403 Forbidden' if verify tokens do not match
//       res.sendStatus(403);      
//       }
//     }
//   });


  // listen for webhook events //
  app.listen(process.env.PORT || 3370, () => console.log('webhook is listening'));
