import {
  IAutoMovieConstraintViolation,
  IAutoMovieScriptNode,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { locateOnBeat } from "@automovie/engine";
import { createScriptTree } from "../internal/createScriptTree";

const sample: () => IAutoMovieConstraintViolation[] =
  (): IAutoMovieConstraintViolation[] => [
    {
      kind: "physics",
      severity: "warning",
      path: "$input.support.overshoot",
      expected: "would topple",
      value: 0.2,
    },
    {
      kind: "type",
      severity: "error",
      path: "$input.id",
      expected: "must be a shot id",
      value: null,
    },
  ];

/**
 * Beat location preserves feedback fields and leaves original violations unstamped.
 *
 * Scenarios:
 * 1. A claiming tree stamps b1 on both input violations while preserving severity and path.
 * 2. Original records still have no node.
 * 3. A missing tree and an unclaimed beat leave both outputs unstamped.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls locateOnBeat and checks output nodes, severity/path strings and unchanged input node fields, catching a wrong claimant or mutation of the supplied violations. It does not assert every nested field or object identity.
 * @evidence contracts/testing.md#independent-expectations The existing tree explicitly associates beat-1 with b1, and neither an absent tree nor beat-99 provides a claimant. The two authored severity/path literals determine preserved output independently of the function.
 * @evidence contracts/testing.md#distinguishing-cases Covers a claimed beat, absent tree and unclaimed beat with both warning and error records; empty feedback, overwritten pre-existing node fields and malformed-tree admission are separate responsibilities.
 * @evidence contracts/testing.md#execution-ownership This discoverable synchronous unit owns its in-memory location cases and imports portable source directly, with no external host or dynamically registered scenario.
 */
export function test_film_locate_on_beat(): void {
  const tree: IAutoMovieScriptNode[] = createScriptTree();
  const violations: IAutoMovieConstraintViolation[] = sample();
  const located: IAutoMovieConstraintViolation[] = locateOnBeat(
    violations,
    tree,
    "beat-1",
  );
  TestValidator.equals(
    "every violation gains the beat node",
    located.map(
      (violation: IAutoMovieConstraintViolation): string | undefined =>
        violation.node,
    ),
    ["b1", "b1"],
  );
  TestValidator.equals(
    "severity and path ride along untouched",
    located.map(
      (violation: IAutoMovieConstraintViolation): string =>
        `${violation.severity}:${violation.path}`,
    ),
    ["warning:$input.support.overshoot", "error:$input.id"],
  );
  TestValidator.equals(
    "originals are not mutated",
    violations.every(
      (violation: IAutoMovieConstraintViolation): boolean =>
        violation.node === undefined,
    ),
    true,
  );

  const treeless: IAutoMovieConstraintViolation[] = locateOnBeat(
    sample(),
    null,
    "beat-1",
  );
  TestValidator.equals(
    "treeless call passes through unstamped",
    treeless.length === violations.length &&
      treeless.every(
        (violation: IAutoMovieConstraintViolation): boolean =>
          violation.node === undefined,
      ),
    true,
  );
  const unclaimed: IAutoMovieConstraintViolation[] = locateOnBeat(
    sample(),
    tree,
    "beat-99",
  );
  TestValidator.equals(
    "unclaimed beat passes through unstamped",
    unclaimed.length === violations.length &&
      unclaimed.every(
        (violation: IAutoMovieConstraintViolation): boolean =>
          violation.node === undefined,
      ),
    true,
  );
}
