import {
  type AutoMovieArchetypeEquine,
  createMule,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { equidAttachmentMatrix } from "../../../internal/equidAttachmentMatrix";

/**
 * Actual attachments and whole-solid soles of the measured female mule reference at walk and trot.
 *
 * Scenarios:
 * 1. The public producer builds saddle, harness, both and pack variants at
 *    tempo zero, seed 43 and the valid 0.575 m stirrup-drop boundary.
 * 2. Each tack rides walk and trot on both leads: sixteen positive cases.
 *    Actual parent-solid attachments, four lengths, chain closure, finite
 *    unit TRS and complete cylinder/capsule soles are independently observed.
 * 3. Exact touchdown/liftoff +/-1 microsecond, off-grid stance/swing and film
 *    boundaries retain planted footprints, floor support and continuous motion.
 * 4. Real rein/lead held runs fit their rods, preserve hand origins on the
 *    trunk and retain far endpoints on the head as it nods. All public tack
 *    frames compose with actual root placement; pack surfaces remain carried.
 * 5. Preparation, reverse seeking and returned-record mutation preserve source
 *    bytes and replay. Missing or refused positive cases remain failures.
 */
export function test_unit_archetypes_animals_animal_attachment_equids_mule_slow(): void {
  const findings: string[] = [];
  equidAttachmentMatrix(
    (tack: AutoMovieArchetypeEquine.Tack): ReturnType<typeof createMule> =>
      createMule({ sex: "female", tack, tempo: 0, stirrupDrop: 0.575 }, 43),
    "mule/female/seed43",
    ["walk", "trot"],
    findings,
  );
  TestValidator.equals(
    "mule walk and trot actual attachment and solid support",
    findings,
    [],
  );
}
