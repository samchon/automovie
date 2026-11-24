import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { AquaticTeamBase } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../../internal/qclose";
import { vclose } from "../../../internal/vclose";

/** A quarter turn about +Y: (x, y, z) goes to (z, y, -x). */
const QUARTER: IAutoMovieQuaternion = {
  x: 0,
  y: Math.SQRT1_2,
  z: 0,
  w: Math.SQRT1_2,
};

/**
 * `AquaticTeamBase.transfer` hands a contact point over from where an end bone
 * holds it to a target: its turn slerped toward a facing and its contact point
 * lerped toward the target by a weight, the limb goal placed so the contact
 * lands there.
 *
 * The hand stands at (1, 1, 0) unturned, its contact 0.1 m along its +X; the
 * target is (0, 2, 0), facing a quarter about +Y.
 *
 * Scenarios:
 *
 * 1. At no weight the goal is the hand where it is, unturned.
 * 2. At full weight the goal is turned the quarter and puts the contact on the
 *    target: the hand at (0, 2, 0.1).
 */
export function test_unit_motions_sport_aquatic_team_base_transfer(): void {
  const hand: IAutoMovieResolvedBone = {
    bone: "rightHand",
    localRotation: { x: 0, y: 0, z: 0, w: 1 },
    worldPosition: { x: 1, y: 1, z: 0 },
    worldRotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const transfer = (weight: number): IAutoMovieHumanLimbGoal =>
    AquaticTeamBase.transfer(
      hand,
      { x: 1, y: 0.5, z: -1 },
      { x: 0.1, y: 0, z: 0 },
      { x: 0, y: 2, z: 0 },
      QUARTER,
      weight,
    );
  TestValidator.predicate(
    "held, and handed over",
    vclose(transfer(0).point, { x: 1, y: 1, z: 0 }, 1e-12) &&
      qclose(transfer(0).rotation!, hand.worldRotation, 1e-12) &&
      vclose(transfer(1).point, { x: 0, y: 2, z: 0.1 }, 1e-12) &&
      qclose(transfer(1).rotation!, QUARTER, 1e-12),
  );
}
