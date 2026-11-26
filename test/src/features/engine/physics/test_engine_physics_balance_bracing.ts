import { AutoMoviePhysicalBalance } from "@automovie/engine";
import type {
  IAutoMoviePhysicalBalance,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * `physicalBalanceBracing` keeps bounded effort while the body can still stand
 * and withdraws it on collapse.
 *
 * Assessment: unrecoverable, capture point (2, 0, 0), support polygon the
 * square of half-side 0.5, floor 0, minimum centre height 0.4, root shift cap
 * 0.2, recovery exhausted.
 *
 * Scenarios:
 *
 * 1. Centre at height 1: full root strength and a shift of -0.2 along x (towards
 *    the polygon, at the cap), none in y or z.
 * 2. Centre at height 0.3, below the minimum: the strength is withdrawn to 0.
 */
export function test_engine_physics_balance_bracing(): void {
  const point: IAutoMovieVector3 = { x: 2, y: 0, z: 0 };
  const assessment: IAutoMoviePhysicalBalance.IResult = {
    state: "unrecoverable",
    capturePoint: point,
    outside: 1.5,
    polygon: [
      { x: -0.5, y: 0, z: -0.5 },
      { x: 0.5, y: 0, z: -0.5 },
      { x: 0.5, y: 0, z: 0.5 },
      { x: -0.5, y: 0, z: 0.5 },
    ],
  };
  const common: Omit<Parameters<typeof AutoMoviePhysicalBalance.bracing>[0], "center"> = {
    assessment,
    floor: 0,
    minimumCenterHeight: 0.4,
    maximumRootShift: 0.2,
    exhausted: true,
  };
  const standing = AutoMoviePhysicalBalance.bracing({
    ...common,
    center: { x: 0, y: 1, z: 0 },
  });
  const fallen = AutoMoviePhysicalBalance.bracing({
    ...common,
    center: { x: 0, y: 0.3, z: 0 },
  });
  TestValidator.equals("strength", standing.rootStrength, 1);
  TestValidator.predicate("shift x", nclose(standing.shift.x, -0.2, 1e-12));
  TestValidator.equals("shift y", standing.shift.y, 0);
  TestValidator.predicate("shift z", nclose(standing.shift.z, 0, 1e-12));
  TestValidator.equals("collapse", fallen.rootStrength, 0);
}
