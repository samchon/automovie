import {
  IAutoMovieSupportResult,
  detectSupportToppling,
  locateOnBeat,
  scriptAncestors,
} from "@automovie/engine";
import {
  IAutoMovieConstraintViolation,
  IAutoMovieScriptNode,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createScriptTree } from "../internal/createScriptTree";
import { validationHasWarningCount } from "../internal/predicates";

/**
 * A support warning can be addressed through the authored screenplay ancestry.
 *
 * Scenarios:
 * 1. A center outside a square support produces one physics warning.
 * 2. Locating it on beat-1 stamps b1, whose nearest-first ancestors are grp, scene1, act1 and root.
 * 3. The same warning remains unstamped when the tree is absent.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs detectSupportToppling, locateOnBeat and scriptAncestors in sequence and checks warning count/severity, beat identity and exact ancestry order, catching a lost or wrongly addressed physics warning.
 * @evidence contracts/testing.md#independent-expectations The center x=.5 lies beyond the support's x=.1 edge and .02 default allowance, independently requiring a warning; the authored tree's parent links determine the four ancestor ids. No agent correction or dynamic toppling is executed.
 * @evidence contracts/testing.md#distinguishing-cases Pairs located and treeless results for the same warning and pins its complete four-level chain. Support stability/margin boundaries and malformed screenplay graphs belong to their focused tests.
 * @evidence contracts/testing.md#execution-ownership This discoverable portable unit owns the three-function composition over in-memory support and the existing tree fixture; it launches no screenplay agent, physics host, browser or GPU.
 */
export function test_film_feedback_cascade(): void {
  const tree: IAutoMovieScriptNode[] = createScriptTree();

  // A crate whose center of mass overhangs its small support square: a real
  // physics warning produced "while working beat-1".
  const support: { x: number; y: number; z: number }[] = [
    { x: -0.1, y: 0, z: -0.1 },
    { x: 0.1, y: 0, z: -0.1 },
    { x: 0.1, y: 0, z: 0.1 },
    { x: -0.1, y: 0, z: 0.1 },
  ];
  const result: IAutoMovieSupportResult = detectSupportToppling({
    node: "crate",
    centerOfMass: { x: 0.5, y: 0.4, z: 0 },
    support,
  });
  TestValidator.predicate(
    "a real physics warning was raised",
    validationHasWarningCount("feedback cascade", result.validation, 1),
  );
  const warnings: IAutoMovieConstraintViolation[] =
    result.validation.success === true
      ? (result.validation.warnings ?? [])
      : [];
  TestValidator.equals(
    "and it is warning severity",
    warnings[0]!.severity,
    "warning",
  );

  const located: IAutoMovieConstraintViolation[] = locateOnBeat(
    warnings,
    tree,
    "beat-1",
  );
  TestValidator.equals(
    "the warning locates on the beat node",
    located[0]!.node,
    "b1",
  );

  const chain: string[] = scriptAncestors(tree, located[0]!.node!);
  TestValidator.equals("the warning cascades up the screenplay", chain, [
    "grp",
    "scene1",
    "act1",
    "root",
  ]);

  const unlocated: IAutoMovieConstraintViolation[] = locateOnBeat(
    warnings,
    null,
    "beat-1",
  );
  TestValidator.equals(
    "without a tree the feedback stays motion-local",
    unlocated[0]!.node,
    undefined,
  );
}
