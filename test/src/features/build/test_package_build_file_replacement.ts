import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import type { IHumanBuildFileReplacement } from "../../../../packages/human/build/IHumanBuildFileReplacement";
import type { replaceHumanBuildFile as Replace } from "../../../../packages/human/build/replaceHumanBuildFile.mjs";
import { loadSourceModule } from "../internal/loadSourceModule";

/**
 *
 * A file replacement owns disposal only after its exclusive reservation
 * succeeds. Genuine replacement effects pin lifetime and original errors
 * without reproducing filesystem sharing, directories or operating systems.
 *
 * Scenarios:
 * 1. Successful replacement releases the reservation handle before copy and rename.
 * 2. Reservation refusal leaves another owner's path alone.
 * 3. Handle release, copy and publication failures still dispose the owned sibling.
 * 4. Disposal failure propagates alone or alongside the original failure.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `replaceHumanBuildFile` with an `IHumanBuildFileReplacement` whose `reserve`, release handle, `copy`, `publish` and `discard` record their names, then asserts the recorded sequence, how many errors surfaced and that each is the exact object thrown; it catches discarding a sibling that another owner reserved, skipping disposal after a release, copy or publish failure, copying before the reservation handle is released, and losing either error when disposal fails beside an earlier failure.
 * @evidence contracts/testing.md#independent-expectations Sequences follow the documented ownership rule that a failed reservation transfers no cleanup while every step after it is followed by `discard`; a single failure must be rethrown as itself and two must arrive as an `AggregateError` whose members are the original objects in failure order, compared by reference rather than by message.
 * @evidence contracts/testing.md#distinguishing-cases Seven cases: clean run, reservation refused (only `reserve` runs), release, copy and publish each failing (disposal still runs), disposal failing alone (one error), and copy plus disposal failing (two errors); the multi-file ordering that decides which files are replaced belongs to test_package_build_file_publication.
 */
export function test_package_build_file_replacement(): void {
  const replace = loadSourceModule<{ replaceHumanBuildFile: typeof Replace }>(
    path.resolve(__dirname, "../../../../packages/human/build/replaceHumanBuildFile.mjs"),
  ).replaceHumanBuildFile;
  for (const scenario of [
    { fail: [], steps: ["reserve", "release", "copy", "publish", "discard"] },
    { fail: ["reserve"], steps: ["reserve"] },
    { fail: ["release"], steps: ["reserve", "release", "discard"] },
    { fail: ["copy"], steps: ["reserve", "release", "copy", "discard"] },
    { fail: ["publish"], steps: ["reserve", "release", "copy", "publish", "discard"] },
    { fail: ["discard"], steps: ["reserve", "release", "copy", "publish", "discard"] },
    { fail: ["copy", "discard"], steps: ["reserve", "release", "copy", "discard"] },
  ]) {
    const observed: string[] = [];
    const errors = new Map(scenario.fail.map((name) => [name, new Error(name)]));
    const effect = (name: string): void => {
      observed.push(name);
      const error = errors.get(name);
      if (error) throw error;
    };
    const host: IHumanBuildFileReplacement = {
      reserve: () => { effect("reserve"); return () => effect("release"); },
      copy: () => effect("copy"), publish: () => effect("publish"), discard: () => effect("discard"),
    };
    let caught: unknown;
    try { replace(host); } catch (error) { caught = error; }
    const failures: unknown[] = caught instanceof AggregateError ? caught.errors : caught === undefined ? [] : [caught];
    TestValidator.equals("replacement effect order", observed, scenario.steps);
    TestValidator.equals("replacement failure count", failures.length, scenario.fail.length);
    TestValidator.predicate("replacement failure identity", failures.every((error, index) => error === errors.get(scenario.fail[index]!)));
  }
}
