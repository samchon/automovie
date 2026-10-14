import { TestValidator } from "@nestia/e2e";

import type { IHumanBuildFileReplacement } from "../../../../packages/human/build/IHumanBuildFileReplacement";
import { replaceHumanBuildFile } from "../../../../packages/human/build/replaceHumanBuildFile";

/**
 * A file replacement owns disposal only after its exclusive reservation succeeds. Typed effects pin lifetime and original errors without reproducing filesystem sharing, directories or operating systems.
 *
 * Scenarios:
 * 1. Successful replacement releases the reservation handle before copy and rename.
 * 2. Reservation refusal leaves another owner's path alone.
 * 3. Handle release, copy and publication failures still dispose the owned sibling.
 * 4. Disposal failure propagates alone or alongside the original failure.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls replaceHumanBuildFile through its existing typed effect port and observes reserve/release/copy/publish/discard order, error count and error identity, catching disposal without ownership, missing cleanup and hidden original failures.
 * @evidence contracts/testing.md#independent-expectations Reservation grants ownership, release precedes copying, and owned disposal follows either success or failure; hand-written ordered traces and injected Error identities supply the oracle. No expected trace comes from the function's output, and OS filesystem guarantees remain outside this unit.
 * @evidence contracts/testing.md#distinguishing-cases Retains success, each individual reservation/release/copy/publication/disposal failure and simultaneous copy/disposal failure. Reservation refusal distinguishes another owner's path from a sibling this operation must discard; package rollback and byte membership belong to companion tests.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable test_package_build_file_replacement entry owns all seven existing table rows and local effect callbacks, invoking actual portable orchestration without a consumer installation, native build, process, filesystem, browser or GPU host.
 */
export function test_package_build_file_replacement(): void {
  for (const scenario of [
    { fail: [], steps: ["reserve", "release", "copy", "publish", "discard"] },
    { fail: ["reserve"], steps: ["reserve"] },
    { fail: ["release"], steps: ["reserve", "release", "discard"] },
    { fail: ["copy"], steps: ["reserve", "release", "copy", "discard"] },
    {
      fail: ["publish"],
      steps: ["reserve", "release", "copy", "publish", "discard"],
    },
    {
      fail: ["discard"],
      steps: ["reserve", "release", "copy", "publish", "discard"],
    },
    {
      fail: ["copy", "discard"],
      steps: ["reserve", "release", "copy", "discard"],
    },
  ]) {
    const observed: string[] = [];
    const errors: Map<string, Error> = new Map(
      scenario.fail.map((name: string): [string, Error] => [
        name,
        new Error(name),
      ]),
    );
    const effect: (name: string) => void = (name: string): void => {
      observed.push(name);
      const error: Error | undefined = errors.get(name);
      if (error) throw error;
    };
    const host: IHumanBuildFileReplacement = {
      reserve: (): (() => void) => {
        effect("reserve");
        return (): void => effect("release");
      },
      copy: (): void => effect("copy"),
      publish: (): void => effect("publish"),
      discard: (): void => effect("discard"),
    };
    let caught: unknown;
    try {
      replaceHumanBuildFile(host);
    } catch (error) {
      caught = error;
    }
    const failures: unknown[] =
      caught instanceof AggregateError
        ? caught.errors
        : caught === undefined
          ? []
          : [caught];
    TestValidator.equals("replacement effect order", observed, scenario.steps);
    TestValidator.equals(
      "replacement failure count",
      failures.length,
      scenario.fail.length,
    );
    TestValidator.predicate(
      "replacement failure identity",
      failures.every(
        (error: unknown, index: number): boolean =>
          error === errors.get(scenario.fail[index]!),
      ),
    );
  }
}
