import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  admitLeadReach
} from "../../../../../packages/motions/src/lexicon/internal/admitLeadReach";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/** A half turn about world Y, which sends +X to -X exactly. */
const HALF_TURN: IAutoMovieQuaternion = { x: 0, y: 1, z: 0, w: 0 };

/** The closed 10 mm contact budget, metres. */
const BOUNDARY: number = 0.01;

/** Two binary64 spacings above the boundary in its exponent bin. */
const OUTSIDE: number = BOUNDARY + 2 ** -58;

/**
 * A lead grip is admitted through the closed distance bound on its skin.
 *
 * Scenarios:
 *
 * 1. The half-turned hand puts its contact at X = 1/64 m by shifting the
 *    wrist back by 1/8 m. The lead's radius is 1/64 m, so only the 10 mm
 *    difference in Z remains and the grip is admitted.
 * 2. The same alignment with a separation just above 10 mm refuses on
 *    leadReach, naming the hand, lead and film second.
 * 3. Without a contact offset or radius, the wrist meets the lead point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the closed posed-hand distance boundary for gripping a lead and refusal details when it is exceeded.
 * @evidence contracts/development/testing.md#behavioral-verification Checks a rotated hand with palm offset, a near-over-limit grip and the zero-offset direct point case.
 * @evidence contracts/development/testing.md#independent-expectations The lead radius and resolved contact align at x = 1/64 m, leaving exactly 10 mm in z. A greater separation refuses and identifies hand, lead and time.
 */
export function test_motions_lexicon_admit_lead_reach(): void {
  const location: Parameters<typeof admitLeadReach>[3] = {
    side: "right",
    subject: "horse",
    point: "lead",
    film: 3,
  };
  const lead: Parameters<typeof admitLeadReach>[2] = {
    point: { x: 0, y: 1, z: 0 },
    normal: { x: 1, y: 0, z: 0 },
    radius: 1 / 64,
  };
  const offset: IAutoMovieVector3 = { x: 1 / 8, y: 0, z: 0 };
  const at = (z: number): Parameters<typeof admitLeadReach>[0] => ({
    worldPosition: { x: 9 / 64, y: 1, z },
    worldRotation: HALF_TURN,
  });

  admitLeadReach(at(BOUNDARY), offset, lead, location);
  TestValidator.predicate(
    "a distance just above the contact budget names its lead",
    throwsError(() => admitLeadReach(at(OUTSIDE), offset, lead, location), [
      "leadReach:",
      "right hand misses horse.lead",
      "at film second 3",
    ]),
  );
  admitLeadReach(
    { worldPosition: lead.point, worldRotation: HALF_TURN },
    undefined,
    { point: lead.point, normal: lead.normal },
    location,
  );
}
