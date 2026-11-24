import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of a sine and a cosine. */
const ROUNDING: number = 1e-12;

/**
 * `HumanSignature.forward` lays a heading on the floor: `(sin yaw, 0, cos
 * yaw)`, yaw 0 facing +Z.
 *
 * Scenarios: yaw 0 faces +Z, 90 faces +X, 180 faces -Z, -90 faces -X.
 */
export function test_unit_motions_audit_human_signature_forward(): void {
  TestValidator.predicate(
    "the four headings",
    vclose(HumanSignature.forward(0), { x: 0, y: 0, z: 1 }, ROUNDING) &&
      vclose(HumanSignature.forward(90), { x: 1, y: 0, z: 0 }, ROUNDING) &&
      vclose(HumanSignature.forward(180), { x: 0, y: 0, z: -1 }, ROUNDING) &&
      vclose(HumanSignature.forward(-90), { x: -1, y: 0, z: 0 }, ROUNDING),
  );
}
