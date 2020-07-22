/// Function used to save the Messenger Conversation in the Database ///
const getUserData = require("../database/get_user_data");
updateState = require("../database/update_state");

module.exports = async (sender_psid, message,type, kind) => {

    if(sender_psid !== process.env.FIRST_ADMIN){
    if(type ==="bot"){
        msg = "Message (" + message + ") was sent from the bot";
    }else {
        msg = "User " + sender_psid + " sent (" + kind + ": " + message + ") to the bot!";
    }
    data = await getUserData(sender_psid);
    update = updateState(sender_psid, `bot_msg[${data.Item.bot_msg.L.length}]`, `${msg}`);
    }
}