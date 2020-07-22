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
OTN = require ("./local_modules/messenger/OTN"),
updateCheck = require("./local_modules/database/updateCheck"),
updateWebUser = require("./local_modules/database/update_web_user"),
updateFundDonors = require("./local_modules/database/update_fund_donors"),
updateFundLimit = require("./local_modules/database/update_fund_limit"),
getWebUser = require("./local_modules/database/get_web_user_data"),
getAllUsers = require("./local_modules/database/get_all_users"),
createWebUser = require("./local_modules/database/create_web_user"),
getAllWebEmails = require("./local_modules/database/get_all_web_emails"),
Auth = require("./local_modules/database/auth"),
addEvent = require("./local_modules/database/add_event"),
getEvents = require("./local_modules/database/get_events"),
getAllEvents = require("./local_modules/database/get_all_events"),
addFund = require("./local_modules/database/add_fund"),
getFunds = require("./local_modules/database/get_funds"),
getAllFunds = require("./local_modules/database/get_all_funds"),

updateState = require("./local_modules/database/update_state"),
exists = require("./local_modules/database/check_data"),
getAllKey = require("./local_modules/database/get_all_keys"),

//mSetup = require("./local_modules/messenger/m_setUp"),
//whiteList = require("./local_modules/messenger/white_list"),
callSendAPI = require("./local_modules/messenger/callSendAPI"),
inboxLog = require("./local_modules/messenger/inbox_log"),
botLog = require("./local_modules/messenger/bot_log"),
firstMessages = require("./local_modules/messenger/first_handle_messages"),
firstPostbacks = require("./local_modules/messenger/first_handle_postbacks"),
takeControl = require("./local_modules/messenger/take_thread");


//Functions to Whitelist the domain and update the Messenger Webhook callback URL.
//whiteList();
//mSetup();

// Function to create the Database Tables if does not exist.
// Data Table for Website and Messenger.
createDataTable();
// Users Table for Website.
createWebTable();
// Table for Messenger Users
createUsersTable();
//Adding Dummy Fundraising for the App       +
addFund("General Donation", "Testing Fundraising for the Platform", "Khaled", "10000", "https://charity-station.com/Logo.png", "Charity Station", "Software", "XX", "New York, NY");

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

///// Production Amazon Pay page with Custom Donation Widget /////
app.get(`/donate`, async function(request, response) {
  if(!request.query.s){
    s = "XXX";
  } else{
    s = request.query.s
  }
    nm = "";
    for ( i = 0 ; i < request.query.name.length ; ++i){
      if(request.query.name[i] != ' ' && request.query.name[i] != `'`){
        nm += request.query.name[i];
      }
      if (request.query.name[i] == `'`){
        nm +="%27";
      }
      if (request.query.name[i] == ' '){
        nm +="%20";
      }
    }
    response.render("donate",{name:nm,s_id:s});

});

///// Amazon SandBox Pay page with Custom Donation Widget /////
app.get(`/sandbox`, async function(request, response) {
  if(!request.query.s){
    s = "XXX";
  } else{
    s = request.query.s
  }
    nm = "";
    for ( i = 0 ; i < request.query.name.length ; ++i){
      if(request.query.name[i] != ' ' && request.query.name[i] != `'`){
        nm += request.query.name[i];
      }
      if (request.query.name[i] == `'`){
        nm +="%27";
      }
      if (request.query.name[i] == ' '){
        nm +="%20";
      }
    }
    response.render("sand_box",{name:nm,s_id:s});


});

///// Page to Display All Current Events. This page is public. /////
app.get(`/events`, async function(request, response) {
  eve = await getAllEvents();
  // Add Control For Admin(Sandbox Account)
  if(request.session.username && request.session.username === "info@techolopia.solutions"){
    response.render("events",{dis:"full",data:eve});
  } else{
    response.render("events",{dis:"none",data:eve});
  }
});

