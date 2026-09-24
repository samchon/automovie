/**
 * Attached garage structure: the main/garage shared wall, the garage floor
 * base and the garage ceiling base.
 *
 * Design owners: `docs/spaces/00-building.md#attached-garage-extent` (outline
 * X = [5.50, 11.70], Z = [-6.70, -0.30] m; one 0.25 m shared wall
 * X = [5.50, 5.75]; inner limit X = [5.75, 11.45], Z = [-6.45, -0.55]),
 * `03-surface-owners.md` (this file owns the shared wall body and the garage
 * floor base), `10-ground-floor.md#garage-ground-floor-base` (0.15 m below the
 * finished floor Y = -0.15) and `09-ceiling-assembly.md#garage-ceiling-closure`
 * (ceiling Y = 2.55 m plus the 0.18 m reservation). The shared wall rises to
 * the main building's right low roof underside (07: its upper part continues
 * to the main roof) and carries the `laundry-garage-door` void
 * Z = [-4.40, -3.35], Y = [0, 2.20] m owned by the laundry plan.
 *
 * The garage stays empty: no vehicle is authored.
 */
import { EXTERIOR_WALL_BOTTOM, MAIN, MAIN_RIDGE_Z } from "./building";
import { PALETTE } from "./palette";
import { GARAGE_ROOF, ROOF_THICKNESS, rightRoof } from "./roof/junctions";
import { type IHousePart, part, rect, slab, wallPanel } from "./solids";
import { LAYERS, STOREYS } from "./storeys";

const OWNER = "garage.ts";

/** Garage finished inner limits, metres. */
export const GARAGE_INNER = { x: [5.75, 11.45] as const, z: [-6.45, -0.55] as const };

/** Emit the shared wall, the floor base and the ceiling base. */
export const buildGarage = (): IHousePart[] => {
  const under = (z: number): number => rightRoof(z) - ROOF_THICKNESS;
  const back = GARAGE_ROOF.backFace;
  const front = GARAGE_ROOF.frontFace;
  const shared = wallPanel({
    axis: "z",
    across: [MAIN.inner.x[1], MAIN.outer.x[1]],
    outline: [
      { u: back, y: EXTERIOR_WALL_BOTTOM },
      { u: front, y: EXTERIOR_WALL_BOTTOM },
      { u: front, y: under(front) },
      { u: MAIN_RIDGE_Z, y: under(MAIN_RIDGE_Z) },
      { u: back, y: under(back) },
    ],
    holes: [{ id: "laundry-garage-door", from: -4.4, to: -3.35, bottom: STOREYS.groundFloor, top: 2.2 }],
  });
  const plan = rect(GARAGE_INNER.x, GARAGE_INNER.z);
  return [
    part("garage-shared-wall", OWNER, "wall", PALETTE.siding, shared),
    part("garage-floor-base", OWNER, "floor", PALETTE.concrete, slab({ outline: plan, bottom: STOREYS.garageFloor - LAYERS.garageBase, top: STOREYS.garageFloor })),
    part("garage-ceiling-base", OWNER, "ceiling", PALETTE.ceiling, slab({ outline: plan, bottom: STOREYS.garageCeiling, top: STOREYS.garageCeiling + LAYERS.ceilingReservation })),
  ];
};
