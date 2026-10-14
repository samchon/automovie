import { TestValidator } from "@nestia/e2e";

import {
  parseScenarioSelection,
  prepareScenarioFilter,
  selectScenarioNames,
} from "../../scenarioSelection";

/**
 * A narrow test request never degrades into the default full selection.
 *
 * Scenarios:
 * 1. Empty argv, repeated groups, multiple terms, and equals forms preserve the
 *    complete request; every blank, valueless, unknown, or positional token fails.
 * 2. Include and exclude terms each match a synthetic basename, and their final
 *    intersection must retain a scenario without changing substring semantics.
 * 3. Invalid argv never reaches discovery; valid discovery admits no module and
 *    returns an execution filter for exactly the frozen selected basenames.
 * 4. Empty discovery and discovery failure cannot produce an execution filter.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls argv parsing, basename selection and discovery-filter preparation, observing accumulated terms, exact selected names, refusal before discovery and preserved discovery failure identity; silently widening a narrow request, admitting a discovery callback for execution or admitting later names fails.
 * @evidence contracts/testing.md#independent-expectations Literal argument groups and three authored basenames define expected accumulation and substring intersections; callback facts independently record discovery admission, and an explicit Error fixes failure identity without filesystem or parser-derived expected lists.
 * @evidence contracts/testing.md#distinguishing-cases Covers default/repeated/equals groups, blank/valueless/unknown/positional refusals, include/exclude matches and empty intersections, fixed execution membership, empty discovery and discovery failure; real DynamicExecutor filesystem import behavior is not exercised.
 * @evidence contracts/testing.md#execution-ownership The async test_workspace_scenario_selection entry owns every awaited preparation call and supplied discovery callback over resident names, with no module import, filesystem traversal, executor process or foreign-method replacement.
 */
export async function test_workspace_scenario_selection(): Promise<void> {
  TestValidator.equals("default request", parseScenarioSelection([]), {
    include: [],
    exclude: [],
  });
  TestValidator.equals(
    "all groups and equals options accumulate",
    parseScenarioSelection([
      "--include",
      "alpha",
      "beta",
      "--exclude",
      "slow",
      "--include=gamma",
      "--exclude=old",
      "--include",
      "delta",
      "--exclude",
      "stale",
    ]),
    {
      include: ["alpha", "beta", "gamma", "delta"],
      exclude: ["slow", "old", "stale"],
    },
  );
  for (const argv of [
    ["--include"],
    ["--exclude"],
    ["--include", "--exclude", "slow"],
    ["--include", "alpha", "--include"],
    ["--exclude", "slow", "--exclude"],
    ["--include="],
    ["--exclude=   "],
    ["--include", "\t"],
    ["--include", ""],
    ["--exclude", "\n"],
    ["--include=-wrong"],
    ["--inculde", "alpha"],
    ["--include", "alpha", "--typo"],
    ["alpha", "--include", "beta"],
    ["--"],
    ["-x"],
    ["--include=alpha", "beta"],
    ["--include", "alpha", "-x"],
  ]) {
    let discovered: boolean = false;
    let rejected: boolean = false;
    try {
      await prepareScenarioFilter(argv, async (): Promise<void> => {
        discovered = true;
      });
    } catch {
      rejected = true;
    }
    TestValidator.predicate(
      `invalid argv ${JSON.stringify(argv)}`,
      rejected && !discovered,
    );
  }

  const names: string[] = ["test_alpha.ts", "test_alpha_slow.ts", "test_beta.ts"];
  TestValidator.equals(
    "default retains all",
    [...selectScenarioNames(parseScenarioSelection([]), names)],
    names,
  );
  TestValidator.equals(
    "exclude-only request",
    [...selectScenarioNames(parseScenarioSelection(["--exclude=slow"]), names)],
    [names[0], names[2]],
  );
  TestValidator.equals(
    "include and exclude intersect",
    [
      ...selectScenarioNames(
        parseScenarioSelection(["--include", "alpha", "--exclude", "slow"]),
        names,
      ),
    ],
    [names[0]],
  );
  for (const argv of [
    ["--include=unknown"],
    ["--exclude=unknown"],
    ["--include", "alpha", "unknown"],
    ["--exclude", "slow", "unknown"],
    ["--include=alpha", "--exclude=alpha"],
  ]) {
    let rejected: boolean = false;
    try {
      selectScenarioNames(parseScenarioSelection(argv), names);
    } catch {
      rejected = true;
    }
    TestValidator.predicate(
      `unmatched or empty selection ${JSON.stringify(argv)}`,
      rejected,
    );
  }
  const admitted: boolean[] = [];
  const filter: Awaited<ReturnType<typeof prepareScenarioFilter>> = await prepareScenarioFilter(
    ["--include=alpha", "--exclude=slow"],
    async (probe: (name: string) => boolean): Promise<void> => {
      for (const name of names) admitted.push(probe(name));
    },
  );
  TestValidator.equals(
    "discovery admits no module",
    admitted,
    names.map((): boolean => false),
  );
  TestValidator.equals(
    "frozen execution set",
    [...names, "test_new_alpha.ts"].filter(filter),
    [names[0]],
  );
  let emptyRejected: boolean = false;
  try {
    await prepareScenarioFilter([], async (): Promise<undefined> => undefined);
  } catch {
    emptyRejected = true;
  }
  TestValidator.predicate("empty discovery refuses execution", emptyRejected);
  const failure: Error = new Error("synthetic discovery failure");
  let caught: unknown;
  try {
    await prepareScenarioFilter([], async (): Promise<never> => {
      throw failure;
    });
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate("discovery failure is preserved", caught === failure);
}