///// Page used to ask for adding event information /////
app.get(`/add_event`, async function(request, response) {
  if (request.session.loggedin || request.headers.referer) {
    if(request.session.username === "info@techolopia.solutions"){
      response.render("add_event",{exists:null});
    } else{
      response.send("Why are you trying to access from here??");
    }
  } else{
    response.render("login",{msg:"You are not logged in."});
  }
});

///// Post the Event Data, then save it in DynamoDB and send Notifications /////
app.post(`/add_event`, async function(request, response) {
if (request.session.loggedin && request.session.username === "info@techolopia.solutions") {
  t = await getEvents(request.body.name);
  if(t.Item){
    response.render("add_event",{exists:"This event already exists!!"});
  } else{
  await addEvent(request.body.name, request.body.category, request.body.location, request.body.dates, request.body.info, request.body.image);
  pName = "";
  for (i = 0 ; i < request.body.name.length ; ++i){
    if (request.body.name[i] != ' '){
    pName += `${request.body.name[i]}`;
    } else {
      pName += "%20"
    }
  }
  response.redirect(`/event?name=${pName}`)
  emails = await getAllWebEmails();
  OTN(`Hi ${emails[i].u_name.S},\n\nThe following Event was just added! Please visit the link and share with your friends.\n\nEvent Name: ${request.body.name}\nEvent Link: ${process.env.URL}event?page=${pName}\n\nThank you,\nCharity Station`)
  for(i = 0 ; i < emails.length ; ++i){
    text ="";
    text += `Hi ${emails[i].u_name.S},\n\nThe following Event was just added! Please visit the link and share with your friends.\n\nEvent Name: ${request.body.name}\nEvent Link: ${process.env.URL}event?page=${pName}\n\nThank you,\nCharity Station`
    sendEmail.sendNotification(emails[i].email.S,`New Event (${request.body.name}) is here!!`,text)
  }}} else {
    response.render("index");
  }
});

///// Template Page used to display the Events data from DynamoDB /////
app.get(`/event`, async function(request, response) {
  d = await getEvents(request.query.name);
  response.render('event',{name:d.Item.event_name.S, category:d.Item.event_category.S, location:d.Item.event_location.S, dates:d.Item.event_dates.S, info:d.Item.event_info.S, image:d.Item.event_image.S})
});

///// Page to Display All Current Fundraisings. This page is public. /////
app.get(`/fundraisings`, async function(request, response) {
eve = await getAllFunds();
response.render("fundraisings",{data:eve});
});


///// Page used to ask for adding Fundraising information /////
app.get("/fund", (req, res) => {
if (req.session.loggedin || (req.headers.referer && (req.headers.referer.includes("https://l.messenger.com/") || req.headers.referer.includes("https://l.facebook.com/")))) {
  res.render("start_fund", { exists:null, name: req.query.name, ein:req.query.ein, cat:req.query.cat, address:req.query.address });
} else{
  res.render("login", {msg:"You are not logged in."});
}
});

///// Post the Fundraising Data, then save it in DynamoDB and send Notifications /////
app.post(`/fund`, async function(request, response) {
if (request.session.loggedin) {
  nam = await getWebUser(request.session.username)
  t = await getFunds(request.body.fund_name);
  if(t.Item){
    response.render("start_fund", {exists:"This Fundraising already exists", name: request.body.fund_name, ein:request.body.ein, cat:request.body.cat, address:request.body.address});
  } else{
    await addFund(request.body.fund_name, request.body.tagline, nam.Item.u_name.S, request.body.limit, request.body.image, request.body.org_name, request.body.cat, request.body.ein, request.body.address);
    fName = "";
    for (i = 0 ; i < request.body.fund_name.length ; ++i){
      if (request.body.fund_name[i] != ' '){
      fName += `${request.body.fund_name[i]}`;
      } else {
        fName += "%20"
      }
  }
  response.redirect(`/fund_display?page=${fName}`)
  emails = await getAllWebEmails();
  OTN()
  for(i = 0 ; i < emails.length ; ++i){
    text =`Hi ${emails[i].u_name.S},\n\nThe following Fundraising was just added! Please visit the link and share with your friends.\n\nFundraising Name: ${request.body.fund_name}\nEvent Link: ${process.env.URL}fund_display?page=${fName}\n\nThank you,\nCharity Station`;
    text += `Hi ${emails[i].u_name.S},\n\nThe following Fundraising was just added! Please visit the link and share with your friends.\n\nFundraising Name: ${request.body.fund_name}\nEvent Link: ${process.env.URL}fund_display?page=${fName}\n\nThank you,\nCharity Station`
    sendEmail.sendNotification(emails[i].email.S,`New Fundraising (${request.body.fund_name}) is here!!`,text)
  }
  }} else{
  response.render("login", {msg:"You are not logged in."});
}
});

