///////////////////////////////////////////
/// Sending OTN from Messenger Function ///
///////////////////////////////////////////
const callSendAPI = require("./callSendAPI"),
updateState = require("../database/update_state"),
getAll = require("../database//get_all_keys"),
updateCheck = require("../database/updateCheck");

module.exports = async (txt) => {
        all = await getAll();
        for (i = 0 ; i < all.length ; ++i){
            sender_psid = all[i].PSID.S;
            check = await updateCheck(sender_psid, "SENDING OTN");
            if(check.Item.Notification_token && check.Item.Notification_token.S !== ""){            
            userToken = check.Item.Notification_token.S;
            action = null;
            PSID = null;
            response = {"text":txt};
            await callSendAPI(PSID, response, action, 'inbox', "OTN", userToken);
            const update = await updateState(sender_psid, "Notification_token", "");
            } else{
                 console.log("not approved");
            }
        }
    }
