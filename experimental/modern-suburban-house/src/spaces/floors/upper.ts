/**
 * Interstorey structure with the stair opening, and the top ceiling base.
 *
 * Design owners: `docs/spaces/08-floor-assembly.md#interstorey-floor-boundary`
 * (between the ground ceiling Y = 2.75 and the upper floor Y = 3.06: 0.015 m
 * ceiling finish, 0.270 m structure, 0.025 m floor finish; the floor finish
 * belongs to each upper room), `02-stair.md#stair-floor-opening` (the L-shaped
 * opening X = [-1.80, -0.65] × Z = [-4.56, -0.25] joined with
 * X = [-0.65, 1.87] × Z = [-4.56, -3.41]) and
 * `09-ceiling-assembly.md#upper-ceiling-closure` (above the upper ceiling
 * Y = 5.66 a 0.18 m reservation, with no stair opening copied into it: the
 * lower 0.015 m finish belongs to each upper room, this owner emits the
 * 0.165 m base). Both storeys' ceiling finishes come from
 * `rooms/shared.ts` `roomCeiling`.
 *
 * Because the opening reaches the front wall's inner face, it is a notch of
 * the slab outline rather than a hole inside it. Per
 * `08-floor-assembly.md#interstorey-edge-junctions` the structure recedes
 * 0.015 m from every opening edge, leaving room for the stair owner's
 * continuous edge finish inside the unchanged finished opening; where the
 * stair back wall crosses the interstorey band this slab keeps the overlap and
 * the stair owner subtracts it from its wall.
 */
import { MAIN } from "../building";
import { PALETTE } from "../palette";
import { part, type IHousePart } from "../solid-records";
import { rect, slab } from "../solids";
import {
  CEILING_FINISH,
  CEILING_RESERVATION,
  INTERSTOREY_FLOOR_FINISH,
  STOREYS,
} from "../storeys";
import { STAIR_OPENING } from "../stair";

const OWNER = "floors/upper.ts";

/** Stair-owned edge finish the structure recedes from at the opening (08 interstorey-edge-junctions), metres. */
const OPENING_EDGE = CEILING_FINISH;

/** Emit the 0.270 m interstorey structure between the two finish layers, with the receded stair notch. */
/**
 * @evidence spaces/08-floor-assembly.md This builder emits one interstorey structure between ground ceiling and upper room finishes.
 * @evidenceReview spaces/08-floor-assembly.md #3fa5b4f v-141 Single interstorey-structure part (upper.ts:66-78); 08-floor-assembly.md:25.
 * @evidence spaces/08-floor-assembly.md#interstorey-floor-boundary Its Y band excludes 0.015 m ground ceiling and 0.025 m upper floor finishes.
 * @evidenceReview spaces/08-floor-assembly.md#interstorey-floor-boundary #b98a250 v-141 Bottom groundCeiling+CEILING_FINISH(0.015), top upperFloor-INTERSTOREY_FLOOR_FINISH(0.025) (upper.ts:65,75); 08-floor-assembly.md:27.
 * @evidence spaces/08-floor-assembly.md#interstorey-edge-junctions A receded L notch leaves a 0.015 m edge band for the stair's continuous opening finish.
 * @evidenceReview spaces/08-floor-assembly.md#interstorey-edge-junctions #5618479 The upper floor notch recedes by CEILING_FINISH=0.015 m; the five stair edge strips now come from the buildStair-called stair-guards.ts helper and occupy that reserved finish band.
 * @evidence principles/core/source-units.md#source-scope-preservation The opening reaches the front wall as a notch, while room finishes and stair edge trim remain with their owners.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Outline reaches z1=MAIN.inner.z[1] at STAIR_OPENING west/turnX (upper.ts:57,62); finishes in rooms, edge strips in stair.ts.
 * @evidence principles/core/source-units.md#source-substantive-completion The ten-point outline extrudes one solid slab with deterministic top and bottom datums.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Outline has 10 points (upper.ts:53-64), one slab with computed bottom/top.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interstorey-floor-boundary allocates one 0.270 m common structure between 0.015 m ceiling and 0.025 m upper room finish, while interstorey-edge-junctions reserves the L stair notch.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 0.015/0.270/0.025 = 08-floor-assembly.md:27 and upper.ts:65,:75. But the L notch itself is set in interstorey-floor-boundary :29/:31 (and 02-stair#stair-floor-opening); interstorey-edge-junctions :65 only reserves the <=0.015 recession. Sibling H2.
 */
