/**
 * Rear elevation: the main rear wall and the garage rear wall with their voids.
 *
 * Design owner: `docs/spaces/envelope/rear.md`. The main rear wall is
 * Z = [-10.70, -10.45] m over X = [-5.75, 5.75] m and owns both rear corners
 * (07). Its top follows the main back roof to X = 1.60 and the right low roof
 * beyond, with wall-head wedges across the thickness. Voids (X, Y m):
 * - `kitchen-rear-window` [-4.50, -3.30] × [1.15, 2.30];
 * - `family-rear-window` [2.75, 4.75] × [0.75, 2.30];
 * - `primary-rear-window` [-3.85, -1.45] × [3.91, 5.31];
 * - `garden-door` [-1.20, 1.20] × [-0.175, 2.25]; the wall leaves the ground
 *   base reservation under it (10 ground-threshold-junctions) and
 *   `garden-door-threshold` fills the finish zone through the thickness, top
 *   0.02 m above the finished floor.
 * The garage rear wall is Z = [-6.70, -6.45] over X = [5.75, 11.70] with no
 * opening. Door leaves and window frames are later models.
 */
import { EXTERIOR_WALL_BOTTOM, GARAGE, MAIN } from "../building";
import { PALETTE } from "../palette";
import {
  gBack,
  mBack,
  rBack,
  ROOF_THICKNESS,
  SPLIT_X,
} from "../roof/junctions";
import { block, part, wallPanel, type IHousePart } from "../solids";
import { GROUND_LAYERS, STOREYS } from "../storeys";
import { wallHead } from "./wall-head";

const OWNER = "envelope/rear.ts";
const B = EXTERIOR_WALL_BOTTOM;
const BACK = MAIN.outer.z[0];
const INNER = BACK + MAIN.wall;
/** Bottom of the ground base reservation the wall leaves under the garden door (10). */
const SILL = STOREYS.groundFloor - GROUND_LAYERS.finish - GROUND_LAYERS.base;
/**
 * @evidence spaces/envelope/rear.md The central rear exit has one opening span for wall, threshold, and floor support.
 * @evidence spaces/envelope/rear.md#garden-door Its -1.20..1.20 m jambs meet the terrace while the sill follows the ground base layers.
 * @evidence principles/core/source-units.md#source-scope-preservation The host defines the rough wall cut and leaves glazed leaves and hardware to models.
 * @evidence principles/core/source-units.md#source-substantive-completion Rear wall, rear threshold, and ground slab tongue take their X bounds from this object.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The rear exit and level terrace relation are already settled in its design.
 */
export const GARDEN_DOOR = {
  id: "garden-door",
  from: -1.2,
  to: 1.2,
  bottom: SILL,
  top: 2.25,
} as const;
/** Rough opening owned by the rear elevation and consumed by bedroom reservations. */
/**
 * @evidence spaces/envelope/rear.md The upper rear opening in the primary bedroom remains a wall-hosted void.
 * @evidence spaces/envelope/rear.md#primary-rear-window The -3.85..-1.45 m span and 3.91..5.31 m heights avoid the wardrobe bay.
 * @evidence principles/core/source-units.md#source-scope-preservation The bedroom imports this void only to reserve its inward curtain strip.
 * @evidence principles/core/source-units.md#source-substantive-completion The rear wall cut and the bedroom curtain share one sill, head, and horizontal host.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The rear window paragraph fixes its position before curtain fit-out.
 */
export const PRIMARY_REAR_WINDOW = {
  id: "primary-rear-window",
  from: -3.85,
  to: -1.45,
  bottom: 3.91,
  top: 5.31,
} as const;

