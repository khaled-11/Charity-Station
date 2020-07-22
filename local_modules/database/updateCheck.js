// Function to check whether to add or get the information //
const exists = require("./check_data"),
getAdminData = require("./get_admin_data"),
getUserData = require("./get_user_data"),
putAdminData = require("./put_admin_data"),
putUserData = require("./put_user_data"),
setMenu = require("../messenger/persistent_menu"),
requestData = require("../messenger/req_data");

///////////////////////////////////////////////////////////////////////
// Asynchronous Function to check if the user exists in the Database //
//     If the user exists it will return his personal information    //
//  If not, it will create a new entry fot the user in the database  //
///////////////////////////////////////////////////////////////////////
module.exports = async (sender_psid) => {
    var data;
    // Check if the user is already in the database.
    // Both cases will end up by reading the data again.
    const check = await exists(sender_psid,"PSID");
    // If exists, read the data.
    if (check === true)
    {
      if (sender_psid === process.env.FIRST_ADMIN || sender_psid === process.env.SECOND_ADMIN){
        data = await getAdminData(sender_psid);
      } else {
        data = await getUserData(sender_psid);
      }
    // If this is the first visit, request personal Data from Facebook.
    // Then add the data to the DynamoDB table for users.  
    } else {
      if (sender_psid === process.env.FIRST_ADMIN || sender_psid === process.env.SECOND_ADMIN){
        await setMenu(sender_psid,"admin")
        const userData = await requestData(sender_psid);
        const state = await putAdminData(userData);
        data = await getAdminData(sender_psid);
      } else {
        await setMenu(sender_psid,"user")
        userData = await requestData(sender_psid);
        const state = await putUserData(userData);
        data = await getUserData(sender_psid);
      }
    }
    return data;
}

      // const userData = await requestData(sender_psid);
      // if (sender_psid === process.env.FIRST_ADMIN || sender_psid === process.env.SECOND_ADMIN){
      // const state = await putData(userData,"admin");
      // } else{
      //   const state = await putData(userData,"user");
      // }
      // const data = await getData(sender_psid);
      // console.log(data);
      // result [0] = data.Item.PSID.S;
      // result [1] = data.Item.profile_pic_url.S;
      // result [2] = data.Item.first_name.S;
      // result [3] = data.Item.last_name.S;
      // result [4] = data.Item.user_type.S;
      // result [5] = data.Item.general_state.S;
      // result [6] = data.Item.email.S;
      // result [7] = data.Item.postal_code.S;
      // result [8] = data.Item.donations.L;
      // result [9] = data.Item.general_counter.N;
      // result [10] = data.Item.Notification_token.S;
      // result [11] = data.Item.inbox_msg.L;
      // result [12] = data.Item.bot_msg.L;
      // if (result[4] ==="admin" && data.Item.emailing_email){
      //   result [13] = data.Item.emailing_email.S;
      //   result [14] = data.Item.emailing_subject.S;
      // }