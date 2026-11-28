import {
  StrikingRide
} from "../../../../../packages/motions/src/striking/internal/StrikingRide";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * A strike riding a moving target (`StrikingRide.push`): the met point carried
 * with the struck bone's frame from the stop, pushed along the contact normal
 * by how far it advanced beyond what the limb has withdrawn, never pulled.
 *
 * Scenarios:
 *
 * 1. Met at (1, 0, 0) facing +X, a bone moving 0.1 m along +X pushes 0.07 m past a
 *    0.03 m withdrawal, and nothing past a 0.2 m one.
 * 2. A bone turning 90 degrees about +Y at the origin carries the point away to
 *    (0, 0, -1), and pushes nothing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains how a virtual contact point follows a moving bone and contributes only positive remaining displacement along its normal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the same local point under forward translation and quarter turn with smaller and larger withdrawal.
 * @evidence contracts/development/testing.md#independent-expectations A 0.1 m movement less 0.03 m withdrawal gives 0.07 m. Larger withdrawal and a rotation carrying the point away add no push.
 */
export function test_motions_striking_ride(): void {
  const met = { point: { x: 1, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 } };
  const first = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const moved = { ...first, position: { x: 0.1, y: 0, z: 0 } };
  const turned = {
    ...first,
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
  };
  TestValidator.predicate(
    "the push",
    nclose(StrikingRide.push(met, first, moved, 0.03), 0.07, 1e-12) &&
      StrikingRide.push(met, first, moved, 0.2) === 0 &&
      StrikingRide.push(met, first, turned, 0) === 0,
  );
}
