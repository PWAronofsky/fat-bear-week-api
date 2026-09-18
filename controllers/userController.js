const { roundOnePoints, roundTwoPoints, roundThreePoints, roundFourPoints } = require("../utilities/utilities");
const bracketCollection = require("../db").db("FatBearWeek").collection("brackets");

exports.getStandings = async function (req, res) {
  try {
    console.log("Get Standings Called");
    let masterBracketDoc = await bracketCollection.findOne({ username: "admin" });
    let leagueBracketDocs = await bracketCollection.find({ leagueId: req.apiUser.leagueId }).toArray();

    const userScores = getUserScores(leagueBracketDocs, masterBracketDoc?.bracketMap?.bracketMap);

    res.json(userScores);
  } catch (e) {
    res.status(500).send("Error fetching standings");
    console.log("error getting standings")
  }
}

const getUserScores = (leagueBracketDocs, masterBracket) => {
  let userScores = [];
  leagueBracketDocs.forEach((bracketDoc) => {
    const bracketMap = bracketDoc?.bracketMap?.bracketMap
    if(!bracketMap) {
      return;
    }
    const userScore = compareBrackets(bracketDoc.username, bracketMap, masterBracket);
    userScores.push(userScore);
  });

  const sortedScores = userScores.sort((a, b) => {
    return compare(a.total, b.total) || 
            compare(a.roundFourWins, b.roundFourWins) || 
            compare(a.roundThreeWins, b.roundThreeWins) ||
            compare(a.roundTwoWins, b.roundTwoWins) ||
            compare(a.roundOneWins, b.roundOneWins)
  }).reverse();

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
      switch (true) {
        case i <=4: {
          userPoints += roundOnePoints;
          roundOneWins++;
          break;
        }
        case i >=5 && i <= 8: {
          userPoints += roundTwoPoints;
          roundTwoWins++;
          break;
        }
        case i ===9 || i === 10: {
          userPoints += roundThreePoints;
          roundThreeWins++;
          break;
        }
        case i === 11: {
          userPoints += roundFourPoints;
          roundFourWins++;
          break;
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
