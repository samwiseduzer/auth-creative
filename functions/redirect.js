import "source-map-support/register";

import { scaffold, sendResponse } from "node-lambda-toolkit";

import connectToDB from "../util/connectToDB";
import { redirect } from "../helpers/link";

const bootstrap = scaffold({
  errMsg: "ERROR REDIRECTING:",
  connectToDB
});

module.exports.handler = (...input) => {
  bootstrap(input, async req => {
    const criteria = {
      code: req.params.code
    };
    const url = await redirect(criteria);
    return sendResponse(input[2], null, 301, { Location: url });
  });
};