///// Template Page used to display the Fundraising data from DynamoDB /////
app.get(`/fund_display`, async function(request, response) {
d = await getFunds(request.query.page);
response.render('fund',{fundName:d.Item.fundraising_name.S,donors:d.Item.fundraising_donors.L, image:d.Item.fundraising_image.S, tagline:d.Item.fundraising_tagline.S, limit:d.Item.fundraising_limit.N, current_limit:d.Item.fundraising_current_limit.N, uName:d.Item.fundraising_start.S, orgName:d.Item.org_name.S, cat:d.Item.org_cat.S, address:d.Item.org_address.S, ein:d.Item.org_ein.S })
});

///// Page used to logout the user from the Website Auth itself /////
app.get(`/logout`, function(request, response) {
  if (request.session.loggedin) {
    request.session.destroy()
    response.clearCookie('connect.sid')
    response.render("logout");
  } else {
    response.render("login", {msg:"You are not logged in."});
  }
  response.end();
});

///// Page used to Login with Amazon Account in Production View /////
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

///// Post the Amazon Login Data for Registeration and send different views /////
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

///// Page used to display Satelite Map for any Charity Found in Search /////
app.get('/map', async function(request, response) {
  response.render("show_map",{lo:request.query.longitude,la:request.query.latitude});
});

///// Page used to search for Charities in the USA /////
app.get(`/search_charity`, async function(request, response) {
  if (request.session.loggedin) {
  response.render("search_charity");
  } else{
    response.render("login", {msg:"You are not logged in."});
  }
});

///// Post the search queries and send the Results /////
app.post(`/search_charity`, async function(request, response) {
  if (request.session.loggedin) {
  dat = await getCharity(request.body.name,request.body.city,request.body.state.toUpperCase());
  response.render("search_charity_results", { model: dat.data });
} else{
  response.render("login", {msg:"You are not logged in."});
}
});

///// Page used to display the Receipts to the user /////
app.get(`/profile`, async function(request, response) {
  if (request.session.loggedin) {
    userData = await getWebUser(request.session.username)
    response.render("profile",{name: userData.Item.u_name.S ,donat: userData.Item.donated_for.L,donat2: userData.Item.donation_time.L, donat3: userData.Item.receipt_number.L, donat4: userData.Item.donations.L});
  } else{
    response.render("login",{msg:"You are not logged in."});
  }
});

//// Page used to redirect if the user entered the password wrong first time ////
app.get(`/auth`, async function(request, response) {
  if (request.session.loggedin) {
    response.render("log")
  } else{
    response.render("login",{msg:"You are not logged in."});
  }
});

///// Page used to Login the user using the user credentials /////
app.post(`/auth`, async function(request, response) {
  pass = md5(request.body.password);
  email = request.body.username.toLowerCase();
t = await Auth(email, pass);
if(t == true){
  request.session.loggedin = true;
  request.session.username = email;
  response.redirect(request.headers.referer)
} else {
  response.render("login",{msg:"You entered a wrong password."});
}
});

///// Template Page to download the users receipts /////
app.get('/download', async function(request, response){
  response.download(`./rcs/${request.session.username}/${request.query.no}.txt`, `${request.query.no}.txt`);
});

