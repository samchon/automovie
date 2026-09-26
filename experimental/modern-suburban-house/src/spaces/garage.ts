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
 * Z = [-4.40, -3.35], Y = [-0.175, 2.20] m owned by the laundry plan (the main
 * ground base and the laundry threshold fill it below Y = 0, 10). The garage
 * floor base also runs through the garage front wall under `garage-front-door`,
 * X = [6.10, 11.10], Z = [-0.55, -0.30]. The ceiling base starts 0.015 m above
 * the finished ceiling; that finish zone belongs to `rooms/garage-interior.ts`.
 *
 * The garage stays empty: no vehicle is authored.
 */
import { EXTERIOR_WALL_BOTTOM, GARAGE, MAIN } from "./building";
import { PALETTE } from "./palette";
import { MAIN_RIDGE_Z, rightRoof, ROOF_THICKNESS } from "./roof/junctions";
import { part, rect, slab, wallPanel, type IHousePart } from "./solids";
import {
  CEILING_FINISH,
  CEILING_RESERVATION,
  GROUND_LAYERS,
  STOREYS,
} from "./storeys";

const OWNER = "garage.ts";
/** Ceiling finish zone inside the 0.18 m reservation, owned by the garage interior (09). */

/** Emit the main/garage shared wall with the laundry-garage door void. */
/**
 * @evidence spaces/03-surface-owners.md The garage source emits the one shared wall body and leaves each room's inward face to its room owner.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff garage-shared-wall has one structural id and the laundry-garage-door void in that body.
 * @evidence principles/core/source-units.md#source-scope-preservation The wall uses MAIN/GARAGE contact coordinates and rightRoof underside; its returned part does not duplicate a garage facade.
 * @evidence principles/core/source-units.md#source-substantive-completion wallPanel constructs the sloped top and door hole, and part returns the wall with an interior finish palette.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The surface handoff assigns the shared body and door void here; the imported bounds and roof function sufficed without a second wall owner.
 */
export const buildGarageSharedWall = (): IHousePart[] => {
  const under = (z: number): number => rightRoof(z) - ROOF_THICKNESS;
  const back = GARAGE.outer.z[0];
  const front = GARAGE.outer.z[1];
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
    holes: [
      {
        id: "laundry-garage-door",
        from: -4.4,
        to: -3.35,
        bottom: STOREYS.groundFloor - GROUND_LAYERS.finish - GROUND_LAYERS.base,
        top: 2.2,
      },
    ],
  });
  return [
    part("garage-shared-wall", OWNER, "wall", PALETTE.interiorWall, shared),
  ];
};

/** Emit the independent garage floor base under the garage finished floor. */
/**
 * @evidence spaces/10-ground-floor.md This export builds the separate lower garage base under its finished floor.
 * @evidence spaces/10-ground-floor.md#garage-ground-floor-base Its slab extends beneath the front-door threshold while ending at the garage inner-wall limits elsewhere.
 * @evidence principles/core/source-units.md#source-scope-preservation The base stops at STOREYS.garageFloor; garage-interior owns the visible concrete finish above it.
 * @evidence principles/core/source-units.md#source-substantive-completion The eight-point outline and 0.15 m depth produce a closed garage-floor-base solid.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The garage-floor parent fixes the lower datum, base depth, and front-door support; no extra slab edge was required.
 */
export const buildGarageFloorBase = (): IHousePart[] => [
  part(
    "garage-floor-base",
    OWNER,
    "floor",
    PALETTE.concrete,
    slab({
      outline: [
        { x: GARAGE.inner.x[0], z: GARAGE.inner.z[0] },
        { x: GARAGE.inner.x[1], z: GARAGE.inner.z[0] },
        { x: GARAGE.inner.x[1], z: GARAGE.inner.z[1] },
        { x: 11.1, z: GARAGE.inner.z[1] },
        { x: 11.1, z: GARAGE.outer.z[1] },
        { x: 6.1, z: GARAGE.outer.z[1] },
        { x: 6.1, z: GARAGE.inner.z[1] },
        { x: GARAGE.inner.x[0], z: GARAGE.inner.z[1] },
      ],
      bottom: STOREYS.garageFloor - GROUND_LAYERS.garageBase,
      top: STOREYS.garageFloor,
    }),
  ),
];

/** Emit the garage ceiling base above the garage finished ceiling. */
/**
 * @evidence spaces/09-ceiling-assembly.md This export builds garage ceiling support over the finished garage height.
 * @evidence spaces/09-ceiling-assembly.md#garage-ceiling-closure The slab spans GARAGE.inner and fills Y from garageCeiling plus finish to garageCeiling plus reservation.
 * @evidence principles/core/source-units.md#source-scope-preservation It omits the visible ceiling finish assigned to garage-interior and does not raise the roof or garage datum.
 * @evidence principles/core/source-units.md#source-substantive-completion rect and slab return a closed, stable garage-ceiling-base part with its support depth.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The ceiling parent supplies inner bounds and finish/support split; the builder needed no new ceiling footprint.
 */
export const buildGarageCeiling = (): IHousePart[] => [
  part(
    "garage-ceiling-base",
    OWNER,
    "ceiling",
    PALETTE.ceiling,
    slab({
      outline: rect(GARAGE.inner.x, GARAGE.inner.z),
      bottom: STOREYS.garageCeiling + CEILING_FINISH,
      top: STOREYS.garageCeiling + CEILING_RESERVATION,
    }),
  ),
];
