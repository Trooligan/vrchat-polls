module.exports = async function (context, req, inputPoll) {
  const vote = parseInt(req.params.vote ?? "0");
  const pollId = req.params.id;
  const votes = inputPoll ? [...inputPoll.votes] : new Array(10).fill(0);
  const authCookie = parseStringToJSON(req.headers.cookie ?? "");
  const voters = inputPoll ? inputPoll.voters : false;

  context.log.verbose("pollId ", pollId);
  context.log.verbose("votes ", votes);
  context.log.verbose("authCookie ", authCookie);
  context.log.verbose("voters ", voters);
  context.log.verbose("vote ", vote);

  if (!authCookie)
    return response(401, { message: "Invalid authCookie" }, context);
  if (!Number.isInteger(vote) || !pollId)
    return response(400, { message: "Invalid parameters" }, context);
  if (vote < 0 || vote >= votes.length)
    return response(
      400,
      { message: "Invalid vote value: vote must be a value between 0-9" },
      context
    );

  const authUser = createAuthUser(authCookie);
  const hasVoted = alreadyVoted(authUser, voters);

  if (!votes || !voters) return newPoll(pollId, vote, votes, authUser, context);

  return updateVote(pollId, vote, authUser, votes, voters, hasVoted, context);
};

function response(statusCode, bodyObj, context) {
  context.res = {
    status: statusCode,
    body: bodyObj,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (statusCode == 200) {
    context.log.info("[200] Success: ", bodyObj);
  } else {
    context.log.error(`[${statusCode}] Error: `, bodyObj);
  }

  return context.done();
}

function createAuthUser(authCookie) {
  const keyOrder = ["authToken1", "authToken2", "authToken3", "authToken4"];
  let authUser = "";
  for (const key of keyOrder) {
    if (authCookie.hasOwnProperty(key)) {
      authUser += authCookie[key];
    }
  }
  return authUser;
}

function newPoll(pollId, vote, votes, authUser, context) {
  votes[vote] += 1;

  const pollObject = JSON.stringify({
    id: pollId,
    votes: votes,
    voters: { [authUser]: vote },
  });
    
  context.log.info("Created a new poll: ", pollObject);
  response(200, pollObject, context);
}

async function updateVote(pollId, vote, authUser, votes, voters, hasVoted, context) {
  const authUserVote = voters[authUser];

  // Update votes
  votes[vote] += 1;

  if (hasVoted) {
    votes[authUserVote] -= 1;
  }

  // Update voter
  voters[authUser] = vote;

  const pollObject = JSON.stringify({
    id: pollId,
    votes: votes,
    voters: voters,
  });

  context.bindings.outputPoll = pollObject;

  context.log.info(`Poll '${pollId}' updated succesfully: ${pollObject}`);

  response(200, { votes: votes }, context);
}

function alreadyVoted(authUser, voters) {
  return voters.hasOwnProperty(authUser);
}

function parseStringToJSON(inputString) {
  const keyValuePairs = inputString.split("; ");
  const jsonObject = {};

  keyValuePairs.forEach((keyValuePair) => {
    const [key, value] = keyValuePair.split("=");
    jsonObject[key] = value;
  });

  return jsonObject;
}
