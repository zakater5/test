require('dotenv').config(); // Load environment variables

const express = require('express');
const router = express.Router();

const userManager = require('../SQL/userManager');
const UserManager = new userManager();

const DB_Op = require('../SQL/dbOperator');
const Repo = require('../SQL/Repository');
const db_op = new DB_Op(process.env.DATABASE_FILE_PATH);
const repo = new Repo(db_op);

// Define routes
router.post('/login', (req, res) => {
    var Email = req.body.email;
    var Password = req.body.password;

    UserManager.loginUser(req, res, repo, Email, Password).then(function(responseObj){
        if(responseObj){
            if(responseObj.success == true){
                req.session.userid = Email;
                res.redirect('/');
            }
        }
    });
});

router.post('/register', (req, res) => {
    var Email = req.body.email;
    var First_name = req.body.FirstName || "John";
    var Last_Name = req.body.LastName || "Doe";
    var Password = req.body.password;
    var ConfirmPassword = req.body.confirmPassword;
    var agree_terms = req.body.agreeTerms || true;
    var agree_promotions = req.body.agreePromotions || true;

    UserManager.registerNewUser(res, repo, Email, First_name, Last_Name, Password, ConfirmPassword, agree_terms, agree_promotions).then(function(responseObj){
        if(responseObj){
            if(responseObj.success == true){
                req.session.userid = Email;
                res.redirect('/');
            }
        }
    });
});

module.exports = router;