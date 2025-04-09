
const LoggerClass = require('../Logger');
const Logger = new LoggerClass();
const uuid = require('uuid');

let tokens_cache = [];
let tokens_cache_password_reset = [];

class userManager{
    registerNewUser(res, repo, email, first_name, last_name, password, confirmPassword, agree_terms, agree_promotions){
        return new Promise((resolve, reject) => {
            if(!agree_terms){
                res.render('Register', {RegistrationError: "You must agree to the terms of service!"});
                resolve({success: false});
            }
            agree_terms = 1;
            if (agree_promotions) {agree_promotions = 1} else {agree_promotions = 0}
            if(email.trim().length != 0 && first_name.trim().length != 0 && last_name.trim().length != 0 && password.trim().length != 0 && confirmPassword.trim().length != 0){
                if(password == confirmPassword){

                    var emailExists = false;
                    
                    repo.getByEmail(email).then(function(responseObj){
                        if(responseObj){
                            if(responseObj.email){
                                emailExists = true;
                            }
                        }                
                    }).then(function(){
                        if(!emailExists){
                            repo.RegisterUser(email, first_name, last_name, password, agree_terms, agree_promotions);
                            console.log(`Registered new user { Email: ${email} First_Name: ${first_name} }`);
                            Logger.logInfo(`Registered new user { Email: ${email} First_Name: ${first_name} }`);
                            resolve({success: true});
                        } else {
                            //console.log("Email or username already exists!");
                            res.render('Register', {RegistrationError: "Email already exists!"});
                            resolve({success: false});
                        }
                    });
        
                } else {
                    //console.log("PASSWORDS DO NOT MATCH!");
                    res.render('Register', {RegistrationError: "Passwords do not match!"});
                    resolve({success: false});
                }      
            } else {
                //console.log("FILL ALL SPOTS DIPSHIT!");
                res.render('Register', {RegistrationError: "Please fill all fields!"});
                resolve({success: false});
            }
        });
    }


    async loginUser(req, res, repo, email, password) {
        try {
            var user = null;
            var pass = null;
            const responseObj = await repo.getByUsername(email);
    
            if (responseObj && responseObj.email) {
                user = email;
                const passwords_match = await repo.compareUserPassword(email, password);
                
                if (passwords_match) {
                    console.log(`User logged in as { Email: ${email} }`);
                    Logger.logInfo(`User logged in as { Email: ${email} }`);
                    return { success: true };
                } else {
                    //console.log("User not found:", email);
                    throw new Error("Incorrect password or email!");
                }
            } else {
                //console.log("User not found:", email);
                throw new Error("Email does not exist!");
            }
        } catch (error) {
            //console.error("Error:", error.message);
            if(req.path == "/Login_As_Admin") {
                res.render('Admin-Login');
            } else {
                res.render('Login', { LoginError: error.message });
            }
            return { success: false };
        }
    }
}

module.exports = userManager;
