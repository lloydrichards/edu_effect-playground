import { Effect } from "effect";

// ------------------
// Sync Effects
// ------------------

const one = Effect.succeed(1);
//    ^?
const tryOne = Effect.try({
  //   ^?
  try: () => JSON.parse("1"),
  catch: (e) => new Error(`Failed to parse: ${e}`),
});

// ------------------
// Async Effects
// ------------------

const wait = (value: number): Promise<string> =>
  new Promise((resolve) => setTimeout(() => resolve("success"), value));

const promiseOne = Effect.promise(() => wait(1000));
//      ^?

import { readFile } from "fs";
const readFileEffect = Effect.async<Buffer, Error>((resume) => {
  //    ^?
  const fs = require("fs");
  readFile("package.json", (err, data) => {
    if (err) {
      resume(Effect.fail(err));
    } else {
      resume(Effect.succeed(data));
    }
  });
});