///// Page used to login the user with Sandbox Account /////
app.get("/s_login", async (request, response) => {
  if (request.session.loggedin) {
    users = await getAllUsers();
    response.render("s_login",{t:"none", m:"You are now logged in!", users:users, view:'none', dis:'none'});
  } else if(request.session.loggedin && request.headers.referer && (request.headers.referer.includes("https://payments.amazon.com/") || request.headers.referer.includes("https://payments-sandbox.amazon.com") || request.headers.referer.includes("https://apay-us.amazon.com/") || request.headers.referer.includes("https://l.messenger.com/") || request.headers.referer.includes("https://l.facebook.com/"))){
    users = await getAllUsers();
  response.render("sandbox_messenger",{t:"none", m:"You are now logged in!", users:users, view:'none', dis:'none'});
} else if(!request.session.loggedin && request.headers.referer && (request.headers.referer.includes("https://payments.amazon.com/") || request.headers.referer.includes("https://payments-sandbox.amazon.com") || request.headers.referer.includes("https://apay-us.amazon.com/") || request.headers.referer.includes("https://l.messenger.com/") || request.headers.referer.includes("https://l.facebook.com/"))){
  users = await getAllUsers();
response.render("sandbox_messenger",{t:"intial", m:"", users:users, view:'intial', dis:'full'});
} else{
    users = await getAllUsers();
    sendData = [];
    for (i = 0 ; i < users.length ; i++){
      sendData[i] = users[i].email.S;
    }
    response.render("s_login",{t:"intial", m:"", users:users, view:'intial', dis:'full'});
  }
});

///// Post the data and send different views /////
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

