import { Console, Effect, Either } from "effect";

class AuthError {
  readonly _tag = "AuthError";
}

class ParseError {
  readonly _tag = "ParseError";
}

const conditions = [true, true, true] as [boolean, boolean, boolean];

const errors = Effect.gen(function* (_) {
  if (conditions[0]) {
    yield* _(Effect.fail(new AuthError()));
  } else if (conditions[1]) {
    yield* _(Effect.fail(new ParseError()));
  } else if (conditions[2]) {
    yield* _(Effect.die("Boom"));
  }
  return "Success";
});

const program = Effect.gen(function* (_) {
  yield* _(Console.log("1"));
  yield* _(Effect.fail(new Error("Boom")));
  yield* _(Console.log("2")); // this will not run
});

// --- Error Handling ---

// ----------------------
//      `catchAll`
// ----------------------
// `catchAll` is a combinator that will handle any error

const handled1 = errors.pipe(
  Effect.catchAll((e) => Effect.succeed(`Handled ${e._tag}`))
);

// ----------------------
//     `catchTag`
// ----------------------
// `catchTag` is a combinator that will only handle errors of a specific type

const handled2 = errors.pipe(
  Effect.catchTag("AuthError", (e) => Effect.succeed("Handled Auth"))
);

// ----------------------
//    `catchTags`
// ----------------------
// `catchTags` is similar to `catchTag`, but can handle multiple errors

const handled3 = errors.pipe(
  Effect.catchTags({
    AuthError: (e) => Effect.succeed(`Handled Unauthorized`),
    ParseError: (e) => Effect.succeed("Handled invalid input"),
  })
);

// ----------------------
//      `orElse`
// ----------------------
// `orElse` is similar to `catchAll`, but is already specified prior to the error

const handled4 = errors.pipe(Effect.orElse(() => Effect.succeed("Handled")));

// ----------------------
//     `orElseFail`
// ----------------------
// `orElseFail` maps any error to a new already specified error

const handle5 = errors.pipe(Effect.orElseFail(() => new Error("fail")));

// ----------------------
//     `mapError`
// ----------------------
// `mapError` maps an error to a new error

const handle6 = errors.pipe(
  Effect.mapError((oldErr) => new Error(`error: ${oldErr}`))
);

// ----------------------
//       `match`
// ----------------------
// `match` handles both cases

const handle7 = errors.pipe(
  Effect.match({
    onSuccess: (x) => `success: ${x}`,
    onFailure: (e) => `handled error: ${e}`,
  })
);

// ----------------------
//    `matchEffect`
// ----------------------
// `matchEffect` is similar to `match`, but takes effects

const handle8 = errors.pipe(
  Effect.matchEffect({
    onSuccess: (x) => Effect.succeed(`success: ${x}`),
    onFailure: (e) => Effect.succeed(`handled error: ${e}`),
    // obviously these could also fail
  })
);

// ----------------------
//  `firstSuccessOf`
// ----------------------
// `firstSuccessOf` will run the first effect that succeeds

const handle9 = Effect.firstSuccessOf([
  Effect.fail(new Error("fail")),
  Effect.succeed("success"),
]);

// ---- Error Handling in Generators ----

const handledGen1 = Effect.gen(function* (_) {
  const r = yield* _(Effect.sync(() => Math.random()));
  if (r > 0.5) {
    yield* _(Effect.fail(new Error("fail")));
  }
  return r * 2;
}).pipe(Effect.catchAll((e) => Effect.succeed(-1)));

// another option is doing error handling in the adapter pipe
const mightFail = Effect.sync(() => Math.random()).pipe(
  Effect.flatMap((r) =>
    r > 0.5 ? Effect.fail(new Error("fail")) : Effect.succeed(r)
  )
);

const handledGen2 = Effect.gen(function* (_) {
  const r = yield* _(
    mightFail,
    Effect.catchAll(() => Effect.succeed(-1))
  );
  return r * 2;
});

// but if you want to get back your error as a value to work with in your generator, just like you would with a success value
// you can use `Effect.either`
// and `Either` is a simple disjointed union type, that can represent either a left or a right value
// `Effect.either` will return a `Left` if the effect succeeded, and a `Right` if the effect failed
// you can then pattern match on the result, and handle the error

const handledGen3 = Effect.gen(function* (_) {
  const either = yield* _(Effect.either(mightFail));
  if (Either.isRight(either)) {
    return either.right * 2;
  } else {
    console.error(either.left.message);
    return -1;
  }
});
