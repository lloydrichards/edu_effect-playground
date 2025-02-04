import { Effect, Context, Console, Layer, pipe } from "effect";
import * as fs from "node:fs/promises";

interface RandomImpl {
  readonly next: Effect.Effect<number>;
  readonly nextIntBetween: (min: number, max: number) => Effect.Effect<number>;
}

class Random extends Context.Tag("Random")<Random, RandomImpl>() {}

const program = Effect.gen(function* (_) {
  const random = yield* _(Random);
  const n = yield* _(random.nextIntBetween(1, 10));
  if (n < 5) {
    return "Low";
  } else {
    return "High";
  }
});

// if we try to run it right now, we'll get a type error
// Effect.runSync(program);

// to resolve the dependency, we need to provide the service
// the name "_Live" is commonly used to describe the 'live' implementation of a service
// i.e. the actual implementation of the service that is used at runtime
// also common is "_Test" to describe a test implementation of a service

const RandomLive: RandomImpl = {
  next: Effect.sync(() => Math.random()),
  nextIntBetween: (min, max) =>
    Effect.sync(() => Math.floor(Math.random() * (max - min + 1) + min)),
};

const RandomMock: RandomImpl = {
  next: Effect.succeed(0.5),
  nextIntBetween: (min, max) => Effect.succeed(5),
};

// runnable: Effect<'low' | 'high', never, never>
const runnable = program.pipe(Effect.provideService(Random, RandomLive));
const mocked = program.pipe(Effect.provideService(Random, RandomMock));

// now we can run the effect
console.log(Effect.runSync(runnable));
console.log(Effect.runSync(mocked));

class FeatureFlags extends Context.Tag("FeatureFlag")<
  FeatureFlags,
  {
    readonly isEnabled: (flag: string) => Effect.Effect<boolean>;
  }
>() {}

class ConfigFile extends Context.Tag("ConfigFile")<
  ConfigFile,
  {
    readonly contents: Record<string, boolean>;
  }
>() {}

// to create a layer from an effect, we use the `Layer.effect` function
// think of this like the opposite of `flatMap`
// instead of running after an effect, this effect is run prior to the effect
// notice how we can use other tags just like normal, but they appear in the RIn type parameter

// FeatureFlagsLive: Layer<FeatureFlags, never, ConfigFile>
const FeatureFlagsLive = Layer.effect(
  FeatureFlags,
  pipe(
    ConfigFile,
    Effect.map((config) => ({
      isEnabled: (flag: string) =>
        Effect.sync(() => config.contents[flag] ?? false),
    }))
  )
);

// ConfigFileLive: Layer<ConfigFile, Error>
const ConfigFileLive = Layer.effect(
  ConfigFile,
  Effect.gen(function* (_) {
    const contents = yield* _(
      Effect.tryPromise({
        try: () => fs.readFile("config.json", "utf-8"),
        catch: (e) => new Error("Could not read config file"),
      })
    );
    const parsed = yield* _(
      Effect.try({
        try: () => JSON.parse(contents),
        catch: (e) => new Error("Could not parse config file"),
      })
    );

    return {
      contents: parsed,
    };
  })
);

const main: Effect.Effect<string, never, FeatureFlags> = Effect.gen(function* (
  _
) {
  const flags = yield* _(FeatureFlags);
  const isEnabled = yield* _(flags.isEnabled("foo"));

  return isEnabled ? "Enabled" : "Disabled";
});

// we can provide layers to an effect using the `Effect.provide` function
// notice how this errors because we havent provided the ConfigFile layer to the FeatureFlags layer
// const runnable2 = main.pipe(Effect.provide(FeatureFlagsLive));

// finalLayer: Layer<FeatureFlags, Error, never>
const finalLayer = Layer.provide(FeatureFlagsLive, ConfigFileLive);

// now we can provide to main and run it

pipe(main, Effect.provide(finalLayer), Effect.runPromise).then(console.log);

// final note, something convient you can do with classes is define a static property with a layer implementation

class Foo extends Context.Tag("Foo")<Foo, { readonly foo: string }>() {
  static readonly live = Layer.effect(
    Foo,
    Effect.succeed({
      foo: "foo",
    })
  );
}

{
  const program = Effect.gen(function* (_) {
    const foo = yield* _(Foo);
    return foo.foo;
  });

  const runnable = program.pipe(Effect.provide(Foo.live));
}

// also another common pattern in inferring the type of a service from the function that creates it

const makeService = Effect.succeed({ foo: "foo" });
class Foo2 extends Context.Tag("Foo")<
  Foo2,
  Effect.Effect.Success<typeof makeService>
>() {
  static readonly Live = Layer.effect(Foo2, makeService);
}
