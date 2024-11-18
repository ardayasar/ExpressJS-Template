const fetch = require('isomorphic-fetch');
const templates = require('../selfPackages/templates');

module.exports = (app) => {
    return {
        page_route: {
            post: '/api/user/register',
            get: '/register',
        },
        methods: ['post', 'get'],

        post: async function (req, res) {
            try{
                const mail = req.body.mail;
                const password = req.body.password;
                const verificationCode = req.body.verificationCode;
                const g_recaptcha_response = req.body['g-recaptcha-response'];

                if(!g_recaptcha_response){
                    res.send({status: false, err: {msg: "Missing credentials"}});
                    return;
                }

                const captchaResponse = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${app.settings.googleRecaptchaKey}&response=${g_recaptcha_response}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });

                const captchaResponseJson = await captchaResponse.json();

                if(!captchaResponseJson.success){
                    res.send({status: false, err: {msg: "Captcha is not valid"}});
                    return;
                }

                if(password.length < 8){
                    res.send({status: false, err: {msg: "Password must be at least 8 characters"}});
                    return;
                }

                if(!isEmail(mail)){
                    res.send({status: false, err: {msg: "Mail is not in true format"}});
                    return;
                }

                if(verificationCode != undefined){    
                    const response = await app.database.registerVerification(mail, password, verificationCode, app.settings.apiKey);
                    res.send(response);
                }
                else{
                    const verification_key = Math.floor(100000 + Math.random() * 900000);
                    const response = await app.database.register(mail, app.confirmation_email, app.settings.cookie_website, templates.verificationTemplate(verification_key), verification_key);
                    res.send(response);
                }
            }
            catch(error){
                console.error(error);
                res.send({status: false, err: {msg: "System Error. Please try again later"}});
                return;
            }
        },

        get: async function (req, res) {
            res.send('ok');
        },
    };
};

const isEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}