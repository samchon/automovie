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
import { block, rect } from "../solids";
import { part, type IHousePart } from "../solid-records";
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
 * @evidence spaces/site/terrace.md#garden-terrace-plan The outer edge ends the raised terrace before its external step connection.
 * @evidenceReview spaces/site/terrace.md#garden-terrace-plan #d19ab8e The garden-terrace plan ends its paving at Z = -14.40 before the external steps; TERRACE_EDGE_Z supplies that value to the terrace block and zone.
 * @evidence spaces/site/terrace.md The terrace owner locates the step departure at its raised rear edge.
 * @evidenceReview spaces/site/terrace.md #ae77158 buildTerrace starts its first descending tread at TERRACE_EDGE_Z and the raised block ends there, placing the first riser at the authored terrace edge.
 * @evidence principles/core/source-units.md#source-scope-preservation The edge controls the terrace and its stair without adding another garden extent.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 TERRACE_EDGE_Z is only the raised terrace's outer Z, reused by its step and landing calculations; it defines no new garden terrain or off-site extent.
 * @evidence principles/core/source-units.md#source-substantive-completion Step solids, lower landing, and connector consume one edge coordinate.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The terrace block, step loop and LOWER_LANDING Z derivation read TERRACE_EDGE_Z, so their adjoining boundaries use the same concrete edge.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The garden-terrace-plan parent fixes the rear edge at Z=-14.40 m.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Garden-terrace-plan fixes the raised outer edge at Z = -14.40; TERRACE_EDGE_Z exports that same limit without exposing a missing terrace boundary decision.
 */
export const TERRACE_EDGE_Z = -14.4;
const STEP_CENTRE_X = (GARDEN_DOOR.from + GARDEN_DOOR.to) / 2;
const STEP_X = [STEP_CENTRE_X - 0.75, STEP_CENTRE_X + 0.75] as const;

/** Lower landing extent, metres. */
/**
 * @evidence spaces/site/terrace.md LOWER_LANDING fixes the ground-level wait beyond the three terrace risers.
 * @evidenceReview spaces/site/terrace.md #ae77158 LOWER_LANDING begins beyond the two tread blocks and sets its top to TOP minus the three authored 0.15 rises, forming the lower waiting area described by the terrace document.
 * @evidence spaces/site/terrace.md#garden-lower-landing-plan The 1.50 m width, 1.20 m depth, and LOW top place the wait after the two 0.30 m treads.
 * @evidenceReview spaces/site/terrace.md#garden-lower-landing-plan #0040c06 LOWER_LANDING uses STEP_X for the stair's 1.50 m width, starts after two TREAD lengths from TERRACE_EDGE_Z, extends another 1.2 m in -Z and holds LOW after three rises.
 * @evidence principles/core/source-units.md#source-scope-preservation This record gives the landing bounds without authoring map terrain or another terrace slab.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 LOWER_LANDING exports only its X/Z bounds and top height; buildTerrace owns its paving body and no map terrain is produced by this record.
 * @evidence principles/core/source-units.md#source-substantive-completion Its computed Z and Y are consumed by the terrace and side-walk builders as one contact.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildTerrace reads LOWER_LANDING's X/Z for its block and zone, while SIDE_WALK takes its outer Z, left X and top for the rear handoff, so the contact is fully specified.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garden-steps-plan sets three 0.15 m rises and two 0.30 m treads; garden-lower-landing-plan sets the 1.20 m wait beyond them, which LOWER_LANDING derives.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Garden-steps-plan supplies three rises and two treads, and garden-lower-landing-plan assigns a 1.20 m wait beyond them; LOWER_LANDING derives that X/Z/Y record without a new parent step.
 */
export const LOWER_LANDING = {
  x: STEP_X,
  z: [TERRACE_EDGE_Z - (RISERS - 1) * TREAD - 1.2, TERRACE_EDGE_Z - (RISERS - 1) * TREAD] as const,
  top: LOW,
};

/** Emit the terrace, steps and lower landing. */
/**
 * @evidence spaces/site/terrace.md This builder owns the raised garden terrace, descending steps, and lower waiting area.
 * @evidenceReview spaces/site/terrace.md #ae77158 buildTerrace returns the raised garden-terrace block, two intermediate tread blocks and the lower landing block, plus zones at the upper and lower waiting levels.
 * @evidence spaces/site/terrace.md#garden-terrace-plan The raised slab begins at the rear wall and leaves a garden-door standing zone at Y=0.
 * @evidenceReview spaces/site/terrace.md#garden-terrace-plan #d19ab8e The raised block runs from TERRACE_EDGE_Z to MAIN.outer.z[0], and the garden-terrace zone anchors at TOP = STOREYS.groundFloor, matching the garden-door outside waiting level.
 * @evidence spaces/site/terrace.md#garden-steps-plan Two tread blocks descend in 0.15 m increments across the 1.50 m central stair width.
 * @evidenceReview spaces/site/terrace.md#garden-steps-plan #368d4bc The k loop creates two STEP_X-width treads at TOP minus one and two RISE values; the terrace edge and lower landing form the other levels of the three-riser descent.
 * @evidence spaces/site/terrace.md#garden-lower-landing-plan A lower slab and zone finish the path at LOW for the side-walk handoff.
 * @evidenceReview spaces/site/terrace.md#garden-lower-landing-plan #0040c06 The final block and garden-lower-landing zone use LOWER_LANDING's X/Z and LOW top; SIDE_WALK reads that same record for its rear path contact.
 * @evidence principles/core/source-units.md#source-scope-preservation The builder uses STOREYS and WALK_DEPTH values but creates no terrain or garden planting.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 buildTerrace uses STOREYS, MAIN, GARDEN_DOOR and WALK_DEPTH for its paving and two waiting zones; it emits neither garden terrain nor planting or a second door.
 * @evidence principles/core/source-units.md#source-substantive-completion Raised platform, two step parts, landing, and both zone records return deterministically.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The deterministic loop and fixed blocks return four named paving parts and the two upper/lower zone records in one ISiteBuild, leaving no unbuilt step between the two levels.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garden-terrace-plan fixes a raised rear platform, garden-steps-plan gives three descents, and garden-lower-landing-plan ends at the lower wait; this builder emits their solids and zones without terrain.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Garden-terrace-plan sets the rear platform, garden-steps-plan sets three descents and garden-lower-landing-plan sets the final wait; buildTerrace emits those bodies and zones without requiring a terrain decision from any parent.
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
