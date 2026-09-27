/**
 * Attached garage structure: the main/garage shared wall, the garage floor
 * base and the garage ceiling base.
 *
 * Design owners: `docs/spaces/00-building.md#attached-garage-extent` (outline
 * X = [5.50, 11.70], Z = [-6.70, -0.30] m; one 0.25 m shared wall
 * X = [5.50, 5.75]; inner limit X = [5.75, 11.45], Z = [-6.45, -0.55]),
 * `03-surface-owners.md` (this file owns the shared wall below the garage roof and the garage
 * floor base), `10-ground-floor.md#garage-ground-floor-base` (0.15 m below the
 * finished floor Y = -0.15) and `09-ceiling-assembly.md#garage-ceiling-closure`
 * (ceiling Y = 2.55 m plus the 0.18 m reservation). The shared wall stops at
 * the garage roof upper weather line; the exposed siding above belongs to right.ts.
 * This lower body carries the `laundry-garage-door` void
 * Z = [-4.40, -3.35], Y = [-0.175, 2.20] m owned by the laundry plan (the main
 * ground base and the laundry threshold fill it below Y = 0, 10). The garage
 * floor base also runs through the garage front wall under `garage-front-door`,
 * X = [6.10, 11.10], Z = [-0.55, -0.30]. The ceiling base starts 0.015 m above
 * the finished ceiling; that finish zone belongs to `rooms/garage-interior.ts`.
 *
 * The garage stays empty: no vehicle is authored.
 */
import { EXTERIOR_WALL_BOTTOM, GARAGE, MAIN } from "./building";
import type { IAutoMovieMesh } from "@automovie/interface";
import { partitionPlaneFace } from "./face-partition";
import { PALETTE } from "./palette";
import { GARAGE_RIDGE_Z, garageRoof } from "./roof/junctions";
import { part, type IHousePart } from "./solid-records";
import { rect, slab, wallPanel } from "./solids";
import { LAUNDRY_GARAGE_DOOR } from "./rooms/laundry";
import { GARAGE_FRONT_DOOR } from "./envelope/front";
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
 * @evidence spaces/03-surface-owners.md The garage source emits the shared lower wall body and leaves the exposed upper siding to the right elevation.
 * @evidenceReview spaces/03-surface-owners.md #9596716 buildGarageSharedWall emits garage-shared-wall through the garageRoof weather line; envelope/right.ts emits the separate siding body above that line, matching the owner table.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff garage-shared-wall carries the laundry-garage-door void below the garage roof.
 * @evidenceReview spaces/03-surface-owners.md#exterior-surface-handoff #9f3db3c The returned wallPanel includes LAUNDRY_GARAGE_DOOR in its hole list and remains under garage.ts until its garageRoof top, as the exterior handoff assigns.
 * @evidence principles/core/source-units.md#source-scope-preservation The wall uses MAIN/GARAGE contact coordinates and the garageRoof upper weather line; its returned part does not duplicate upper siding.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The wall takes its X thickness from MAIN and its Z run from GARAGE, while garageRoof supplies the top; the function returns only the lower shared-wall part.
 * @evidence principles/core/source-units.md#source-substantive-completion wallPanel constructs the sloped top and door hole, and part returns the wall with an interior finish palette.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f wallPanel extrudes the sloped outline and cuts LAUNDRY_GARAGE_DOOR; part() returns a named wall with that mesh, face and garage owner.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work The reviewed surface handoff splits the wall at the garage roof: garage retains the door body and right owns exposed siding.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The owner handoff divides the shared wall at the garage roof weather line; garage.ts ends its door-bearing wall there and envelope/right.ts starts the exposed siding body there, so this source needs no parent change.
 */
export const buildGarageSharedWall = (): IHousePart[] => {
  const weatherLine = (z: number): number => garageRoof(z);
  const back = GARAGE.outer.z[0];
  const front = GARAGE.outer.z[1];
  const shared = wallPanel({
    axis: "z",
    across: [MAIN.inner.x[1], MAIN.outer.x[1]],
    outline: [
      { u: back, y: EXTERIOR_WALL_BOTTOM },
      { u: front, y: EXTERIOR_WALL_BOTTOM },
      { u: front, y: weatherLine(front) },
      { u: GARAGE_RIDGE_Z, y: weatherLine(GARAGE_RIDGE_Z) },
      { u: back, y: weatherLine(back) },
    ],
    holes: [LAUNDRY_GARAGE_DOOR],
  });
  return [
    part("garage-shared-wall", OWNER, "wall", PALETTE.interiorWall, shared),
  ];
};

/** One garage floor solid supplies disjoint structural and visible faces. */
/**
 * @evidence spaces/10-ground-floor.md This shared garage slab recipe carries the designed independent support and front opening tongue.
 * @evidenceReview spaces/10-ground-floor.md `garageFloorMesh` uses the garage inner footprint, front-door span, and lower floor datum in that file; its callers assign the support and exposed face to separate actual authors.
 * @evidence spaces/10-ground-floor.md#garage-ground-floor-base The shared slab recipe spans the garage inner plan and the front door tongue at the specified lower datum.
 * @evidenceReview spaces/10-ground-floor.md#garage-ground-floor-base #c3227ca `garageFloorMesh` uses `GARAGE.inner` and a front-door tongue, with its top at `STOREYS.garageFloor` and bottom one `GROUND_LAYERS.garageBase` lower; callers assign support and exposed face separately.
 * @evidence principles/core/source-units.md#source-scope-preservation Both garage owners use this one footprint without creating a second floor body.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `buildGarageFloorBase` and `buildGarageInterior` both call this mesh recipe, then take opposite results of `partitionPlaneFace`; this export records bounds without assigning room finish ownership.
 * @evidence principles/core/source-units.md#source-substantive-completion The eight-point outline and garage base depth provide the triangles partitioned by the two actual authors.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The outline includes six inner/front vertices and the two outer-front tongue vertices; `slab` closes the specified 0.15 m interval before either caller selects disjoint triangle sets.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The reviewed garage base and front crossing already fix the footprint and levels consumed here.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `garage-ground-floor-base` supplies the lower slab and `ground-threshold-junctions` extends it below `GARAGE_FRONT_DOOR`; the outline implements both without a changed parent datum.
 */
