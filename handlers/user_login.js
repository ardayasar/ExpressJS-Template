module.exports = (app) => {
    return {
        page_route: {
            post: '/api/user/login',
            get: '/login',
        },
        methods: ['post', 'get'],

        post: async function (req, res) {
            try{
                const mail = req.body.mail;
                const password = req.body.password;
        
                if(mail && password){
                    const response = await app.database.login(mail, password, app.settings.apiKey);
                    if(response.status){
                        const token = await app.database.generateToken(mail);
                        res.cookie("loggedIn", true, { domain: app.settings.cookie_website, secure: true, sameSite: "none" });
                        res.cookie("authKey", token, { domain: app.settings.cookie_website, secure: true, sameSite: "none" });
                        res.cookie("user_name", response.username, { domain: app.settings.cookie_website, secure: true, sameSite: "none" });
                        res.cookie("user_email", mail, { domain: app.settings.cookie_website, secure: true, sameSite: "none" });
        
                        res.send({status: true, redirect: "/"});
                        return;
                    }
                    else{
                        res.send({status: false, err: {message: response.error}});
                        return;
                    }
                }
                else{
                    res.send({status: false, err: {message: "Mail or password is empty"}});
                    return;
                }
            }
            catch(error){
                console.error(error);
                res.send({status: false, err: {message: "System Error. Please try again later"}});
                return;
            }
        },

        get: async function (req, res) {
            res.send('ok');
        },
    };
};
