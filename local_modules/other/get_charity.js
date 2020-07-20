/////////////////////////////////////////////////////////////////
// Asynchronous Module to Request the user Info from Facebook. //
/////////////////////////////////////////////////////////////////
const rp = require('request-promise');

module.exports = async (name, city, state) => {
    var result;
    try{
        var options = {
            method: 'POST',
            uri: `http://data.orghunter.com/v1/charitysearch?user_key=bf05f298cec8d0033573e9a000cad0a6&searchTerm=${name}&city=${city}&state=${state}`,
            json: true
        };
    result = await rp(options);
    } catch (e){
        console.log(e)
    }
    return result;
}