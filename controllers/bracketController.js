const Bracket = require("../models/Bracket");
const bracketCollection = require("../db").db("FatBearWeek").collection("brackets");
const leaguesCollection = require('../db').db("FatBearWeek").collection("leagues");

exports.apiUpdateCreate = async function(req, res) {
  let existingBracket = await bracketCollection.findOne({ userId: req.apiUser._id });
  if(!existingBracket) {
    let bracket = new Bracket(req.apiUser._id, req.body.bracketMap, undefined, req.apiUser.username, req.apiUser.leagueId);
    bracket
      .create()
      .then(function(newId) {
        res.json(newId)
      })
      .catch(function(errors) {
        res.json(errors)
      });
  } else {
    let bracket = new Bracket(req.apiUser._id, req.body.bracketMap, existingBracket._id, req.apiUser.username);
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
  let bracketDoc = await bracketCollection.findOne({ userId: req.apiUser._id });
  if(bracketDoc) {
    res.json(bracketDoc);
  } else {
    res.json("bracket not found");
  }
}

exports.apiCanEdit = async function(req, res) {
  let league = await leaguesCollection.findOne({ leagueId: req.apiUser.leagueId });
  console.log(`Enabled: ${league?.bracketEditingEnabled}`);
  res.json(!!league?.bracketEditingEnabled)
}