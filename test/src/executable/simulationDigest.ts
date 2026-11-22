import * as crypto from "node:crypto";
import * as fs from "node:fs";

import type { IAutoMovieMotionHumanSimulation } from "@automovie/interface";
import type { HumanPerformance } from "@automovie/motions";

import { motionHumanBody } from "../features/internal/motionHumanBody";
import { simulatedShoveTake } from "../features/internal/simulatedShoveTake";

/**
 * Prints the digest of one simulated window (#3434): the engine's identity
 * of its sampled input and a SHA-256 of its solved frames, for the
 * cross-platform job to compare between a Linux and a Windows runner. The
 * window is the simulated-window spec's shove on the average man.
 *
 * Run with `pnpm --filter @automovie/test simulation:digest`. Under GitHub
 * Actions it also writes `digest=<identity>:<state>` to `GITHUB_OUTPUT`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is digested, from which window, how to run it and where it writes.
 * @evidence contracts/development/implementation.md#principled-implementation The input identity is the engine's own content hash; the state is a hash of the frames' JSON, every solved number at full precision, so any platform difference in the solve changes it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One bake and two hashes; the take is the spec's.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The window and bodies are the spec's, not a reduced stand-in.
 * @evidence contracts/development/implementation.md#efficient-algorithms One bake of a one-second window.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the spec's take builder.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A one-shot script.
 */
const main = async (): Promise<void> => {
  const take: HumanPerformance = simulatedShoveTake.shove(motionHumanBody("m-average"));
  const solved: HumanPerformance = await take.simulate(simulatedShoveTake.WINDOW, {
    kind: "simulated",
  });
  const record: IAutoMovieMotionHumanSimulation = solved.simulations()[0]!;
  const state: string = crypto
    .createHash("sha256")
    .update(JSON.stringify(record.simulation.cache.frames))
    .digest("hex");
  const line: string = `digest=${record.simulation.cache.identity}:${state}`;
  console.log(line);
  if (process.env.GITHUB_OUTPUT !== undefined)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${line}\n`);
};
main().catch((error: unknown): void => {
  console.error(error);
  process.exit(1);
});
