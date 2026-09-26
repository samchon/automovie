/**
 * `garden-terrace`, `garden-steps` and `garden-lower-landing`: the raised rear
 * terrace, its three exterior risers and the lower waiting area.
 *
 * Design owner: `docs/spaces/site/terrace.md`. The terrace is X = [-1.80, 4.50]
 * from the rear wall's outer face Z = -10.70 to Z = -14.40, top at the garden
 * door's outer waiting Y = 0 (envelope/rear garden-door). The steps take the
 * 1.50 m central band on the garden door axis X = 0: X = [-0.75, 0.75]; the
 * first riser is at the terrace edge and each tread steps −Z by 0.30 m and
 * down by 0.15 m (three risers, two treads). The lower landing is 1.20 m deep
 * at the terrace top minus three risers, −0.45 m. Raised bodies reach the lower
 * waiting base −0.45 − 0.12 m (01-paving-support raised-platform-support).
 */
import { PALETTE } from "../palette";
import { block, part, rect, type IHousePart } from "../solids";
import { STOREYS } from "../storeys";
import type { IExteriorZone, ISiteBuild } from "./zone";
import { WALK_DEPTH } from "./paving";

const OWNER = "site/terrace.ts";
const TOP = STOREYS.groundFloor;
const LOW = TOP - 3 * 0.15;
const BOTTOM = LOW - WALK_DEPTH;
const EDGE = -14.4;

/** Lower landing extent, metres. */
/**
 * @evidence spaces/site/terrace.md LOWER_LANDING fixes the ground-level wait beyond the three terrace risers.
 * @evidence spaces/site/terrace.md#garden-lower-landing-plan The 1.50 m width, 1.20 m depth, and LOW top place the wait after the two 0.30 m treads.
 * @evidence principles/core/source-units.md#source-scope-preservation This record gives the landing bounds without authoring map terrain or another terrace slab.
 * @evidence principles/core/source-units.md#source-substantive-completion Its computed Z and Y are consumed by the terrace and side-walk builders as one contact.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The landing parent fixes step count, tread reach, and wait depth; no extra lower platform was chosen.
 */
export const LOWER_LANDING = {
  x: [-0.75, 0.75] as const,
  z: [EDGE - 0.6 - 1.2, EDGE - 0.6] as const,
  top: LOW,
};

/** Emit the terrace, steps and lower landing. */
/**
 * @evidence spaces/site/terrace.md This builder owns the raised garden terrace, descending steps, and lower waiting area.
 * @evidence spaces/site/terrace.md#garden-terrace-plan The raised slab begins at the rear wall and leaves a garden-door standing zone at Y=0.
 * @evidence spaces/site/terrace.md#garden-steps-plan Two tread blocks descend in 0.15 m increments across the 1.50 m central stair width.
 * @evidence spaces/site/terrace.md#garden-lower-landing-plan A lower slab and zone finish the path at LOW for the side-walk handoff.
 * @evidence principles/core/source-units.md#source-scope-preservation The builder uses STOREYS and WALK_DEPTH values but creates no terrain or garden planting.
 * @evidence principles/core/source-units.md#source-substantive-completion Raised platform, two step parts, landing, and both zone records return deterministically.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The terrace parent fixes raised support, step geometry, and lower wait; no ground contour was fabricated.
 */
export const buildTerrace = (): ISiteBuild => {
  const parts: IHousePart[] = [
    part(
      "garden-terrace",
      OWNER,
      "paving",
      PALETTE.paving,
      block([-1.8, BOTTOM, EDGE], [4.5, TOP, -10.7]),
    ),
  ];
  for (let k = 1; k <= 2; ++k) {
    const edge = EDGE - 0.3 * (k - 1);
    parts.push(
      part(
        `garden-step-${k}`,
        OWNER,
        "paving",
        PALETTE.paving,
        block([-0.75, BOTTOM, edge - 0.3], [0.75, TOP - 0.15 * k, edge]),
      ),
    );
  }
  parts.push(
    part(
      "garden-lower-landing",
      OWNER,
      "paving",
      PALETTE.paving,
      block(
        [LOWER_LANDING.x[0], BOTTOM, LOWER_LANDING.z[0]],
        [LOWER_LANDING.x[1], LOW, LOWER_LANDING.z[1]],
      ),
    ),
  );
  const zones: IExteriorZone[] = [
    {
      id: "garden-terrace",
      owner: OWNER,
      outline: rect([-1.8, 4.5], [EDGE, -10.7]),
      anchor: { x: 0, y: TOP, z: -12 },
      rampTo: null,
    },
    {
      id: "garden-lower-landing",
      owner: OWNER,
      outline: rect(LOWER_LANDING.x, LOWER_LANDING.z),
      anchor: { x: 0, y: LOW, z: (LOWER_LANDING.z[0] + LOWER_LANDING.z[1]) / 2 },
      rampTo: null,
    },
  ];
  return { zones, parts };
};
