import { TestValidator } from "@nestia/e2e";

import { parseBodyObservationArguments } from "../../../scripts/body-review/parseBodyObservationArguments";

const refusal = (argv: string[]): string => {
  try {
    parseBodyObservationArguments(argv);
  } catch (error) {
    return (error as Error).message;
  }
  return "";
};

/**
 * The observation command line names one kind of unit and never defaults to
 * drawing all of them.
 *
 * Scenarios:
 * 1. A run name and a kind parse; an id narrows a part or joint unit; the `--`
 *    separator a package script adds is ignored.
 * 2. Every kind is accepted.
 * 3. Negative twins: a missing kind, an unknown kind, an id for the whole unit,
 *    an unknown option, an option without a value, no run name and two run
 *    names are each refused with the fault named.
 */
export const test_body_observation_arguments = (): void => {
  TestValidator.equals(
    "kind only",
    parseBodyObservationArguments(["run", "--unit", "part"]),
    { name: "run", unit: "part", id: null },
  );
  TestValidator.equals(
    "kind and id",
    parseBodyObservationArguments([
      "--",
      "run",
      "--unit",
      "joint",
      "--id",
      "spine>chest",
    ]),
    { name: "run", unit: "joint", id: "spine>chest" },
  );
  for (const unit of ["part", "joint", "whole"] as const)
    TestValidator.equals(
      `kind ${unit}`,
      parseBodyObservationArguments(["r", "--unit", unit]).unit,
      unit,
    );
  for (const [title, argv, fragment] of [
    ["no kind", ["run"], "--unit"],
    ["unknown kind", ["run", "--unit", "seam"], "--unit"],
    ["id for whole", ["run", "--unit", "whole", "--id", "x"], "no --id"],
    [
      "unknown option",
      ["run", "--unit", "part", "--all", "1"],
      "Unknown option",
    ],
    ["no value", ["run", "--unit"], "needs a value"],
    ["option as value", ["run", "--unit", "--id", "x"], "needs a value"],
    ["no name", ["--unit", "part"], "exactly one"],
    ["two names", ["a", "b", "--unit", "part"], "exactly one"],
  ] as const)
    TestValidator.predicate(title, refusal([...argv]).includes(fragment));
};
