import {
  detectSupportToppling,
  locateOnBeat,
  scriptAncestors,
} from "@automovie/engine";
import {
  IAutoMovieConstraintViolation,
  IAutoMovieScriptNode,
  type IAutoMovieSupportResult,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createScriptTree } from "../../../internal/createScriptTree";
import { validationHasWarningCount } from "../../../internal/predicates";

/**
 * A support warning can be addressed through the authored screenplay ancestry.
 *
 * Scenarios:
 * 1. A center outside a square support produces one physics warning.
 * 2. Locating it on beat-1 stamps b1, whose nearest-first ancestors are grp, scene1, act1 and root.
 * 3. The same warning remains unstamped when the tree is absent.
 */
export function test_unit_engine_film_film_feedback_cascade(): void {
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
