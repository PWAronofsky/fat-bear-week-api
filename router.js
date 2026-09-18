const apiRouter = require("express").Router()
const userController = require("./controllers/userController")
const bracketController = require("./controllers/bracketController")
const cors = require("cors")
const { checkJwt, loadAuth0User } = require("./utilities/auth0")

apiRouter.use(cors())

apiRouter.get("/", (req, res) => res.json("Hello, if you see this message that means your backend is up and running successfully. Congrats!"))

//bracket routes
apiRouter.post("/bracket/update-create", checkJwt, loadAuth0User, bracketController.apiUpdateCreate)
apiRouter.post("/bracket/get", checkJwt, loadAuth0User, bracketController.apiGet)
apiRouter.post("/bracket/canEdit", checkJwt, loadAuth0User, bracketController.apiCanEdit)

//standings routes
apiRouter.post("/getStandings", checkJwt, loadAuth0User, userController.getStandings);

module.exports = apiRouter
