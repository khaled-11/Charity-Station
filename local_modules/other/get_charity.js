/////////////////////////////////////////////////////////////
// Asynchronous Module to search the Charities in the USA. //
/////////////////////////////////////////////////////////////
const rp = require('request-promise');

module.exports = async (name, city, state) => {
    var result;
    try{
        var options = {
            method: 'POST',
            uri: `http://data.orghunter.com/v1/charitysearch?user_key=${process.env.SEARCH_KEY}&searchTerm=${name}&city=${city}&state=${state}`,
            json: true
        };
    result = await rp(options);
    } catch (e){
        console.log(e)
    }
    return result;
}