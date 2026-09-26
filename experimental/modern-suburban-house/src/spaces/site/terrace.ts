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
import { MAIN } from "../building";
import { GARDEN_DOOR } from "../envelope/rear";
import { block, part, rect, type IHousePart } from "../solids";
import { STOREYS } from "../storeys";
import type { IExteriorZone, ISiteBuild } from "./zone";
import { WALK_DEPTH } from "./paving";

const OWNER = "site/terrace.ts";
const TOP = STOREYS.groundFloor;
const RISERS = 3;
const RISE = 0.15;
const TREAD = 0.3;
const LOW = TOP - RISERS * RISE;
const BOTTOM = LOW - WALK_DEPTH;
/** Rear edge of the raised terrace, shared with the step connector. */
/**
 * @evidence spaces/site/terrace.md#garden-terrace-plan The rear edge ends the raised terrace before the three descending risers.
 * @evidence spaces/site/terrace.md The terrace owner locates the step departure at its raised rear edge.
 * @evidence principles/core/source-units.md#source-scope-preservation The edge controls the terrace and its stair without adding another garden extent.
 * @evidence principles/core/source-units.md#source-substantive-completion Step solids, lower landing, and connector consume one edge coordinate.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The garden-terrace-plan parent fixes the rear edge at Z=-14.40 m.
 */
export const TERRACE_EDGE_Z = -14.4;
const STEP_CENTRE_X = (GARDEN_DOOR.from + GARDEN_DOOR.to) / 2;
const STEP_X = [STEP_CENTRE_X - 0.75, STEP_CENTRE_X + 0.75] as const;

/** Lower landing extent, metres. */
/**
 * @evidence spaces/site/terrace.md LOWER_LANDING fixes the ground-level wait beyond the three terrace risers.
 * @evidence spaces/site/terrace.md#garden-lower-landing-plan The 1.50 m width, 1.20 m depth, and LOW top place the wait after the two 0.30 m treads.
 * @evidence principles/core/source-units.md#source-scope-preservation This record gives the landing bounds without authoring map terrain or another terrace slab.
 * @evidence principles/core/source-units.md#source-substantive-completion Its computed Z and Y are consumed by the terrace and side-walk builders as one contact.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garden-steps-plan sets three 0.15 m rises and two 0.30 m treads; garden-lower-landing-plan sets the 1.20 m wait beyond them, which LOWER_LANDING derives.
 */
export const LOWER_LANDING = {
  x: STEP_X,
  z: [TERRACE_EDGE_Z - (RISERS - 1) * TREAD - 1.2, TERRACE_EDGE_Z - (RISERS - 1) * TREAD] as const,
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
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garden-terrace-plan fixes a raised rear platform, garden-steps-plan gives three descents, and garden-lower-landing-plan ends at the lower wait; this builder emits their solids and zones without terrain.
 */
export const buildTerrace = (): ISiteBuild => {
  const parts: IHousePart[] = [
    part(
      "garden-terrace",
      OWNER,
      "paving",
      PALETTE.paving,
      block([-1.8, BOTTOM, TERRACE_EDGE_Z], [4.5, TOP, MAIN.outer.z[0]]),
    ),
  ];
  for (let k = 1; k < RISERS; ++k) {
    const edge = TERRACE_EDGE_Z - TREAD * (k - 1);
    parts.push(
      part(
        `garden-step-${k}`,
        OWNER,
        "paving",
        PALETTE.paving,
        block(
          [STEP_X[0], BOTTOM, edge - TREAD],
          [STEP_X[1], TOP - RISE * k, edge],
        ),
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
      outline: rect([-1.8, 4.5], [TERRACE_EDGE_Z, MAIN.outer.z[0]]),
      anchor: {
        x: STEP_CENTRE_X,
        y: TOP,
        z: (TERRACE_EDGE_Z + MAIN.outer.z[0]) / 2,
      },
      rampTo: null,
    },
    {
      id: "garden-lower-landing",
      owner: OWNER,
      outline: rect(LOWER_LANDING.x, LOWER_LANDING.z),
      anchor: {
        x: STEP_CENTRE_X,
        y: LOW,
        z: (LOWER_LANDING.z[0] + LOWER_LANDING.z[1]) / 2,
      },
      rampTo: null,
    },
  ];
  return { zones, parts };
};
