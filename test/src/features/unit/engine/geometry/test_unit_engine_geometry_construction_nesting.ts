import { realizeAutoMovieConstruction } from "@automovie/engine";
import type { IAutoMovieConstructionRealization } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionChecks } from "../../../internal/construction/ConstructionChecks";
import { ConstructionRead } from "../../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../../internal/construction/ConstructionShapes";

/**
 * A construction nested to depth three realizes the same solid however its
 * joins are grouped: a beam, a post, a finger and a nail merged one onto the
 * next from the root or from the tip.
 *
 * Scenarios:
 *
 * 1. `merge(merge(merge(beam, post), finger), nail)` and `merge(beam, merge(post,
 *    merge(finger, nail)))` record no diagnostic, and every skin vertex of
 *    each, located by its owner coordinates on the other's surface of the same
 *    name, lands on its own position within 3e-11 (1e-9 of the beam's radius).
 * 2. The right-grouped assembly at 1.001 times the size does not read as the
 *    left-grouped one, so the agreement above is not vacuous.
 */
export function test_unit_engine_geometry_construction_nesting(): void {
  const realize = (
    k: number,
    nested: "left" | "right",
  ): IAutoMovieConstructionRealization.IRealization =>
    realizeAutoMovieConstruction(
      { name: `made.${nested}`, root: ConstructionShapes.assembly(k, nested) },
      { chord: 1e-4 * k },
    );
  const left: IAutoMovieConstructionRealization.IRealization = realize(
    1,
    "left",
  );
  const right: IAutoMovieConstructionRealization.IRealization = realize(
    1,
    "right",
  );
  TestValidator.equals("left diagnostics", left.diagnostics.length, 0);
  TestValidator.equals("right diagnostics", right.diagnostics.length, 0);
  const tol: number = 1e-9 * 0.03;
  TestValidator.equals(
    "left on right",
    ConstructionChecks.same(
      left.mesh,
      ConstructionRead.surfaces(right),
      tol,
      1e-3,
    ).slice(0, 10),
    [],
  );
  TestValidator.equals(
    "right on left",
    ConstructionChecks.same(
      right.mesh,
      ConstructionRead.surfaces(left),
      tol,
      1e-3,
    ).slice(0, 10),
    [],
  );
  TestValidator.predicate(
    "larger differs",
    ConstructionChecks.same(
      realize(1.001, "right").mesh,
      ConstructionRead.surfaces(left),
      tol,
      1e-3,
    ).length !== 0,
  );
}
