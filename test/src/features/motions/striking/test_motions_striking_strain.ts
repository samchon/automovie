import {
  StrikingStrain
} from "../../../../../packages/motions/src/striking/internal/StrikingStrain";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** A right arm: the grip at the wrist, fingers along -X, a 0.25 m forearm. */
const ARM: StrikingStrain.IArm = {
  grip: { x: 0, y: 0, z: 0 },
  fingers: { x: -1, y: 0, z: 0 },
  forearm: 0.25,
  upperArm: 0.3,
};

/**
 * A held frame's strain (`StrikingStrain.of`): the elbow lies a forearm back
 * along the fingers from the wrist, and the strain is how far it misses the
 * shoulder by an upper arm.
 *
 * Scenarios:
 *
 * 1. A hand at the origin, unturned, puts the elbow at (0.25, 0, 0); a shoulder
 *    0.3 m above it strains nothing, one 0.5 m above strains 0.2 m, one 0.1 m
 *    above strains 0.2 m too.
 * 2. Turned 90 degrees about +Y the fingers point along +Z, the elbow lies at (0,
 *    0, -0.25), and a shoulder 0.3 m above that strains nothing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the virtual elbow from the hand frame and measures mismatch against the posed upper-arm length.
 * @evidence contracts/development/testing.md#behavioral-verification Reads strain at several shoulder positions for an unturned grip and a grip rotated 90 degrees about y.
 * @evidence contracts/development/testing.md#independent-expectations The local forearm offset places the elbow at (0.25, 0, 0) or (0, 0, -0.25). Distances 0.5 and 0.1 differ from the 0.3 m upper arm by 0.2.
 */
export function test_motions_striking_strain(): void {
  const still = {
    point: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  TestValidator.predicate(
    "unturned",
    nclose(
      StrikingStrain.of(still, { x: 0.25, y: 0.3, z: 0 }, ARM),
      0,
      1e-12,
    ) &&
      nclose(
        StrikingStrain.of(still, { x: 0.25, y: 0.5, z: 0 }, ARM),
        0.2,
        1e-12,
      ) &&
      nclose(
        StrikingStrain.of(still, { x: 0.25, y: 0.1, z: 0 }, ARM),
        0.2,
        1e-12,
      ),
  );
  const turned = {
    point: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
  };
  TestValidator.predicate(
    "turned",
    nclose(
      StrikingStrain.of(turned, { x: 0, y: 0.3, z: -0.25 }, ARM),
      0,
      1e-12,
    ),
  );
}
