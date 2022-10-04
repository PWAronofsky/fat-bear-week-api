const User = require("../models/User");
const Post = require("../models/Post");
const Follow = require("../models/Follow");
const jwt = require("jsonwebtoken");
const { ObjectID } = require("bson");
const { roundOnePoints, roundTwoPoints, roundThreePoints, roundFourPoints } = require("../utilities/utilities");
const usersCollection = require('../db').db().collection("users");
const bracketCollection = require("../db").db().collection("brackets");

// how long a token lasts before expiring
const tokenLasts = "1d"

exports.apiGetPostsByUsername = async function (req, res) {
  try {
    let authorDoc = await User.findByUsername(req.params.username)
    let posts = await Post.findByAuthorId(authorDoc._id)
    //res.header("Cache-Control", "max-age=10").json(posts)
    res.json(posts)
  } catch (e) {
    res.status(500).send("Sorry, invalid user requested.")
  }
}

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

exports.doesUsernameExist = function (req, res) {
  User.findByUsername(req.body.username.toLowerCase())
    .then(function () {
      res.json(true)
    })
    .catch(function (e) {
      res.json(false)
    })
}

exports.doesEmailExist = async function (req, res) {
  let emailBool = await User.doesEmailExist(req.body.email)
  res.json(emailBool)
}

exports.sharedProfileData = async function (req, res, next) {
  let viewerId
  try {
    viewer = jwt.verify(req.body.token, process.env.JWTSECRET)
    viewerId = viewer._id
  } catch (e) {
    viewerId = 0
  }
  req.isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, viewerId)

  let postCountPromise = Post.countPostsByAuthor(req.profileUser._id)
  let followerCountPromise = Follow.countFollowersById(req.profileUser._id)
  let followingCountPromise = Follow.countFollowingById(req.profileUser._id)
  let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise])

  req.postCount = postCount
  req.followerCount = followerCount
  req.followingCount = followingCount

  next()
}

exports.apiLogin = function (req, res) {
  let user = new User(req.body)
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

exports.apiGetHomeFeed = async function (req, res) {
  try {
    let posts = await Post.getFeed(req.apiUser._id)
    res.json(posts)
  } catch (e) {
    res.status(500).send("Error")
  }
}

exports.ifUserExists = function (req, res, next) {
  User.findByUsername(req.params.username)
    .then(function (userDocument) {
      req.profileUser = userDocument
      next()
    })
    .catch(function (e) {
      res.json(false)
    })
}

exports.profileBasicData = function (req, res) {
  res.json({
    profileUsername: req.profileUser.username,
    profileAvatar: req.profileUser.avatar,
    isFollowing: req.isFollowing,
    counts: { postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount }
  })
}

exports.profileFollowers = async function (req, res) {
  try {
    let followers = await Follow.getFollowersById(req.profileUser._id)
    //res.header("Cache-Control", "max-age=10").json(followers)
    res.json(followers)
  } catch (e) {
    res.status(500).send("Error")
  }
}

exports.getStandings = async function (req, res) {
  try {
    console.log("Get Standings Called");
    let user = await usersCollection.findOne({ _id: new ObjectID(req.apiUser._id)})
    let adminUser = await usersCollection.findOne({ username: "admin" });
    let masterBracketDoc = await bracketCollection.findOne({ userId: new ObjectID( adminUser._id)});
    let leagueBracketDocs = await usersCollection.aggregate(
      [
        {'$match':{leagueId: user?.leagueId }},//Optional if you want or you can leave empty
        {'$lookup':{
            from:'brackets',
            localField:'_id',//fildname of a
            foreignField:'userId',//field name of b
            as:'userBracket' // you can also use id fiels it will replace id with the document
        }}
      ]
    ).toArray();

    const userScores = getUserScores(leagueBracketDocs, masterBracketDoc.bracketMap);

    res.json(userScores);
  } catch (e) {
    res.status(500).send("Error fetching standings");
    console.log("error getting standings")
  }
}

const getUserScores = (leagueBracketDocs, masterBracket) => {
  let userScores = [];
  leagueBracketDocs.forEach((bracketDoc) => {
    const bracketMap = bracketDoc?.userBracket[0]?.bracketMap
    if(!bracketMap) {
      return;
    }

    const userScore = compareBrackets(bracketDoc.username, bracketMap, masterBracket);
    console.log(`User Score: ${userScore}`);
    userScores.push(userScore);
  });

  const sortedScores = userScores.sort((a, b) => {
    return compare(a.total, b.total) || 
            compare(a.roundFourWins, b.roundFourWins) || 
            compare(a.roundThreeWins, b.roundThreeWins) ||
            compare(a.roundTwoWins, b.roundTwoWins) ||
            compare(a.roundOneWins, b.roundOneWins)
  });

  return sortedScores;
}

const compare = function(a, b) {
  if (a > b) return +1;
  if (a < b) return -1;
  return 0;
}

const compareBrackets = (username, userBracket, masterBracket) => {
  let userPoints = 0;
  let roundOneWins = 0;
  let roundTwoWins = 0;
  let roundThreeWins = 0;
  let roundFourWins = 0;

  for(let i = 1; i <= 11; i++) {
    if(userBracket[i]?.pickedWinner === masterBracket[i]?.pickedWinner) {
      switch (i) {
        case i <=4: {
          userPoints += roundOnePoints;
          roundOneWins++;
        }
        case i >=5 && i <= 8: {
          userPoints += roundTwoPoints;
          roundTwoWins++;
        }
        case i ===9 || i === 10: {
          userPoints += roundThreePoints;
          roundThreeWins++;
        }
        case i === 11: {
          userPoints += roundFourPoints;
          roundFourWins++;
        }
      }
    }
  }

  return {
    username: username,
    total: userPoints,
    roundOneWins: roundOneWins,
    roundTwoWins: roundTwoWins,
    roundThreeWins: roundThreeWins,
    roundFourWins: roundFourWins
  }
}
