import { TestValidator } from "@nestia/e2e";

import { parseBodyCaptureArguments } from "../../../scripts/body-review/parseBodyCaptureArguments";

const refusal = (argv: string[]): string => {
  try {
    parseBodyCaptureArguments(argv);
  } catch (error) {
    return (error as Error).message;
  }
  return "";
};

/**
 * The body capture command line is validated before a browser opens.
 *
 * Scenarios:
 * 1. A bare name gets the six horizon views, the `beauty` and `clay` passes,
 *    every state, and no documents file and no candidate basis.
 * 2. Every option is read: states, views, passes, the documents file and a
 *    candidate basis file; the
 *    `--` separator a package script adds is ignored.
 * 3. The poles and every structural pass are accepted by name.
 * 4. Negative twins: an unknown view, an unknown pass, a repeated name, an
 *    empty list, an option without a value, an unknown option, no name, and
 *    two names are each refused with a message naming the fault.
 */
export const test_body_capture_arguments = (): void => {
  const plain = parseBodyCaptureArguments(["run"]);
  TestValidator.equals("defaults", plain, {
    name: "run",
    states: null,
    views: [
      "front",
      "left-three-quarter",
      "left",
      "back",
      "right-three-quarter",
      "right",
    ],
    passes: ["beauty", "clay"],
    documents: null,
    basis: null,
  });
  const full = parseBodyCaptureArguments([
    "--",
    "run",
    "--states",
    "neutral,sitting",
    "--views",
    "top,front",
    "--passes",
    "normal,depth,flat,wire,outline",
    "--documents",
    "states.json",
    "--basis",
    "candidate.json.gz",
  ]);
  TestValidator.equals("states", full.states, ["neutral", "sitting"]);
  TestValidator.equals("views", full.views, ["top", "front"]);
  TestValidator.equals("passes", full.passes, [
    "normal",
    "depth",
    "flat",
    "wire",
    "outline",
  ]);
  TestValidator.equals("documents", full.documents, "states.json");
  TestValidator.equals("basis", full.basis, "candidate.json.gz");

  for (const [title, argv, fragment] of [
    ["unknown view", ["run", "--views", "sideways"], "sideways"],
    ["unknown pass", ["run", "--passes", "shiny"], "shiny"],
    ["repeated", ["run", "--views", "front,front"], "repeats"],
    ["empty list", ["run", "--states", ","], "names nothing"],
    ["no value", ["run", "--views"], "needs a value"],
    [
      "option instead of value",
      ["run", "--views", "--passes", "clay"],
      "needs a value",
    ],
    ["unknown option", ["run", "--colour", "red"], "Unknown option"],
    ["no name", ["--views", "front"], "exactly one"],
    ["two names", ["a", "b"], "exactly one"],
  ] as const)
    TestValidator.predicate(title, refusal([...argv]).includes(fragment));
};
