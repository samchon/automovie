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
import { type IHousePart, part, rect, slab } from "../solids";
import { CEILING_FINISH, CEILING_RESERVATION, INTERSTOREY_FLOOR_FINISH, STOREYS } from "../storeys";

const OWNER = "floors/upper.ts";

/** Stair-owned edge finish the structure recedes from at the opening (08 interstorey-edge-junctions), metres. */
const OPENING_EDGE = 0.015;

/** Emit the 0.270 m interstorey structure between the two finish layers, with the receded stair notch. */
export const buildInterstorey = (): IHousePart[] => {
  const [x0, x1] = MAIN.inner.x;
  const [z0, z1] = MAIN.inner.z;
  const e = OPENING_EDGE;
  const outline = [
    { x: x0, z: z0 },
    { x: x1, z: z0 },
    { x: x1, z: z1 },
    { x: -0.65 + e, z: z1 },
    { x: -0.65 + e, z: -3.41 + e },
    { x: 1.87 + e, z: -3.41 + e },
    { x: 1.87 + e, z: -4.56 - e },
    { x: -1.8 - e, z: -4.56 - e },
    { x: -1.8 - e, z: z1 },
    { x: x0, z: z1 },
  ];
  const bottom = STOREYS.groundCeiling + CEILING_FINISH;
  return [part("interstorey-structure", OWNER, "floor", PALETTE.structure, slab({ outline, bottom, top: STOREYS.upperFloor - INTERSTOREY_FLOOR_FINISH }))];
};

/** Emit the 0.165 m upper ceiling base over the whole main inner plan, stair hall included, above the room finishes. */
export const buildUpperCeiling = (): IHousePart[] => {
  const bottom = STOREYS.upperCeiling + CEILING_FINISH;
  return [part("upper-ceiling-base", OWNER, "ceiling", PALETTE.ceiling, slab({ outline: rect(MAIN.inner.x, MAIN.inner.z), bottom, top: STOREYS.upperCeiling + CEILING_RESERVATION }))];
};
