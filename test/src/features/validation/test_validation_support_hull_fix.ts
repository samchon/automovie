import { detectSupportToppling } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validationHasWarningCount } from "../internal/predicates";

const v: (x: number, z: number) => IAutoMovieVector3 = (x: number, z: number): IAutoMovieVector3 => ({ x, y: 0, z });

/**
 * The support footprint is built into a real convex hull, so the classification
 * no longer depends on the order the contact points are given. The old check
 * assumed the points were already a convex, correctly-wound polygon; a
 * mis-ordered (self-crossing) list could then misclassify an interior COM as
 * outside. This pins order-independence.
 *
 * Scenarios:
 *
 * 1. A CCW square and the same four corners in a self-crossing "bowtie" order both
 *    classify a centered COM as stable.
 * 2. An overhanging COM with the crossed corner order emits one advisory warning.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls support-toppling detection with ordered and crossed representations of one square. A centered COM must remain stable in both, while an overhanging crossed input must retain physical advice instead of accepting a self-crossing polygon interpretation.
 * @evidence contracts/testing.md#independent-expectations The four corners enclose (1,1) in XZ and exclude (5,1), independently of input order. Authored convex geometry supplies this oracle; the test does not infer actual mass distribution or simulate a physical body falling.
 * @evidence contracts/testing.md#distinguishing-cases The same centered COM contrasts ordered/crossed points, then an exterior COM distinguishes the crossed input's warning branch. Margin, degenerate support and fall-event details belong to support-topple cases; this unit isolates order independence.
 * @evidence contracts/testing.md#execution-ownership This named unit directly invokes portable geometric classification with local vectors. It creates no rigid-body host, Human geometry or renderer and registers no additional harness cases.
 */
export function test_validation_support_hull_fix(): void {
  const ordered: IAutoMovieVector3[] = [v(0, 0), v(2, 0), v(2, 2), v(0, 2)];
  const crossed: IAutoMovieVector3[] = [v(0, 0), v(2, 2), v(2, 0), v(0, 2)];

  TestValidator.predicate(
    "ordered support: centered COM is stable",
    validationHasWarningCount("ordered centered support",
    detectSupportToppling({ centerOfMass: v(1, 1), support: ordered })
      .validation, 0),
  );
  TestValidator.equals(
    "mis-ordered support: same classification (stable)",
    detectSupportToppling({ centerOfMass: v(1, 1), support: crossed }).toppling,
    null,
  );
  TestValidator.predicate("crossed centered support has no advice",
    validationHasWarningCount("crossed centered support",
      detectSupportToppling({ centerOfMass: v(1, 1), support: crossed }).validation, 0));

  const overhang: ReturnType<typeof detectSupportToppling> = detectSupportToppling({
    centerOfMass: v(5, 1),
    support: crossed,
  });
  TestValidator.predicate(
    "mis-ordered support still detects the overhang",
    validationHasWarningCount(
      "mis-ordered support overhang",
      overhang.validation,
      1,
    ),
  );
}
