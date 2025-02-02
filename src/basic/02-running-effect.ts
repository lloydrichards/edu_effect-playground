import { Effect } from "effect";

const successProgram = Effect.sync(() => {
  console.log("[successProgram] Hello, World!");
  return 42;
});

Effect.runSync(successProgram);

const failProgram = Effect.sync(() => {
  throw new Error("[failProgram] Boom!");
});

Effect.runPromise(failProgram).catch((e) => console.error(e.message));

const asyncProgram = Effect.async((resume) => {
  setTimeout(() => resume(Effect.succeed(42)), 1000);
});

Effect.runPromise(asyncProgram).then((v) =>
  console.log("[asyncProgram] Result:", v)
);
