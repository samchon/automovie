import type { IEvidenceReference } from "@wrtnlabs/evidence";

import type { NarrativeLayer } from "../../NarrativeLayer";
import { createSharedReference } from "./createSharedReference";

/**
 * Creates the upstream-revision duty every unit of one narrative layer answers.
 *
 * Settings has no layer above it and never selects this family. It is a
 * checklist because whether writing this unit exposed an upstream defect is a
 * question about that unit, and ordinary coverage would let one unit answer for
 * every other. Exclusion is permitted, and the pairing is the point: a unit
 * whose parents answered every question it asked records what it tested, while
 * refusing the negative would make every unit claim a repair it never made.
 */
export function createUpstreamReference(
  location: string,
  layer: NarrativeLayer,
): IEvidenceReference {
  return createSharedReference({
    location,
    file: `upstream/${layer}.md`,
    checklist: true,
    exclusion: true,
  });
}