export const garageFloorMesh = (): IAutoMovieMesh => slab({
  outline: [
    { x: GARAGE.inner.x[0], z: GARAGE.inner.z[0] },
    { x: GARAGE.inner.x[1], z: GARAGE.inner.z[0] },
    { x: GARAGE.inner.x[1], z: GARAGE.inner.z[1] },
    { x: GARAGE_FRONT_DOOR.to, z: GARAGE.inner.z[1] },
    { x: GARAGE_FRONT_DOOR.to, z: GARAGE.outer.z[1] },
    { x: GARAGE_FRONT_DOOR.from, z: GARAGE.outer.z[1] },
    { x: GARAGE_FRONT_DOOR.from, z: GARAGE.inner.z[1] },
    { x: GARAGE.inner.x[0], z: GARAGE.inner.z[1] },
  ],
  bottom: STOREYS.garageFloor - GROUND_LAYERS.garageBase,
  top: STOREYS.garageFloor,
});

/** Emit the garage floor support beneath its room-owned top face. */
/**
 * @evidence spaces/10-ground-floor.md This export builds the separate lower garage base under its finished floor.
 * @evidenceReview spaces/10-ground-floor.md #9f27f8e `buildGarageFloorBase` emits the garage support triangles from the independent slab between `garageFloor - garageBase` and the finished garage level; the visible upper face is authored by `buildGarageInterior`.
 * @evidence spaces/10-ground-floor.md#ground-threshold-junctions Its slab reaches the garage front wall's outer face only beneath garage-front-door and meets the inner wall limit elsewhere.
 * @evidenceReview spaces/10-ground-floor.md#ground-threshold-junctions #4150be7 `garageFloorMesh` extends the `GARAGE_FRONT_DOOR` span from inner front Z to `GARAGE.outer.z[1]`; this builder retains its structural underside and sides under the front crossing.
 * @evidence principles/core/source-units.md#source-scope-preservation The base ends at STOREYS.garageFloor; garage-interior authors the exposed upper face from the same mesh.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The body result omits every triangle on the `STOREYS.garageFloor` plane, which `rooms/garage-interior.ts` emits as `garage-floor-finish`; the shared recipe adds no overlapping floor plate.
 * @evidence principles/core/source-units.md#source-substantive-completion The eight-point slab's non-top triangles produce the garage-floor-base support with no overlapping visible face.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `garageFloorMesh` creates the eight-point slab; `partitionPlaneFace` returns its non-top triangles and `part` gives that support the `garage-floor-base` identity and concrete palette.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-ground-floor-base sets the independent slab 0.15 m below the finished floor; ground-threshold-junctions extends it beneath garage-front-door. This builder uses both bounds.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The reviewed garage floor parent assigns this file the base and the room file its exposed face; the front crossing parent supplies the door tongue, so splitting existing slab triangles requires no upstream boundary revision.
 */
export const buildGarageFloorBase = (): IHousePart[] => [
  part(
    "garage-floor-base",
    OWNER,
    "floor",
    PALETTE.concrete,
    partitionPlaneFace(garageFloorMesh(), "y", STOREYS.garageFloor).body,
  ),
];

/** Emit the garage ceiling base above the garage finished ceiling. */
/**
 * @evidence spaces/09-ceiling-assembly.md This export builds garage ceiling support over the finished garage height.
 * @evidenceReview spaces/09-ceiling-assembly.md #403d803 buildGarageCeiling makes one structural ceiling base inside GARAGE.inner and leaves the visible interior finish to the room owner named by the ceiling handoff.
 * @evidence spaces/09-ceiling-assembly.md#garage-ceiling-closure The slab spans GARAGE.inner and fills Y from garageCeiling plus finish to garageCeiling plus reservation.
 * @evidenceReview spaces/09-ceiling-assembly.md#garage-ceiling-closure #0ce5421 rect uses GARAGE.inner X/Z and slab spans from garageCeiling plus the finish thickness to the reservation top, matching the garage ceiling closure.
 * @evidence principles/core/source-units.md#source-scope-preservation It omits the visible ceiling finish assigned to garage-interior and does not raise the roof or garage datum.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The base starts above the garageCeiling finish interval; garage-interior emits that finish, and this builder changes neither roof height nor garage datum.
 * @evidence principles/core/source-units.md#source-substantive-completion rect and slab return a closed, stable garage-ceiling-base part with its support depth.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f rect and slab make a closed ceiling base over the garage inner plan and part() gives it a stable garage-ceiling-base identity.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-ceiling-closure puts support above the 2.55 m finished ceiling inside GARAGE.inner while garage-interior owns the finish; this builder emits that support footprint only.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The ceiling closure parent assigns the inner-footprint base to garage.ts and the visible finish to garage-interior; this slab consumes the reserved interval without claiming the room finish.
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
