import type { IAutoMovieMotionHumanContactWindow } from "@automovie/interface";
import { AquaticCrew } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `AquaticCrew.grips` holds each hand the parameters name on the hull's
 * handles for the whole action, on a support the hand does not carry.
 *
 * Scenarios:
 *
 * 1. Only a left grip named: the left hand grips, the right does not.
 * 2. Both named: both grip, left first.
 * 3. None named: no grip.
 */
export function test_unit_motions_sport_aquatic_crew_grips(): void {
  const grip = (
    side: "left" | "right",
  ): IAutoMovieMotionHumanContactWindow => ({
    part: `${side}Hand`,
    kind: "grip",
    from: 0,
    to: 1,
    support: { kind: "prop", subject: "scull", carries: false },
  });
  const hull: Pick<AquaticCrew.IHull, "id"> = { id: "scull" };
  TestValidator.equals(
    "the named hands",
    [
      AquaticCrew.grips(hull, { kind: "doubleScull", leftGrip: "oarL" }),
      AquaticCrew.grips(hull, {
        kind: "doubleScull",
        leftGrip: "oarL",
        rightGrip: "oarR",
      }),
      AquaticCrew.grips(hull, { kind: "doubleScull" }),
    ],
    [[grip("left")], [grip("left"), grip("right")], []],
  );
}
