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
 * Y = 5.66 a 0.18 m reservation, with no stair opening copied into it).
 *
 * Because the opening reaches the front wall's inner face, it is a notch of
 * the slab outline rather than a hole inside it.
 */
import { MAIN } from "../building";
import { PALETTE } from "../palette";
import { type IHousePart, part, rect, slab } from "../solids";
import { LAYERS, STOREYS } from "../storeys";

const OWNER = "floors/upper.ts";

/** Emit the interstorey structure (with the ground ceiling finish zone) and the upper ceiling base. */
export const buildUpperFloor = (): IHousePart[] => {
  const [x0, x1] = MAIN.inner.x;
  const [z0, z1] = MAIN.inner.z;
  const outline = [
    { x: x0, z: z0 },
    { x: x1, z: z0 },
    { x: x1, z: z1 },
    { x: -0.65, z: z1 },
    { x: -0.65, z: -3.41 },
    { x: 1.87, z: -3.41 },
    { x: 1.87, z: -4.56 },
    { x: -1.8, z: -4.56 },
    { x: -1.8, z: z1 },
    { x: x0, z: z1 },
  ];
  return [
    part("interstorey-structure", OWNER, "floor", PALETTE.structure, slab({ outline, bottom: STOREYS.groundCeiling, top: STOREYS.upperFloor - LAYERS.interstoreyFloorFinish })),
    part("upper-ceiling-base", OWNER, "ceiling", PALETTE.ceiling, slab({ outline: rect(MAIN.inner.x, MAIN.inner.z), bottom: STOREYS.upperCeiling, top: STOREYS.upperCeiling + LAYERS.ceilingReservation })),
  ];
};
