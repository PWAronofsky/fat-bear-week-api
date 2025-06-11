const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { ObjectID } = require("bson");
const usersCollection = require('../db').db().collection("users");
const bracketCollection = require("../db").db().collection("brackets");

// how long a token lasts before expiring
const tokenLasts = "1d"


exports.checkToken = function (req, res) {
  try {
    req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET)
    res.json(true)
  } catch (e) {
    res.json(false)
  }
}

exports.apiMustBeLoggedIn = function (req, res, next) {
  try {
    req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET)
    next()
  } catch (e) {
    res.status(500).send("Sorry, you must provide a valid token.")
  }
}

exports.doesEmailExist = async function (req, res) {
  let emailBool = await User.doesEmailExist(req.body.email)
  res.json(emailBool)
}


exports.apiLogin = function (req, res) {
  let user = new User(req.body)
  console.log("Login Called");
  user
    .login()
    .then(() => {
      res.json({
        token: jwt.sign({ _id: user.data._id, username: user.data.username, avatar: user.avatar }, process.env.JWTSECRET, { expiresIn: tokenLasts }),
        username: user.data.username,
        avatar: user.avatar
      })
    })
    .catch(regErrors => {
      res.status(500).send(regErrors)
    })
}

exports.apiRegister = function (req, res) {
  let user = new User(req.body)
  console.log("Register Called");
  user
    .register()
    .then(() => {
      res.json({
        token: jwt.sign({ _id: user.data._id, username: user.data.username, avatar: user.avatar }, process.env.JWTSECRET, { expiresIn: tokenLasts }),
        username: user.data.username,
        avatar: user.avatar,
        id: user.data._id
      })
    })
    .catch(regErrors => {
      res.status(500).send(regErrors)
    })
}
