import "source-map-support/register";

import { scaffold, sendResponse } from "node-lambda-toolkit";

import connectToDB from "../util/connectToDB";
import { redirect } from "../helpers/link";
import { Lambda } from "aws-sdk";

const bootstrap = scaffold({
  errMsg: "ERROR REDIRECTING:",
  connectToDB
});

module.exports.handler = (...input) => {
  bootstrap(input, async req => {
    const time = Date.now();
    console.log("code:", req.params.code);
    const url = await redirect(req.params.code);
    console.log("url:", url);

    const lambda = new Lambda({
      region: process.env.REGION //change to your region
    });

    console.log("REPORT_FN:", process.env.REPORT_FN);

    // lambda
    //   .invoke({
    //     FunctionName: process.env.REPORT_FN,
    //     Payload: JSON.stringify({
    //       ip: input[0].requestContext.identity.sourceIp,
    //       code: req.params.code,
    //       time
    //     }),
    //     InvocationType: "Event"
    //   })
    //   .send();

    await runLambda(
      input[0].requestContext.identity.sourceIp,
      req.params.code,
      time
    );

    return sendResponse(input[2], null, 307, {
      Location: url,
      "Cache-Control": "no-cache",
      "no-store": "must-revalidate",
      Pragma: "no-cache",
      Expires: 0
    });
  });
};

async function runLambda(ip, code, time) {
  return new Promise((resolve, reject) => {
    const lambda = new Lambda({
      region: process.env.REGION //change to your region
    });
    lambda.invoke(
      {
        FunctionName: process.env.REPORT_FN,
        Payload: JSON.stringify({
          ip,
          code,
          time
        })
      },
      (one, two) => {
        console.log("one:", one);
        console.log("two:", two);
        resolve(one);
      }
    );
  });
}
