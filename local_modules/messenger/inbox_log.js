/// Function used to save the Page Inbox Conversation in the Database ///

const getUserData = require("../database/get_user_data");
module.exports = async (sender_psid, message,type) => {

    if(type ==="inbox"){
        msg = "Message (" + message + ") was sent from the page inbox";
    }else{
        msg = "User " + sender_psid + " sent (" + message + ") to the inbox!";
    }
    data = await getUserData(sender_psid);
    update = updateState(sender_psid, `inbox_msg[${data.Item.inbox_msg.L.length}]`, `${msg}`);
    
}