import type { IAutoMovieMotionHumanContactWindow } from "@automovie/interface";
import { KickGeometry } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * A kick's foot windows (`KickGeometry.windows`): the kicking foot planted to
 * the launch and down again at the end; the support foot pivoting throughout,
 * or stepping: pivoting to the launch, bearing to the chamber and pivoting
 * after; a foot still landing from a cut step is not planted before.
 *
 * Scenarios:
 *
 * 1. Launching at 0.2 and chambered at 0.5 of a second, the right kicks planted to
 *    0.2 and at 1, the left pivots throughout.
 * 2. Stepping, the left pivots to 0.2, bears to 0.5 and pivots after.
 * 3. With the right still landing, its first plant is dropped.
 */
export function test_unit_motions_striking_kick_geometry(): void {
  const timing = { duration: 1, prep: 0.2, chamber: 0.5 };
  const ground: IAutoMovieMotionHumanContactWindow["support"] = {
    kind: "ground",
  };
  TestValidator.equals(
    "standing",
    KickGeometry.windows(timing, "right", "left", false),
    [
      { part: "rightFoot", kind: "plant", from: 0, to: 0.2, support: ground },
      { part: "rightFoot", kind: "plant", from: 1, to: 1, support: ground },
      { part: "leftFoot", kind: "pivot", from: 0, to: 1, support: ground },
    ],
  );
  TestValidator.equals(
    "stepping",
    KickGeometry.windows(timing, "right", "left", true).slice(2),
    [
      { part: "leftFoot", kind: "pivot", from: 0, to: 0.2, support: ground },
      { part: "leftFoot", kind: "bear", from: 0.2, to: 0.5, support: ground },
      { part: "leftFoot", kind: "pivot", from: 0.5, to: 1, support: ground },
    ],
  );
  const landing = KickGeometry.windows(timing, "right", "left", false, {
    bearing: "left",
    landings: {
      right: {
        ankle: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
    },
    rise: () => 0,
  });
  TestValidator.equals("landing", landing[0], {
    part: "rightFoot",
    kind: "plant",
    from: 1,
    to: 1,
    support: ground,
  });
}
