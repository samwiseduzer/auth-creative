import "source-map-support/register";

import { scaffold } from "node-lambda-toolkit";

import connectToDB from "../util/connectToDB";
import { deleteLink } from "../helpers/link";

const bootstrap = scaffold({
  errMsg: "ERROR DELETING LINK:",
  connectToDB
});

module.exports.handler = (...input) => {
  bootstrap(input, async req => {
    const ids = await deleteLink(req.param.code);
    return ids;
  });
};
