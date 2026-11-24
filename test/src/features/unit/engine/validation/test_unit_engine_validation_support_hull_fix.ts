import { detectSupportToppling } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validationHasWarningCount } from "../../../internal/predicates";

const v: (x: number, z: number) => IAutoMovieVector3 = (
  x: number,
  z: number,
): IAutoMovieVector3 => ({ x, y: 0, z });

/**
 * Convex-hull support classification is independent of contact-point order. The
 * old polygon interpretation could misclassify a centred COM when the same
 * corners arrived in a crossed order.
 *
 * Scenarios:
 *
 * 1. A CCW square and the same four corners in a self-crossing "bowtie" order both
 *    classify a centered COM as stable.
 * 2. An overhanging COM with the crossed corner order emits one advisory warning.
 */
export function test_unit_engine_validation_support_hull_fix(): void {
  const ordered: IAutoMovieVector3[] = [v(0, 0), v(2, 0), v(2, 2), v(0, 2)];
  const crossed: IAutoMovieVector3[] = [v(0, 0), v(2, 2), v(2, 0), v(0, 2)];

  TestValidator.predicate(
    "ordered support: centered COM is stable",
    validationHasWarningCount(
      "ordered centered support",
      detectSupportToppling({ centerOfMass: v(1, 1), support: ordered })
        .validation,
      0,
    ),
  );
  TestValidator.equals(
    "mis-ordered support: same classification (stable)",
    detectSupportToppling({ centerOfMass: v(1, 1), support: crossed }).toppling,
    null,
  );
  TestValidator.predicate(
    "crossed centered support has no advice",
    validationHasWarningCount(
      "crossed centered support",
      detectSupportToppling({ centerOfMass: v(1, 1), support: crossed })
        .validation,
      0,
    ),
  );

  const overhang: ReturnType<typeof detectSupportToppling> =
    detectSupportToppling({
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
