import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanRefusal, kneelPlace } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of a few sums, metres. */
const ROUNDING: number = 1e-12;

/**
 * `kneelPlace` puts the kneeling knee: by default behind the hip along the
 * heading by the front foot's lead less `behind`, at the knee's height; at a
 * named point, there at that height, refused where the other ankle, the knee
 * point carried across to its side, would lie beyond a leg's length (thigh and
 * shank) of the front foot.
 *
 * Scenarios, a 0.45 m thigh and 0.42 m shank, the hip at (0.1, 0.9, 0), the
 * front foot at (-0.1, 0.08, 0.3), facing +Z, the knee 0.05 m up and carried
 * 0.2 m across:
 *
 * 1. By default with 0.4 m behind, the knee lies at (0.1, 0.05, -0.1).
 * 2. At (0.3, 0, -0.2) it lies there, 0.05 m up.
 * 3. At (0.3, 0, -1.5), the ankle 1.81 m from the front foot, it is refused on
 *    `at`.
 */
export function test_unit_motions_everyday_kneel_place(): void {
  const input: kneelPlace.IInput = {
    body: { measure: { thigh: 0.45, shank: 0.42 } },
    hip: { x: 0.1, y: 0.9, z: 0 },
    front: { x: -0.1, y: 0.08, z: 0.3 },
    forward: { x: 0, y: 0, z: 1 },
    behind: 0.4,
    height: 0.05,
    across: { x: -0.2, y: 0, z: 0 },
  };
  TestValidator.predicate(
    "behind the hip",
    vclose(kneelPlace(input), { x: 0.1, y: 0.05, z: -0.1 }, ROUNDING),
  );
  const at: IAutoMovieVector3 = { x: 0.3, y: 0, z: -0.2 };
  TestValidator.predicate(
    "at a point",
    vclose(
      kneelPlace({ ...input, at }),
      { x: 0.3, y: 0.05, z: -0.2 },
      ROUNDING,
    ),
  );
  let refused: boolean = false;
  try {
    kneelPlace({ ...input, at: { x: 0.3, y: 0, z: -1.5 } });
  } catch (error: unknown) {
    refused = error instanceof HumanRefusal && error.axis === "at";
  }
  TestValidator.predicate("beyond a leg", refused);
}
