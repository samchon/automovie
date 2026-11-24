import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of an arccosine, degrees. */
const ROUNDING: number = 1e-9;

/**
 * `HumanSignature.flexion` reads the angle a distal segment turns from its
 * proximal one at a joint, `acos` of their directions' cosine: 0 straight.
 *
 * Scenarios, a joint at (0, 0.5, 0) below a proximal point at (0, 1, 0):
 *
 * 1. A distal point straight on, (0, 0, 0): 0.
 * 2. One a right angle off, (0, 0.5, 0.3): 90.
 * 3. One 45 degrees off, (0, 0, 0.5): 45.
 * 4. One folded straight back, (0, 1.2, 0): 180.
 */
export function test_unit_motions_audit_human_signature_flexion(): void {
  const proximal = { x: 0, y: 1, z: 0 };
  const centre = { x: 0, y: 0.5, z: 0 };
  TestValidator.predicate(
    "the angles",
    nclose(
      HumanSignature.flexion(proximal, centre, { x: 0, y: 0, z: 0 }),
      0,
      ROUNDING,
    ) &&
      nclose(
        HumanSignature.flexion(proximal, centre, { x: 0, y: 0.5, z: 0.3 }),
        90,
        ROUNDING,
      ) &&
      nclose(
        HumanSignature.flexion(proximal, centre, { x: 0, y: 0, z: 0.5 }),
        45,
        ROUNDING,
      ) &&
      nclose(
        HumanSignature.flexion(proximal, centre, { x: 0, y: 1.2, z: 0 }),
        180,
        ROUNDING,
      ),
  );
}
