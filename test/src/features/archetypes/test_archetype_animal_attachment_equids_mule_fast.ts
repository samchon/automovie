import {
  type AutoMovieArchetypeEquine,
  createMule,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { equidAttachmentMatrix } from "../internal/equidAttachmentMatrix";

/**
 * Actual attachments and whole-solid soles of the measured female mule reference at canter and gallop.
 *
 * Scenarios:
 * 1. The public producer builds saddle, harness, both and pack variants at
 *    tempo zero, seed 43 and the valid 0.575 m stirrup-drop boundary.
 * 2. Each tack rides canter and gallop on both leads: sixteen positive cases.
 *    Actual parent-solid attachments, four lengths, chain closure, finite
 *    unit TRS and complete cylinder/capsule soles are independently observed.
 * 3. Exact touchdown/liftoff +/-1 microsecond, off-grid stance/swing and film
 *    boundaries retain planted footprints, floor support and continuous motion.
 * 4. Real rein/lead held runs fit their rods, preserve hand origins on the
 *    trunk and retain far endpoints on the head as it nods. All public tack
 *    frames compose with actual root placement; pack surfaces remain carried.
 * 5. Preparation, reverse seeking and returned-record mutation preserve source
 *    bytes and replay. Missing or refused positive cases remain failures.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the representative source, seed, tempo, valid tack boundary, two gaits, four tacks, both leads and exact sixteen-case matrix. States actual physical observations and ownership; other breeds, parameter extremes, turns, transitions and population/anatomical ROM are outside this unit.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the real public createMule and shared ride through sixteen finite cases, observing actual parent solids, primitive endpoints, terminal surfaces and complete contact queries. It catches detached proximal joints, stretched bars, a buried sole or a floating held run even if a point-only path appears planted.
 * @evidence contracts/development/testing.md#independent-expectations Source-relative attachments and lengths are rigid geometric invariants, adjacent endpoints coincide and the entire supporting primitive has lowest world Y zero. Robilliard 2007 Tables 2/3 supply literal speed/stride/stance triples; sqrt(actual height/1.38) is the declared provisional dynamic-similarity premise. No production timing, range or pose output supplies these values. Physical grip diameter, axis and held-run containment come from actual rods and source contact semantics.
 * @evidence contracts/development/testing.md#distinguishing-cases Crosses four actual tack/contact assemblies with canter and gallop and both leads; contrasts support/swing, exact events with both neighboring sides, source/current geometry and physical contacts/public queries. Its companion slow unit owns the other two gaits, other species units own their producers and limb units own malformed/refusal geometry.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable synchronous portable unit owns its producer callback and sixteen explicit in-memory scenarios through the shared test-only matrix. No process, render, wall-clock assertion, compiler or foreign-method replacement is used.
 */
export function test_archetype_animal_attachment_equids_mule_fast(): void {
  const findings: string[] = [];
  equidAttachmentMatrix(
    (tack: AutoMovieArchetypeEquine.Tack): ReturnType<typeof createMule> =>
      createMule({ sex: "female", tack, tempo: 0, stirrupDrop: 0.575 }, 43),
    "mule/female/seed43",
    ["canter", "gallop"],
    findings,
  );
  TestValidator.equals(
    "mule canter and gallop actual attachment and solid support",
    findings,
    [],
  );
}
