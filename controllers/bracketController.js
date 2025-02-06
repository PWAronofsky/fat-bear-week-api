const ObjectID = require('mongodb').ObjectId
const Bracket = require("../models/Bracket");
const bracketCollection = require("../db").db().collection("brackets");
const leaguesCollection = require('../db').db().collection("leagues");
const usersCollection = require('../db').db().collection("users");

exports.apiUpdateCreate = async function(req, res) {
  let existingBracket = await bracketCollection.findOne({ userId: new ObjectID(req.apiUser._id) });
  if(!existingBracket) {
    let bracket = new Bracket(req.apiUser._id, req.body);
    bracket
      .create()
      .then(function(newId) {
        res.json(newId)
      })
      .catch(function(errors) {
        res.json(errors)
      });
  } else {
    let bracket = new Bracket(req.apiUser._id, req.body, existingBracket._id);
    bracket
      .update()
      .then(status => {
        // the bracket was successfully updated in the database
        // or user did have permission, but there were validation errors
        if (status == "success") {
          res.json("success")
        } else {
          res.json("failure")
        }
      })
      .catch(e => {
        // a bracket with the requested id doesn't exist
        // or if the current visitor is not the owner of the requested bracket
        res.json("no permissions")
      });
  }
}

exports.apiGet = async function(req, res) {
  let bracketDoc = await bracketCollection.findOne({ userId: new ObjectID(req.apiUser._id) });
  if(bracketDoc) {
    res.json(bracketDoc.bracketMap);
  } else {
    res.json("bracket not found");
  }
}

exports.apiCanEdit = async function(req, res) {
  let user = await usersCollection.findOne({ _id: new ObjectID(req.apiUser._id) });
  if(!user) {
    res.json(false);
    return;
  }

  let league = await leaguesCollection.findOne({ leagueId: user?.leagueId });
  res.json(!!league?.bracketEditingEnabled)
}