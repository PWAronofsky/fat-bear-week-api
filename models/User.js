const bcrypt = require("bcryptjs")
const usersCollection = require('../db').db().collection("users")
const validator = require("validator")
const md5 = require('md5')

let User = function(data, getAvatar) {
  this.data = data
  this.errors = []
  if (getAvatar == undefined) { getAvatar = false }
  if (getAvatar) {this.getAvatar()}
}

User.prototype.cleanUp = function() {
  if (typeof(this.data.email) != "string") { this.data.email = ""}
  if (typeof(this.data.password) != "string") { this.data.password = "" }

  // get rid of any bogus properties
  this.data = {
    email: this.data.email.trim().toLowerCase(),
    password: this.data.password,
  }
}

User.prototype.validate = function() {
  return new Promise(async (resolve, reject) => {
    if (!validator.isEmail(this.data.email)) {this.errors.push("You must provide a valid email address.")}
    if (this.data.password == "") {this.errors.push("You must provide a password.")}
    if (this.data.password.length > 0 && this.data.password.length < 8) {this.errors.push("Password must be at least 8 characters.")}
    if (this.data.password.length > 50) {this.errors.push("Password cannot exceed 50 characters.")}
  
    // Only if email is valid then check to see if it's already taken
    if (validator.isEmail(this.data.email)) {
      let emailExists = await usersCollection.findOne({ email: this.data.email })
      if (emailExists) {this.errors.push("That email is already being used.")}
    }

    resolve()
  })
}

User.prototype.login = function() {
  return new Promise((resolve, reject) => {
    this.cleanUp()
    usersCollection.findOne({email: this.data.email}).then((attemptedUser) => {
      if (attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
        this.data = attemptedUser
        this.getAvatar()
        resolve("Congrats!")
      } else {
        reject("Invalid email / password.")
      }
    }).catch(function(e) {
      reject("Please try again later.")
    })
  })
}

User.prototype.register = function() {
  return new Promise(async (resolve, reject) => {
    // Step #1: Validate user data
    this.cleanUp()
    await this.validate()
  
    // Step #2: Only if there are no validation errors 
    // then save the user data into a database
    if (!this.errors.length) {
      // hash user password
      let salt = bcrypt.genSaltSync(10)
      this.data.password = bcrypt.hashSync(this.data.password, salt)
      await usersCollection.insertOne(this.data)
      this.getAvatar()
      resolve()
    } else {
      console.log(this.errors)
      reject(this.errors)
    }
  })
}

User.prototype.getAvatar = function() {
  this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

User.findByEmail = function(email) {
  return new Promise(function(resolve, reject) {
    if (typeof(email) != "string") {
      reject()
      return
    }
    usersCollection.findOne({email: email}).then(function(userDoc) {
      if (userDoc) {
        userDoc = new User(userDoc, true)
        userDoc = {
          _id: userDoc.data._id,
          email: userDoc.data.email,
          avatar: userDoc.avatar
        }
        resolve(userDoc)
      } else {
        reject()
      }
    }).catch(function(e) {
      reject()
    });
  });
}

User.doesEmailExist = function(email) {
  return new Promise(async function(resolve, reject) {
    if (typeof(email) != "string") {
      resolve(false)
      return
    }

    let user = await usersCollection.findOne({email: email})
    if (user) {
      resolve(true)
    } else {
      resolve(false)
    }
  })
}

module.exports = User