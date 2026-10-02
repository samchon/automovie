import { resolveHumanFaceContact } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceContactPlaneFixture as fixture } from "../internal/humanFaceContactPlaneFixture";
import { nclose } from "../internal/predicates";

/**
 * A single exact floor is met exactly, for every direction of its normal. A
 * unit normal n and a floor excess m give the projection n * m, which reads
 * n . (n * m) = m only in real arithmetic; a floating reading may fall short
 * by one unit in the last place and then the shared solve answers, which must
 * also end on the floor and not spend the clearance tolerance short of it.
 *
 * Scenarios:
 * 1. Sixteen unit normals (cos a, sin a, 0), a = k times the golden angle,
 *    each hold a plane through the origin with the soft vertex 0.5 mm behind
 *    it. The oracle is the geometry: the point must end on the plane (signed
 *    clearance 0 to 1e-12 m, not the 0.05 mm tolerance short of it) after a
 *    travel of exactly 0.5 mm along the normal. About a third of these
 *    directions read short by a rounding unit in the dot product and so take
 *    the solve.
 * 2. Every admitted point stays on the plane's near side by the tolerance at
 *    most, so the exact witness has not moved a point past its floor.
 */
export const test_subject_human_contact_exact_floor = (): void => {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const excess = 0.0005;
  let onFloor = 0;
  let travelled = 0;
  let nearSide = 0;
  const count = 16;
  for (let k = 1; k <= count; k++) {
    const normal = [Math.cos(k * golden), Math.sin(k * golden), 0];
    const state = fixture(
      [normal],
      normal.map((value) => -excess * value),
      0.001,
    );
    resolveHumanFaceContact(
      state.basis,
      state.basis.contact!,
      state.posed,
      state.shaped,
    );
    const at = state.posed.get("budget-soft")!.slice(0, 3);
    const clearance = normal.reduce((sum, value, axis) => sum + value * at[axis], 0);
    const travel = Math.hypot(...at.map((value, axis) => value + excess * normal[axis]));
    if (nclose(clearance, 0, 1e-12)) onFloor++;
    if (nclose(travel, excess, 1e-12)) travelled++;
    if (clearance >= -state.basis.contact!.toleranceMetres) nearSide++;
  }
  TestValidator.equals("every exact floor is reached, not its tolerance short", onFloor, count);
  TestValidator.equals("every exact correction travels the floor excess", travelled, count);
  TestValidator.equals("every corrected point stays within the tolerance", nearSide, count);
};
