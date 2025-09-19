const apiRouter = require("express").Router()
const userController = require("./controllers/userController")
const bracketController = require("./controllers/bracketController")
const cors = require("cors")

const { auth } = require('express-oauth2-jwt-bearer');

// Authorization middleware. When used, the Access Token must
// exist and be verified against the Auth0 JSON Web Key Set.
const checkJwt = auth({
  audience: 'https://dev-c15du7wevqtpe3bb.us.auth0.com/api/v2/',
  issuerBaseURL: 'https://dev-c15du7wevqtpe3bb.us.auth0.com/',
});

apiRouter.use(cors())

apiRouter.get("/", (req, res) => res.json("Hello, if you see this message that means your backend is up and running successfully. Congrats! Now let's continue learning React!"))

// check token to log out front-end if expired
apiRouter.post("/checkToken", checkJwt)


apiRouter.post("/register", userController.apiRegister)
apiRouter.post("/login", userController.apiLogin)

// apiRouter.post("/doesUsernameExist", userController.doesUsernameExist)
// apiRouter.post("/doesEmailExist", userController.doesEmailExist)

//bracket routes
apiRouter.post("/bracket/update-create", checkJwt, bracketController.apiUpdateCreate)
apiRouter.post("/bracket/get", checkJwt, bracketController.apiGet)
apiRouter.post("/bracket/canEdit", checkJwt, bracketController.apiCanEdit)

//standings routes
apiRouter.post("/getStandings", checkJwt, userController.getStandings);

module.exports = apiRouter
