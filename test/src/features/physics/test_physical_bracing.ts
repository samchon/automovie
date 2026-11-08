import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { AutoMoviePhysicalBalance as Balance } from "../../../../packages/engine/src/physics/AutoMoviePhysicalBalance";
import { physicalBalanceBracing } from "../../../../packages/engine/src/physics/physicalBalanceBracing";

/** Bounded effort survives prediction/step failure while the body can still stand.
 *
 * Scenarios:
 * 1. Capture correction points into the actual polygon and obeys its travel cap.
 * 2. A failed step keeps effort above the recovery height; collapse withdraws it.
 */
export function test_physical_bracing(): void {
  const point: IAutoMovieVector3 = { x: 2, y: 0, z: 0 };
  const assessment: Balance.IResult = {
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
  const common: Omit<Parameters<typeof physicalBalanceBracing>[0], "center"> = {
    assessment,
    floor: 0,
    minimumCenterHeight: 0.4,
    maximumRootShift: 0.2,
    exhausted: true,
  };
  const standing: ReturnType<typeof physicalBalanceBracing> =
    physicalBalanceBracing({ ...common, center: { x: 0, y: 1, z: 0 } });
  const fallen: ReturnType<typeof physicalBalanceBracing> =
    physicalBalanceBracing({ ...common, center: { x: 0, y: 0.3, z: 0 } });
  TestValidator.predicate(
    "standing effort and bounded physical correction",
    standing.rootStrength === 1 &&
      Math.abs(standing.shift.x + 0.2) < 1e-12 &&
      standing.shift.y === 0 &&
      Math.abs(standing.shift.z) < 1e-12,
  );
  TestValidator.equals(
    "only measured collapse after exhausted recovery withdraws",
    fallen.rootStrength,
    0,
  );
}