export const buildInterstorey = (): IHousePart[] => {
  const [x0, x1] = MAIN.inner.x;
  const [z0, z1] = MAIN.inner.z;
  const e = OPENING_EDGE;
  const outline = [
    { x: x0, z: z0 },
    { x: x1, z: z0 },
    { x: x1, z: z1 },
    { x: STAIR_OPENING.turnX + e, z: z1 },
    { x: STAIR_OPENING.turnX + e, z: STAIR_OPENING.turnZ + e },
    { x: STAIR_OPENING.east + e, z: STAIR_OPENING.turnZ + e },
    { x: STAIR_OPENING.east + e, z: STAIR_OPENING.back - e },
    { x: STAIR_OPENING.west - e, z: STAIR_OPENING.back - e },
    { x: STAIR_OPENING.west - e, z: z1 },
    { x: x0, z: z1 },
  ];
  const bottom = STOREYS.groundCeiling + CEILING_FINISH;
  return [
    part(
      "interstorey-structure",
      OWNER,
      "floor",
      PALETTE.structure,
      slab({
        outline,
        bottom,
        top: STOREYS.upperFloor - INTERSTOREY_FLOOR_FINISH,
      }),
    ),
  ];
};

/** Emit the 0.165 m upper ceiling base over the whole main inner plan, stair hall included, above the room finishes. */
/**
 * @evidence spaces/09-ceiling-assembly.md This builder closes the full main inner plan above the upper finished ceiling.
 * @evidenceReview spaces/09-ceiling-assembly.md #403d803 v-141 rect(MAIN.inner) slab (upper.ts:98-102); 09-ceiling-assembly.md:25.
 * @evidence spaces/09-ceiling-assembly.md#upper-ceiling-closure The 0.165 m base starts above the 0.015 m room finish and does not copy the stair floor hole.
 * @evidenceReview spaces/09-ceiling-assembly.md#upper-ceiling-closure #a3b9afa v-141 Bottom upperCeiling+0.015, top +0.18 (upper.ts:91,101) = 0.165 base; no hole; 09-ceiling-assembly.md:25,27.
 * @evidence spaces/09-ceiling-assembly.md#ceiling-roof-clearance The single upper base sits below the reserved roof underside rather than raising the roof profile.
 * @evidenceReview spaces/09-ceiling-assembly.md#ceiling-roof-clearance #40a15ca v-141 Top 5.84 < lowest right-roof underside 5.856 (09-ceiling-assembly.md:89 computes ~0.0158); host reads/changes no roof value.
 * @evidence principles/core/source-units.md#source-scope-preservation Rooms and stair retain visible ceiling finishes; this slab is structural ceiling support only.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Room ceilings come from roomCeiling and stair-hall-ceiling from the buildStair-called stair-guards.ts helper; this upper-floor part remains a ceiling base only.
 * @evidence principles/core/source-units.md#source-substantive-completion A full-plan solid spans MAIN.inner at the computed bottom and reservation top.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 rect(MAIN.inner.x, MAIN.inner.z), bottom computed, top CEILING_RESERVATION (upper.ts:90-104).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Upper-ceiling-closure covers the full MAIN.inner plan including the stairwell with 0.015 m room finish below 0.165 m support; this builder emits only the support.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 09-ceiling-assembly.md:25 full MAIN inner plan, hole not copied; :27 0.18 = 0.015 finish + 0.165 base; upper.ts:91-101 emits only upper-ceiling-base.
 */
export const buildUpperCeiling = (): IHousePart[] => {
  const bottom = STOREYS.upperCeiling + CEILING_FINISH;
  return [
    part(
      "upper-ceiling-base",
      OWNER,
      "ceiling",
      PALETTE.ceiling,
      slab({
        outline: rect(MAIN.inner.x, MAIN.inner.z),
        bottom,
        top: STOREYS.upperCeiling + CEILING_RESERVATION,
      }),
    ),
  ];
};
