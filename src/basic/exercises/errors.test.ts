import { Effect, Either, Option, pipe, Schedule } from "effect";
import { expect, describe, test, it } from "bun:test";
import { error } from "effect/Console";

describe("Error Exercises", () => {
  // Exercise 1
  // Come up with a way to run this effect until it succeeds, no matter how many times it fails
  test("01 - eventually succeeds", async () => {
    let i = 0;
    const eventuallySuceeds = Effect.suspend(() =>
      i++ < 100 ? Effect.fail("error") : Effect.succeed(5)
    );

    const testOne = Effect.retry(eventuallySuceeds, { times: 100 });

    const result = Effect.runSync(testOne);

    expect(result).toBe(5);
  });

  // Exercise 2
  // Instead of short circuiting on the first error, collect all errors and fail with an array of them
  test("02 - collect all errors", async () => {
    const maybeFail = (j: number) =>
      j % 2 !== 0 ? Effect.fail(`odd ${j}`) : Effect.succeed(j);
    const maybeFailArr = new Array(10).fill(0).map((_, i) => maybeFail(i + 1));

    const testTwo = Effect.all(maybeFailArr, { mode: "validate" }).pipe(
      Effect.mapError((errors) => ({
        failure: errors.filter(Option.isSome).map((x) => x.value),
      })),
      Effect.flip
    );

    const result = Effect.runSync(testTwo);

    expect(result).toEqual({
      failure: ["odd 1", "odd 3", "odd 5", "odd 7", "odd 9"],
    });
  });

  // Exercise 3
  // Now succeed with both a array of success values and an array of errors

  test("03 - collect all errors and successes", async () => {
    const maybeFail = (j: number) =>
      j % 2 !== 0 ? Effect.fail(`odd ${j}`) : Effect.succeed(j);
    const maybeFailArr = new Array(10).fill(0).map((_, i) => maybeFail(i + 1));

    const testThree = Effect.all(maybeFailArr, { mode: "either" }).pipe(
      Effect.andThen((result) => ({
        success: result.filter(Either.isRight).map((x) => x.right),
        failure: result.filter(Either.isLeft).map((x) => x.left),
      }))
    );

    const result = Effect.runSync(testThree);

    expect(result).toEqual({
      success: [2, 4, 6, 8, 10],
      failure: ["odd 1", "odd 3", "odd 5", "odd 7", "odd 9"],
    });
  });
});
