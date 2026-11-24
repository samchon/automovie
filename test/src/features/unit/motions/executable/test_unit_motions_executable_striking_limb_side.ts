import type { AutoMovieHumanSide } from "@automovie/interface";
import { StrikingLimb } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** The four end joints a strike can carry. */
const LIMBS: StrikingLimb.End[] = ["leftHand", "rightHand", "leftFoot", "rightFoot"];

/**
 * `StrikingLimb.side` names the side of a striking hand or foot.
 *
 * Scenarios:
 *
 * 1. Each of the four end joints gives its own side.
 */
export function test_unit_motions_executable_striking_limb_side(): void {
  TestValidator.equals(
    "each end joint's side",
    LIMBS.map(
      (limb: StrikingLimb.End): AutoMovieHumanSide => StrikingLimb.side(limb),
    ),
    ["left", "right", "left", "right"],
  );
}