/// Success Page for successful payment in any settings. ///
app.get(`/success`, async function(request, response) {
  // Get the cookie saved in the browser.
  ck = request.headers.cookie;
  
  if(request.headers.referer){
    sn = "";
  // Loop to read the Messenger PSID from the cookie
  for(i = 0 ; i < ck.length ; ++i){
    if (ck[i] == 's' && ck[i + 1] =='_' && ck[i + 2] =='i'&& ck[i + 3] =='d' && ck[i + 4] =='_'){
      for(j = i+8 ; j < ck.length ; ++j){
        sn += ck[j];
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
  if(!sn.includes("XXX")){

    check = await updateCheck(sn);  
  msg = {  
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"receipt",
        "recipient_name":`${check.Item.first_name.S}`,
        "order_number":request.query.orderReferenceId,
        "currency":"USD",
        "payment_method":`${check.Item.email.S}`,        
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
  callSendAPI(sn, msg, action, "first")
  await sleep(2000);
  msg = {
    "text": "Thanks for the donation.\nThis is your receipt.", 
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Go Back",
        "payload":`MENU`
      }]
    }
    action = null;
    callSendAPI(sn, msg, action, "first")
  }  
  s = "";
    // Loop to read the Messenger PSID from the cookie
    for(i = 0 ; i < ck.length ; ++i){
      if (ck[i] == 'd' && ck[i + 1] =='o' && ck[i + 2] =='n'&& ck[i + 3] =='a' && ck[i + 4] =='t' && ck[i + 5] =='i' && ck[i + 6] =='o'){
        for(j = i+13 ; j < ck.length ; ++j){
          s += ck[j];
          if(ck[j+1] == ';'){
          j = ck.length;
          i = ck.length;
        }
          ++i;
        } 
      }
    }
    s2="";
    for( i = 0 ; i < s.length ; ++i){
      if (s[i] == '%' && s[i+1] == '2' && s[i+2] == '0'){
        i += 2;
        s2 += ' ';
      } else if (s[i] == '%' && s[i+1] == '2' && s[i+2] == '7'){
        i += 2;
        s2 += "'";
      } else{
        s2 += s[i];
      }
    }

    if(request.session.username){
    donorData = await getWebUser(request.session.username);
    donorName = donorData.Item.u_name.S;

    updateFundLimit(s2, parseInt(request.query.amount));
    updateFundDonors(s2, donorName)

    rc=`---Charity Station Recipt---\nReceipt Number: ${request.query.orderReferenceId}\nAmazon Email: ${request.session.username}\nName: ${donorName}\n`;
    response.render("success",{reason:s2, uName: donorName, p_info:request.query,email:request.session.username});
    t = await getWebUser(request.session.username);
    await updateWebUser(request.session.username,"donations",t.Item.donations.L.length, request.query.amount )
    rc += `Amount: $${request.query.amount}\n`
    await updateWebUser(request.session.username,"donated_for",t.Item.donations.L.length, s2 )
    rc += `Donation Reason: ${s2}\n`
    await updateWebUser(request.session.username,"donation_time",t.Item.donations.L.length, `${Date().substring(0,34)}` )
    rc += `Donation Time: ${Date().substring(0,34)}\n`
    await updateWebUser(request.session.username,"receipt_number",t.Item.donations.L.length, request.query.orderReferenceId)
    rc += `------------------------\nThanks for your help!!`
    if (!fs.existsSync(`./rcs/${request.session.username}`)){
      fs.mkdirSync(`./rcs/${request.session.username}`);
    }
    /// Send Instant Email Notification ///
    sendEmail.sendNotification(request.session.username,"Charity Station Receipts",`Hi, ${donorName},\n\nThis is your recipt information:\n\n${rc}\n\n\nThanks,\nCharity Station`)
    await fs.writeFile(`./rcs/${request.session.username}/${request.query.orderReferenceId}.txt`, rc, function(err) {
      if (err) {
                return console.log(err)
                }
                console.log("The file was saved!")
        })
  } else{
    response.render("success",{reason:s2, uName: `${check.Item.first_name.S} ${check.Item.last_name.S}`, p_info:request.query,email:`${check.Item.email.S}`});
  }}  else {
    response.render("index");
}
});

// Canceled page for IOS and Desktop users.
app.get(`/canceled`, function(request, response) {

    response.render("canceled");
  
});

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
  if(request.session.loggedin && request.headers.referer && (request.headers.referer.includes("https://l.messenger.com/") || request.headers.referer.includes("https://l.facebook.com/") || request.headers.referer.includes("https://payments.amazon.com/"))){
    response.render("desk_index",{msg:"You are logged in!",view:"none",r_s:request.query.s, t:f_s, p:p_a});
  } else if(!request.session.loggedin &&request.headers.referer && (request.headers.referer.includes("https://l.messenger.com/") || request.headers.referer.includes("https://l.facebook.com/") || request.headers.referer.includes("https://payments.amazon.com/"))){
    response.render("desk_index",{msg:"You are not logged in!",view:"full",r_s:request.query.s, t:f_s, p:p_a});
  } else {
    response.render("index")
  }
});


