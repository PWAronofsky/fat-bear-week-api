const bracketsCollection = require("../db").db().collection("brackets")
const ObjectID = require('mongodb').ObjectId

let Bracket = function(userId, bracketMap, requestedBracketId) {
  this.userId = userId
  this.bracketMap = bracketMap
  this.requestedBracketId = requestedBracketId
  this.errors = []
}

Bracket.prototype.validate = function () {
  if(!this.bracketMap) {
    this.errors.push("You must fill out your bracket");
  }
}

Bracket.prototype.create = function () {
  return new Promise((resolve, reject) => {
    this.validate()
    if (!this.errors.length) {
      // save bracket into database
      bracketsCollection
        .insertOne({ userId: new ObjectID(this.userId), bracketMap: this.bracketMap })
        .then(info => {
          resolve(info.insertedId)
        })
        .catch(e => {
          this.errors.push("Please try again later.")
          reject(this.errors)
        })
    } else {
      reject(this.errors)
    }
  })
}

Bracket.prototype.update = function () {
  return new Promise(async (resolve, reject) => {
    this.validate()
    if (!this.errors.length) {
      await bracketsCollection.findOneAndUpdate({ _id: new ObjectID(this.requestedBracketId) }, { $set: { bracketMap: this.bracketMap } })
      resolve("success")
    } else {
      reject(this.errors)
    }
  })
}


module.exports = Bracket
