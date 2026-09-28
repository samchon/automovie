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
 * @evidenceReview spaces/08-floor-assembly.md #17cd1b7 buildInterstorey returns one interstorey-structure slab within MAIN.inner rather than separate structural boxes for the rooms above and below it.
 * @evidence spaces/08-floor-assembly.md#interstorey-floor-boundary Its Y band excludes 0.015 m ground ceiling and 0.025 m upper floor finishes.
 * @evidenceReview spaces/08-floor-assembly.md#interstorey-floor-boundary #58ff097 Its bottom is groundCeiling plus the 0.015 m ceiling finish, and its top is upperFloor minus the 0.025 m floor finish, leaving the assigned 0.270 m structural interval.
 * @evidence spaces/08-floor-assembly.md#interstorey-edge-junctions A receded L notch leaves a 0.015 m edge band for the stair's continuous opening finish.
 * @evidenceReview spaces/08-floor-assembly.md#interstorey-edge-junctions #9608f54 The outline offsets the stair opening by OPENING_EDGE, equal to the 0.015 m finish reservation; buildStair calls stair-guards.ts to emit the five edge strips in that band.
 * @evidence principles/core/source-units.md#source-scope-preservation The opening reaches the front wall as a notch, while room finishes and stair edge trim remain with their owners.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The polygon reaches the front inner wall on both sides of the stair notch, while each room keeps its finish and the stair owner supplies the opening edge strips.
 * @evidence principles/core/source-units.md#source-substantive-completion The ten-point outline extrudes one solid slab with deterministic top and bottom datums.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The ten-point ring forms one connected slab around the stair recess, and slab() extrudes it between the computed lower and upper datums.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interstorey-floor-boundary allocates the common structure and its L stair notch between two finishes; interstorey-edge-junctions reserves the 0.015 m recession for stair-owned trim.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The floor-boundary parent sets the finish and structure intervals and the front-reaching stair notch; the edge-junction parent sets the trim recession, which this builder applies without moving either finished boundary.
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
 * @evidenceReview spaces/09-ceiling-assembly.md #654afbb buildUpperCeiling extrudes one full MAIN.inner ceiling base, keeping the top ceiling separate from the notched interstorey floor.
 * @evidence spaces/09-ceiling-assembly.md#upper-ceiling-closure The 0.165 m base starts above the 0.015 m room finish and does not copy the stair floor hole.
 * @evidenceReview spaces/09-ceiling-assembly.md#upper-ceiling-closure #c7abfd2 The slab starts 0.015 m above upperCeiling and ends at its 0.18 m reservation top, yielding a 0.165 m base without copying the floor's stair notch.
 * @evidence spaces/09-ceiling-assembly.md#ceiling-roof-clearance The single upper base sits below the reserved roof underside rather than raising the roof profile.
 * @evidenceReview spaces/09-ceiling-assembly.md#ceiling-roof-clearance #40a15ca The ceiling base top comes from upperCeiling plus CEILING_RESERVATION; the roof-clearance H2 compares that datum to the right roof underside, while this builder does not alter the roof profile.
 * @evidence principles/core/source-units.md#source-scope-preservation Rooms and stair retain visible ceiling finishes; this slab is structural ceiling support only.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 This function emits only upper-ceiling-base; roomCeiling supplies upper room finishes and buildStair's guard helper supplies the high stair ceiling finish.
 * @evidence principles/core/source-units.md#source-substantive-completion A full-plan solid spans MAIN.inner at the computed bottom and reservation top.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f rect covers MAIN.inner and slab() gives it explicit bottom and top datums, producing a closed full-plan ceiling base.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Upper-ceiling-closure covers the full MAIN.inner plan including the stairwell with 0.015 m room finish below 0.165 m support; this builder emits only the support.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The upper-ceiling parent requires a continuous inner-plan base with the 0.015 m room finish below its 0.165 m support, and this builder emits that support without a copied stair hole.
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
