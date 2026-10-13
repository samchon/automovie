import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import type { IHumanBuildFileReplacement } from "../../../../packages/human/build/IHumanBuildFileReplacement";
import type { replaceHumanBuildFile as Replace } from "../../../../packages/human/build/replaceHumanBuildFile.mjs";
import { loadSourceModule } from "../internal/loadSourceModule";

/**
 * A file replacement owns disposal only after its exclusive reservation
 * succeeds. Genuine replacement effects pin lifetime and original errors
 * without reproducing filesystem sharing, directories or operating systems.
 *
 * Scenarios:
 * 1. Successful replacement releases the reservation handle before copy and rename.
 * 2. Reservation refusal leaves another owner's path alone.
 * 3. Handle release, copy and publication failures still dispose the owned sibling.
 * 4. Disposal failure propagates alone or alongside the original failure.
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
