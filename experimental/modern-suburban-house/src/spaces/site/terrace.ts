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
 * @evidence spaces/site/terrace.md#garden-terrace-plan The rear edge ends the raised terrace before the three descending risers.
 * @evidenceReview spaces/site/terrace.md#garden-terrace-plan #d19ab8e TERRACE_EDGE_Z bounds the terrace block and zone (terrace.ts:72,106) and starts step 1 (:76); terrace.md:25 outer end Z=-14.40, "바깥쪽은 아래 외부 단". The count "three" comes from same-file garden-steps-plan :53.
 * @evidence spaces/site/terrace.md The terrace owner locates the step departure at its raised rear edge.
 * @evidenceReview spaces/site/terrace.md #ae77158 Step k=1 edge = TERRACE_EDGE_Z (terrace.ts:75-86), so the first riser sits at the terrace outer edge; terrace.md:53 "첫 챌판은 테라스 바깥 끝에 둔다".
 * @evidence principles/core/source-units.md#source-scope-preservation The edge controls the terrace and its stair without adding another garden extent.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 One exported number (terrace.ts:37) consumed by the terrace block and zone, the steps and LOWER_LANDING; no other garden extent is authored.
 * @evidence principles/core/source-units.md#source-substantive-completion Step solids, lower landing, and connector consume one edge coordinate.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Consumers: steps terrace.ts:76, LOWER_LANDING :51, garden-steps connector route environment.ts:349,354.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The garden-terrace-plan parent fixes the rear edge at Z=-14.40 m.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 terrace.md:25 "X = [-1.80, 4.50] m, 바깥 끝 Z = -14.40 m의 포장으로 택하고" is an authored absolute; terrace.ts:37. Names a specific parent and value.
 */
export const TERRACE_EDGE_Z = -14.4;
const STEP_CENTRE_X = (GARDEN_DOOR.from + GARDEN_DOOR.to) / 2;
const STEP_X = [STEP_CENTRE_X - 0.75, STEP_CENTRE_X + 0.75] as const;

/** Lower landing extent, metres. */
/**
 * @evidence spaces/site/terrace.md LOWER_LANDING fixes the ground-level wait beyond the three terrace risers.
 * @evidenceReview spaces/site/terrace.md #ae77158 LOWER_LANDING lies past the two treads with top LOW = TOP-3×0.15 (terrace.ts:27,49-53); terrace.md:79.
 * @evidence spaces/site/terrace.md#garden-lower-landing-plan The 1.50 m width, 1.20 m depth, and LOW top place the wait after the two 0.30 m treads.
 * @evidenceReview spaces/site/terrace.md#garden-lower-landing-plan #0040c06 x=STEP_X (1.50 m), depth 1.2, top LOW, z[1]=EDGE-2×0.3 (terrace.ts:39,49-53); terrace.md:79 (same width as the steps, 1.20 deep, minus three rises), :53 two 0.30 treads, :27 1.50 band.
 * @evidence principles/core/source-units.md#source-scope-preservation This record gives the landing bounds without authoring map terrain or another terrace slab.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 LOWER_LANDING (terrace.ts:49-53) is a bounds record; it authors no terrain or slab.
 * @evidence principles/core/source-units.md#source-substantive-completion Its computed Z and Y are consumed by the terrace and side-walk builders as one contact.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f z and x are read by the terrace block and zone (terrace.ts:97-98,117-121) and by side-walk backBand/x/top (side-walk.ts:36-37,82,108,135); Y via LOWER_LANDING.top in side-walk (the terrace block uses the same LOW).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garden-steps-plan sets three 0.15 m rises and two 0.30 m treads; garden-lower-landing-plan sets the 1.20 m wait beyond them, which LOWER_LANDING derives.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 terrace.md:53 three 0.15 rises and two 0.30 treads; :79 1.20 m wait from the last riser; LOWER_LANDING derives from TERRACE_EDGE_Z, RISERS, TREAD and 1.2 (terrace.ts:24-27,49-53).
 */
export const LOWER_LANDING = {
  x: STEP_X,
  z: [TERRACE_EDGE_Z - (RISERS - 1) * TREAD - 1.2, TERRACE_EDGE_Z - (RISERS - 1) * TREAD] as const,
  top: LOW,
};

/** Emit the terrace, steps and lower landing. */
/**
 * @evidence spaces/site/terrace.md This builder owns the raised garden terrace, descending steps, and lower waiting area.
 * @evidenceReview spaces/site/terrace.md #ae77158 buildTerrace (terrace.ts:65-127) emits garden-terrace, garden-step-1..2 and garden-lower-landing parts; terrace.md:29,55,81 make terrace.ts their owner.
 * @evidence spaces/site/terrace.md#garden-terrace-plan The raised slab begins at the rear wall and leaves a garden-door standing zone at Y=0.
 * @evidenceReview spaces/site/terrace.md#garden-terrace-plan #d19ab8e Terrace block Z runs to MAIN.outer.z[0] (rear wall outer face, terrace.ts:72); garden-terrace zone y=TOP=STOREYS.groundFloor=0 (:102-113); terrace.md:25; rear.md:165 outer waiting Y=0.
 * @evidence spaces/site/terrace.md#garden-steps-plan Two tread blocks descend in 0.15 m increments across the 1.50 m central stair width.
 * @evidenceReview spaces/site/terrace.md#garden-steps-plan #368d4bc k=1..RISERS-1 gives two blocks with tops TOP-0.15k over STEP_X (1.50 m on the garden-door centre) (terrace.ts:38-39,75-89); terrace.md:53.
 * @evidence spaces/site/terrace.md#garden-lower-landing-plan A lower slab and zone finish the path at LOW for the side-walk handoff.
 * @evidenceReview spaces/site/terrace.md#garden-lower-landing-plan #0040c06 garden-lower-landing block and zone at LOW (terrace.ts:90-101,114-124); side-walk consumes LOWER_LANDING (side-walk.ts:36-37); terrace.md:79.
 * @evidence principles/core/source-units.md#source-scope-preservation The builder uses STOREYS and WALK_DEPTH values but creates no terrain or garden planting.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 terrace.ts uses STOREYS.groundFloor (:23) and WALK_DEPTH (:28), plus MAIN and GARDEN_DOOR; it emits only paving blocks and two zones, no terrain or planting.
 * @evidence principles/core/source-units.md#source-substantive-completion Raised platform, two step parts, landing, and both zone records return deterministically.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Parts: garden-terrace, garden-step-1, garden-step-2, garden-lower-landing. Zones: garden-terrace, garden-lower-landing (terrace.ts:66-126).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garden-terrace-plan fixes a raised rear platform, garden-steps-plan gives three descents, and garden-lower-landing-plan ends at the lower wait; this builder emits their solids and zones without terrain.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 terrace.md:25 terrace at the garden-door waiting height, :53 three rises, :79 lower wait; buildTerrace emits those solids and two zones, no terrain (terrace.ts:65-127); terrace.md:81 no separate terrain face.
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
