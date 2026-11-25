import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { StrikingTarget } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Unturned feet. */
const STILL: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/** An entry heading a yaw, its feet at two ankles. */
const entry = (
  yaw: number,
  left: IAutoMovieVector3,
  right: IAutoMovieVector3,
) => ({
  posture: { yaw },
  feet: {
    left: { ankle: left, rotation: STILL },
    right: { ankle: right, rotation: STILL },
  },
});

/** The striker's heights and lengths. */
const M = {
  hipHeight: 0.95,
  thigh: 0.45,
  headHeight: 1.75,
  headRadius: 0.1,
  chestHeight: 1.3,
};

/**
 * Striking targets (`StrikingTarget`): the lead foot is the one more than 2 cm
 * ahead along the heading (the left otherwise); the line runs level from the
 * root to the target, or along the heading at the root; a staggered stance
 * faces 30 degrees toward its rear side from midway between the feet; and an
 * unaimed strike goes to its line's height at its range along that facing.
 *
 * Scenarios:
 *
 * 1. Heading +Z, a right foot 0.3 m ahead leads; level feet lead left; heading 90,
 *    a right foot 0.3 m along +X leads.
 * 2. A target at (3, 5, 4) lies along (0.6, 0, 0.8), heading atan2(0.6, 0.8); one
 *    at the root lies along the 90 degree heading, +X.
 * 3. A foot slid 0.2 m along +X and lifted 5 cm keeps its attitude.
 * 4. Square feet face +Z from their midpoint; staggered with the right leading,
 *    they face 30 degrees left, from (0, 0, 0.15).
 * 5. Unaimed low, a strike goes 0.3 thighs below the hips; high, half a head
 *    radius below the head's top; at the chest otherwise; at the range read for
 *    that height, or the range given.
 */
export function test_motions_striking_target(): void {
  const o: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  TestValidator.equals(
    "the lead",
    [
      StrikingTarget.lead(entry(0, o, { x: 0, y: 0, z: 0.3 })),
      StrikingTarget.lead(
        entry(0, { x: -0.1, y: 0, z: 0 }, { x: 0.1, y: 0, z: 0 }),
      ),
      StrikingTarget.lead(entry(90, o, { x: 0.3, y: 0, z: 0 })),
    ],
    ["right", "left", "right"],
  );
  const line: IAutoMovieVector3 = StrikingTarget.line(
    o,
    { x: 3, y: 5, z: 4 },
    0,
  );
  TestValidator.predicate(
    "the line",
    vclose(line, { x: 0.6, y: 0, z: 0.8 }, 1e-12) &&
      nclose(
        StrikingTarget.heading(line),
        (Math.atan2(0.6, 0.8) * 180) / Math.PI,
        1e-12,
      ) &&
      vclose(StrikingTarget.line(o, o, 90), { x: 1, y: 0, z: 0 }, 1e-12) &&
      nclose(StrikingTarget.heading({ x: 0, y: 0, z: -1 }), 180, 1e-12),
  );
  TestValidator.equals(
    "a slide",
    StrikingTarget.slide(
      { ankle: { x: 0, y: 0.08, z: 0 }, rotation: STILL },
      { x: 1, y: 0, z: 0 },
      0.2,
      0.05,
    ),
    { ankle: { x: 0.2, y: 0.13, z: 0 }, rotation: STILL },
  );
  const square = StrikingTarget.stance(
    entry(0, { x: -0.1, y: 0, z: 0 }, { x: 0.1, y: 0, z: 0 }),
  );
  const staggered = StrikingTarget.stance(
    entry(0, { x: -0.1, y: 0, z: 0 }, { x: 0.1, y: 0, z: 0.3 }),
  );
  TestValidator.predicate(
    "the stance",
    vclose(square.centre, o, 1e-12) &&
      vclose(square.forward, { x: 0, y: 0, z: 1 }, 1e-12) &&
      vclose(staggered.centre, { x: 0, y: 0, z: 0.15 }, 1e-12) &&
      vclose(staggered.forward, { x: -0.5, y: 0, z: Math.sqrt(3) / 2 }, 1e-12),
  );
  const range = (): number => 0.8;
  TestValidator.predicate(
    "unaimed",
    vclose(
      StrikingTarget.unaimed(M, { kind: "none", line: "low" }, square, range),
      { x: 0, y: 0.95 - 0.135, z: 0.8 },
      1e-12,
    ) &&
      vclose(
        StrikingTarget.unaimed(
          M,
          { kind: "none", line: "high" },
          square,
          range,
        ),
        { x: 0, y: 1.7, z: 0.8 },
        1e-12,
      ) &&
      vclose(
        StrikingTarget.unaimed(M, { kind: "none", range: 1.2 }, square, range),
        { x: 0, y: 1.3, z: 1.2 },
        1e-12,
      ),
  );
}