/** Emit the rear elevation walls. */
/**
 * @evidence spaces/envelope/rear.md This builder creates the rear main and garage walls with room-specific voids.
 * @evidence spaces/envelope/rear.md#rear-roof-closures The main top steps under high and low rear roofs and the garage rear wall remains separate.
 * @evidence spaces/envelope/rear.md#rear-openings Four named rough voids in the main rear wall bind kitchen, family, primary bedroom, and garden access.
 * @evidence spaces/envelope/rear.md#kitchen-rear-window The narrow kitchen hole begins at Y=1.15 over the counter reservation.
 * @evidence spaces/envelope/rear.md#family-rear-window The right ground window hole remains in the common room's family side.
 * @evidence spaces/envelope/rear.md#primary-rear-window The upper rear hole stops in the primary bedroom span, leaving wardrobe storage wall closed.
 * @evidence spaces/envelope/rear.md#garden-door The central X=-1.20..1.20 void and finished threshold reach the level terrace side.
 * @evidence principles/core/source-units.md#source-scope-preservation Door leaves and window frames remain model fills; this source owns wall, openings, roof wedges, and threshold.
 * @evidence principles/core/source-units.md#source-substantive-completion The return has two closed wall solids, four real voids, three head wedges, and garden threshold support.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Rear parent units fix the step, four voids, and level garden exit; no new rear opening was needed.
 */
export const buildRear = (): IHousePart[] => {
  const mainTop = mBack(BACK) - ROOF_THICKNESS;
  const rightTop = rBack(BACK) - ROOF_THICKNESS;
  const main = wallPanel({
    axis: "x",
    across: [BACK, INNER],
    outline: [
      { u: MAIN.outer.x[0], y: B },
      { u: MAIN.outer.x[1], y: B },
      { u: MAIN.outer.x[1], y: rightTop },
      { u: SPLIT_X, y: rightTop },
      { u: SPLIT_X, y: mainTop },
      { u: MAIN.outer.x[0], y: mainTop },
    ],
    holes: [
      {
        id: "kitchen-rear-window",
        from: -4.5,
        to: -3.3,
        bottom: 1.15,
        top: 2.3,
      },
      { id: "family-rear-window", from: 2.75, to: 4.75, bottom: 0.75, top: 2.3 },
      PRIMARY_REAR_WINDOW,
      GARDEN_DOOR,
    ],
  });
  const garageTop = gBack(GARAGE.outer.z[0]) - ROOF_THICKNESS;
  const garage = wallPanel({
    axis: "x",
    across: [GARAGE.outer.z[0], -6.45],
    outline: [
      { u: GARAGE.inner.x[0], y: B },
      { u: GARAGE.outer.x[1], y: B },
      { u: GARAGE.outer.x[1], y: garageTop },
      { u: GARAGE.inner.x[0], y: garageTop },
    ],
  });
  return [
    part("rear-main-wall", OWNER, "wall", PALETTE.siding, main),
    wallHead({
      id: "rear-main-wall-head",
      owner: OWNER,
      x: [MAIN.outer.x[0], SPLIT_X],
      z: [BACK, INNER],
      roof: mBack,
      outerZ: BACK,
    }),
    wallHead({
      id: "rear-right-wall-head",
      owner: OWNER,
      x: [SPLIT_X, MAIN.outer.x[1]],
      z: [BACK, INNER],
      roof: rBack,
      outerZ: BACK,
    }),
    part(
      "garden-door-threshold",
      OWNER,
      "floor",
      PALETTE.structure,
      block(
        [GARDEN_DOOR.from, STOREYS.groundFloor - GROUND_LAYERS.finish, BACK],
        [GARDEN_DOOR.to, STOREYS.groundFloor + 0.02, INNER],
      ),
    ),
    part("rear-garage-wall", OWNER, "wall", PALETTE.siding, garage),
    wallHead({
      id: "rear-garage-wall-head",
      owner: OWNER,
      x: [GARAGE.inner.x[0], GARAGE.outer.x[1]],
      z: [GARAGE.outer.z[0], -6.45],
      roof: gBack,
      outerZ: GARAGE.outer.z[0],
    }),
  ];
};