// Post Amazon Data for Desktop Messenger users and save it in the database.
app.post('/lg_desk', function (req, res) {
  // Get the Messenger Sender_PSID from the Request Query.
  if(req.body.name && req.body.email ){
  req.session.loggedin = true;
  req.session.username = req.body.email;
  res.render("desk_index",{msg:"You are now logged in with our Website!",view:"none",r_s:req.query.s, t:f_s, p:p_a});
}else{
  res.render("desk_index",{msg:"You are not logged in with Amazon Account!",view:"none",r_s:req.query.s, t:f_s, p:p_a});
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


// Redirect Page for any page.
app.get(`/redirect`, function(request, response) {
  response.render("redirect",{link:request.query.lk});
});





/////////////////////////////////////////////////////////////
/// Webhook Endpoint For the First Facebook Messenger App ///
/////////////////////////////////////////////////////////////
app.post('/webhook', (req, res) => {  
    let body = req.body;
    // Checks this is an event from a page subscription
    if (body.object === 'page') {
      // Iterates over each entry - there may be multiple if batched
      body.entry.forEach(function(entry) {
      // Gets the body of the webhook event
      if(entry.messaging){
        webhook_event = entry.messaging[0];

        // Get the sender PSID
        let sender_psid = webhook_event.sender.id;
        // Check if the event is Pass Thread Control and if the user is coming from the Inbox.
        // If so, will send the user to Handle Message Function in First Bot regardless the previous Bot.
        if(webhook_event.pass_thread_control && webhook_event.pass_thread_control.metadata){
          if (webhook_event.pass_thread_control.metadata.includes("from Page Inbox")){
            firstMessages(sender_psid, "BACK", app);
        }}
        
        // If OTN Approval, will update variables in the DB and trigger the First App to confirm.
        if (webhook_event.optin){
          payload = webhook_event.optin.payload;
          PSID = webhook_event.sender.id;
          userToken =  webhook_event.optin.one_time_notif_token;
          update = updateState(PSID, "Notification_token", `${userToken}`);
          firstMessages(sender_psid, "AGREED", app);
        }
        if(webhook_event.message && webhook_event.message.is_echo == true && webhook_event.message.text){
          botLog(webhook_event.recipient.id , webhook_event.message.text, "bot", "Message")
        }
        // Check if the event is a Message or Postback or Quick Replies.
        // Pass the event to handlePostBack function if Quick Reply or Postback.
        // Otherwise, pass the event to handleMessage function.
        if (sender_psid != process.env.PAGE_ID && webhook_event.message && !webhook_event.message.quick_reply) {
          botLog(webhook_event.sender.id , webhook_event.message.text, "user", "Message")
          firstMessages(sender_psid, webhook_event,app);  
        } else if (sender_psid != process.env.PAGE_ID && (webhook_event.postback || (webhook_event.message && webhook_event.message.quick_reply))) {
          if(webhook_event.postback && webhook_event.postback.payload && webhook_event.postback.payload !== "GET_STARTED"){
          botLog(webhook_event.sender.id , webhook_event.postback.title, "user", "Postback")
          } else{
            if(webhook_event.message && webhook_event.message.text){
            botLog(webhook_event.sender.id , `${webhook_event.message.text}, (${webhook_event.message.quick_reply.payload})`, "user", "Quick Reply")
          }}
          firstPostbacks(sender_psid, webhook_event,app);
        }
      } else {
        // If it is a standby event track and listen to the coversation by the secondary receivers.
        webhook_event = entry.standby[0]; 
        let sender_psid = webhook_event.sender.id;
        // The case which the message is sent from the page inbox.
        if (webhook_event.message && sender_psid == process.env.PAGE_ID){
          if (!webhook_event.message.app_id){
              inboxLog(webhook_event.recipient.id , webhook_event.message.text, "inbox")
              check_message = webhook_event.message.text;
              recipient_id = webhook_event.recipient.id;
              // It will be easier to send a like to move the user back to the Bot is the representative is using phone.
              if(!check_message){
                takeControl(recipient_id);
              }
            }
        }
        // The case which the user is sending a message to any of the secondary Apps.
        if (webhook_event.message && webhook_event.message.text && sender_psid != process.env.PAGE_ID){
          inboxLog(sender_psid , webhook_event.message.text, "user")
          check_message = webhook_event.message.text;
          recipient_id = webhook_event.recipient.id;
          // If no customer service available, the user can send a text to go back to the main Bot.
          check_message = check_message.toLowerCase();
          if(check_message.includes("#back to bot") || (check_message.includes("#")) && check_message.includes("back")){
            inboxLog(sender_psid , check_message, "user")
            takeControl(sender_psid);
          }
        }}
      });
    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
    } else {
      // Returns a '404 Not Found' if event is not from a page subscription
      res.sendStatus(404);
    }
  });
  
  // Adds support for GET requests to our webhook
  app.get('/webhook', (req, res) => {    
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];      
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {   
        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);  
      } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
      }
    }
  });
  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  // listen for webhook events //
  app.listen(process.env.PORT || 3370, () => console.log('webhook is listening'));
