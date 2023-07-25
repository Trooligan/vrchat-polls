module.exports = async function (context, req) {
  const authCode = req.params.authCode;
  const cookies = parseStringToJSON(req.headers.cookie ?? "");

  if (!authCode)
    response(400, { message: "Missing 'authCode' paramater" }, context);

  let tokenName = "authToken1";

  if (cookies) {
    if (Object.keys(cookies).includes("authToken3")) {
      tokenName = "authToken4";
    } else if (Object.keys(cookies).includes("authToken2")) {
      tokenName = "authToken3";
    } else if (Object.keys(cookies).includes("authToken1")) {
      tokenName = "authToken2";
    }
  }

  authResponse(authCode, tokenName, context);
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

function authResponse(authCode, tokenName, context) {
  const responseObject = {
    status: 200,
    body: { auth: authCode },
    headers: {
      "Content-Type": "application/json",
    },
    cookies: [
      {
        name: tokenName,
        value: authCode,
        maxAge: 99999,
        path: "/",
        SameSite: "None; Secure",
      },
    ],
  };
  context.res = responseObject;

  context.log.info("[200] Success: ", responseObject);

  return context.done();
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
