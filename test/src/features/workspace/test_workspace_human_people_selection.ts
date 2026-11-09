import { TestValidator } from "@nestia/e2e";

import { parseScenarioSelection } from "../../parseScenarioSelection";
import { prepareScenarioFilter } from "../../prepareScenarioFilter";
import { readTestArguments } from "../../readTestArguments";
import { HumanPeople } from "../internal/HumanPeople";

/**
 * Explicit Human CLI selection reaches the actual registry and fixture without mutating the environment or widening scenario selection.
 *
 * Scenarios:
 * 1. Space and equals Human values preserve the original include/exclude lists and named people's registry order.
 * 2. The CLI takes precedence over an explicitly supplied old environment value; absent CLI retains the existing named, default ten-person and extended sixty-six-person selections.
 * 3. Missing, blank, duplicate, unknown and positional options, invalid names and empty comma-list members refuse before discovery.
 * 4. A Human option cannot repair a valueless scenario group, and the original scenario parser still rejects Human options on its own.
 * 5. The actual public preflight discovers no executable module and returns exactly the independently authored alpha/beta scenario set.
 *
 * Every population observation reads names and typed inputs only; no person is generated.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual CLI reader, registry fixture and public preflight, asserting population names, unchanged scenario lists, refusal before discovery and exact returned filter membership; the real invocation's fixture names are also reported.
 * @evidence contracts/testing.md#independent-expectations Literal f1/m2 order, ten core and sixty-six extended people, and the authored alpha/beta scenario set are the oracles. The supplied discovery callback does not prove real DynamicExecutor imports, and name selection does not establish figure geometry.
 * @evidence contracts/testing.md#distinguishing-cases Space/equals forms, CLI precedence, old named/default/extended behavior, duplicates, malformed options, unknown/empty person names and valueless scenario groups distinguish admission boundaries. Existing workspace selection cases own general matching and discovery-error propagation.
 * @evidence contracts/testing.md#execution-ownership This discoverable portable workspace unit exercises real helper seams with a supplied callback; it launches no process/browser/native artifact, generates no person and mutates no environment or global selection state.
 */
export async function test_workspace_human_people_selection(): Promise<void> {
  const defects: string[] = [];
  for (const human of [["--human-people", "m2,f1"], ["--human-people=m2,f1"]]) {
    const request: ReturnType<typeof readTestArguments> = readTestArguments([
      "--include",
      "alpha",
      ...human,
      "--exclude",
      "slow",
      "--include=beta",
    ]);
    TestValidator.equals(
      "scenario lists survive Human option",
      request.selection,
      { include: ["alpha", "beta"], exclude: ["slow"] },
    );
    TestValidator.equals(
      "named Human order",
      HumanPeople.select(request.humanPeople),
      ["f1", "m2"],
    );
  }
  TestValidator.equals(
    "CLI precedes the old environment input",
    HumanPeople.names(["--human-people", "f1"], "m2"),
    ["f1"],
  );
  TestValidator.equals(
    "existing named environment input",
    HumanPeople.names([], " m2 , f1 "),
    ["f1", "m2"],
  );
  TestValidator.equals(
    "duplicate names keep registry uniqueness",
    HumanPeople.select("f1,f1"),
    ["f1"],
  );
  const defaults: string[] = HumanPeople.names([], "");
  const extended: string[] = HumanPeople.names([], "extended");
  if (
    defaults.length !== 10 ||
    !["f1", "f2", "m1", "m2"].every((name: string): boolean =>
      defaults.includes(name),
    )
  )
    defects.push(
      "The existing ten-person default or four reference names changed",
    );
  if (
    extended.length !== 66 ||
    !defaults.every((name: string): boolean => extended.includes(name))
  )
    defects.push("The existing extended registry changed");

  for (const argv of [
    ["--human-people"],
    ["--human-people="],
    ["--human-people", " "],
    ["--human-people", "--include=alpha"],
    ["--human-people=f1", "--human-people=m2"],
    ["--human-people=f1", "m2"],
    ["--human-peopl=f1"],
    ["--include", "--human-people=f1", "alpha"],
    ["--human-people=f1", "--exclude"],
    ["--human-people=unknown"],
    ["--human-people=f1,unknown"],
    ["--human-people=,f1"],
    ["--human-people=f1,"],
  ]) {
    let discovered: boolean = false;
    let refused: boolean = false;
    try {
      await prepareScenarioFilter(argv, async (): Promise<void> => {
        discovered = true;
      });
    } catch {
      refused = true;
    }
    if (!refused || discovered)
      defects.push(
        `Invalid Human request reached discovery: ${JSON.stringify(argv)}`,
      );
  }
  let strict: boolean = false;
  try {
    parseScenarioSelection(["--human-people=f1"]);
  } catch {
    strict = true;
  }
  if (!strict)
    defects.push(
      "The original scenario grammar was changed to depend on Human selection",
    );

  const names: string[] = [
    "test_alpha.ts",
    "test_alpha_slow.ts",
    "test_beta.ts",
  ];
  const admissions: boolean[] = [];
  const filter: (name: string) => boolean = await prepareScenarioFilter(
    [
      "--include",
      "alpha",
      "--human-people=f1",
      "--exclude",
      "slow",
      "--include=beta",
    ],
    async (probe: (name: string) => boolean): Promise<void> => {
      for (const name of names) admissions.push(probe(name));
    },
  );
  TestValidator.equals("discovery executes no module", admissions, [
    false,
    false,
    false,
  ]);
  TestValidator.equals(
    "public entry's exact scenario selection",
    [...names, "test_later_alpha.ts"].filter(filter),
    ["test_alpha.ts", "test_beta.ts"],
  );
  console.log(
    JSON.stringify({
      actualHumanPeople: HumanPeople.names(),
      scope: "actual invocation names only; no figure generation",
    }),
  );
  TestValidator.equals("Human test CLI selection defects", defects, []);
}
