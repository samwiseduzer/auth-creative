import "source-map-support/register";

import { scaffold } from "node-lambda-toolkit";

import connectToDB from "../util/connectToDB";
import { listLinks } from "../helpers/link";

const bootstrap = scaffold({
  errMsg: "ERROR REPORTING:",
  connectToDB
});

module.exports.handler = (...input) => {
  bootstrap(input, async (req, user) => {
    const criteria = {
      user
    };
    const links = await listLinks(criteria);
    return links;
  });
};
