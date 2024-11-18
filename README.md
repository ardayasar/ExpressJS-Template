
# Backend Server [Express.JS Template]

This is a backend server template created for general purpose. Server uses NodeJS + ExpressJS. Clean code registered.


## Authors

- [@ardayasar](https://www.github.com/ardayasar)


## Acknowledgements

 - Error handling is not the best. More will be done in the future.


## Installation

To deploy this project you need node.js installed on your computer. After that copy this repository.

```bash
  git clone https://github.com/ardayasar/ExpressJS-Template.git
```

Then go into the folder where you downloaded and run
```bash
  npm install
```

This will download all the required packages and install. To run the server
```bash
  node server.js
```



## Creating a page

All of the requests files are saved under `handlers` folder. This folder includes all the routings and URL's to use when runned.

```js
// [ /handlers/example.js ]

module.exports = (app) => {
    return {
        page_route: {
            post: '/example',
            get: '/example',
        },
        methods: ['post', 'get'],

        post: async function (req, res) {
                res.send('POST Method');
        },

        get: async function (req, res) {
            res.send('GET Method');
        },
    };
};

```
This code will handle post and get actions for `/example` url.

### Accessing global properties

All modules and loaded env variables are accesable using `app` variable. Example: `app.settings.website` or `app.database`.


## CAUTION!

In this application, by default, all of the request are handled using middleware and made user token detection. Which in this case only selected URL addresses can be accessed by all. Otherwise, token auth is needed to access. These all managed using below code.

```js

this.whitelist = ['/api/user/login', '/api/user/register'];

this.server.use(async (req, res, next) => {
    try{
        if(this.whitelist.includes(req.path)){
            next();
            return;
        }

        const email = req.body.email;
        const token = req.body.token;

        if(email && token){
            const response = await this.database.controlToken(email, token);
            res.send({status: response});
            return;
        }

        res.redirect("/login");
        return;
    }
    catch(error){
        console.error(error);
        res.send({status: false, err: {message: "System Error. Please try again later"}});
        return;
    }
});

```
