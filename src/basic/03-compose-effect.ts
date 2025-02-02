import { Effect, pipe } from "effect";

const getNow = () => new Date();
const addDays = (days: number) => (date: Date) => {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + days);
  return newDate;
};
const format = (date: Date) => date.toISOString();
const log = (prog: string) => (message: string) =>
  console.log(`[${prog}] ${message}`);

const program = () => pipe(getNow(), addDays(7), format, log("program"));

program();

const effectProgram = pipe(
  Effect.succeed(getNow()),
  Effect.map(addDays(7)),
  Effect.map(format),
  Effect.map(log("effectProgram"))
);

Effect.runSync(effectProgram);
