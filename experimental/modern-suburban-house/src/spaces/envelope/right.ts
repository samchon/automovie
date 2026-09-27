/**
 * Right elevation: the exposed parts of the main right gable wall, the step
 * wall between the main and low roofs, and the garage right gable wall.
 *
 * Design owner: `docs/spaces/envelope/right.md` (`right-roof-closures`,
 * `right-openings`, `family-right-window`, `tub-right-window`,
 * `garage-right-window`). The main right wall is X = [5.50, 5.75] m; the part
 * shared with the garage, Z = [-6.70, -0.30], has its lower body in `garage.ts`
 * and its exposed upper siding here (03, 07). This owner also emits Z = [-10.45, -6.70] and
 * the sliver Z = [-0.30, -0.25] between the garage front and the front wall.
 * Its top is the right low roof underside. Voids (Z, Y m):
 * `family-right-window` [-9.95, -8.25] × [0.75, 2.30],
 * `tub-right-window` [-8.40, -7.50] × [4.56, 5.31].
 *
 * The step wall reserves X = [1.45, 1.60] from the low roof's underside up
 * to the main roof underside; inside the front and rear wall thickness the
 * front/rear owners already close it (07), so it spans Z = [-10.45, -0.25] and
 * the two eave runs outside those walls.
 *
 * The garage right wall is X = [11.45, 11.70] between the garage front and rear
 * walls' inner faces, a gable under the garage roof, with the
 * `garage-right-window` void Z = [-5.85, -4.25], Y = [1.40, 2.20].
 */
import { EXTERIOR_WALL_BOTTOM, GARAGE, MAIN } from "../building";
import { PALETTE } from "../palette";
import {
  BACK_EAVE_Z,
  FRONT_EAVE_Z,
  GARAGE_RIDGE_Z,
  garageRoof,
  MAIN_RIDGE_Z,
  mainRoof,
  RIGHT_BACK_EAVE_Z,
  RIGHT_FRONT_EAVE_Z,
  rightRoof,
  ROOF_THICKNESS,
  SPLIT_X,
} from "../roof/junctions";
import { part, type IHousePart, type IWallPoint } from "../solid-records";
import { wallPanel } from "../solids";

/**
 * @evidence spaces/envelope/right.md The family room side window owns its rough wall cut.
 * @evidenceReview spaces/envelope/right.md #a9e918c `FAMILY_RIGHT_WINDOW` stores the sole family-side cut at Z [-9.95, -8.25], Y [0.75, 2.30]; `buildRight` passes it to the exposed back panel's hole list.
 * @evidence principles/core/source-units.md#source-scope-preservation The common room consumes only the cut's inward curtain extent.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `buildRight` owns the wall hole; `COMMON.reservations` imports this record's span and head only to reserve an inward curtain, without a second wall cut.
 * @evidence principles/core/source-units.md#source-substantive-completion The wall hole and fit-out reservation move from one coordinate.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The back wall-panel holes include this record, and the common-room curtain derives its Z extent from `.from`/`.to` and upper extent from `.top`.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Family-right-window fixes the ground side opening Z=-9.95..-8.25 m at a 0.75 m sill; the common-room curtain consumes this host span.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `family-right-window` fixes this exposed side-wall span behind the garage rear; this record carries those Z/Y limits to the wall hole and common-room curtain without changing its parent.
 */
export const FAMILY_RIGHT_WINDOW = {
  id: "family-right-window",
  from: -9.95,
  to: -8.25,
  bottom: 0.75,
  top: 2.3,
} as const;

const OWNER = "envelope/right.ts";
const B = EXTERIOR_WALL_BOTTOM;
const ACROSS = [MAIN.inner.x[1], MAIN.outer.x[1]] as const;
const under = (z: number): number => rightRoof(z) - ROOF_THICKNESS;

/** A step-wall run over [z0, z1]: low-roof underside up to the main underside. */
const stepRun = (z0: number, z1: number): IWallPoint[] => {
  const zs = z0 < MAIN_RIDGE_Z && MAIN_RIDGE_Z < z1
    ? [z0, MAIN_RIDGE_Z, z1]
    : [z0, z1];
  return [
    ...zs.map((z) => ({ u: z, y: rightRoof(z) - ROOF_THICKNESS })),
    ...[...zs].reverse().map((z) => ({ u: z, y: mainRoof(z) - ROOF_THICKNESS })),
  ];
};

/** Emit the right elevation parts. */
/**
 * @evidence spaces/envelope/right.md This builder forms the exposed main-right, stepped roof, and garage-right wall segments.
 * @evidenceReview spaces/envelope/right.md #a9e918c `buildRight` returns the exposed back and front main-right panels, siding above the garage shared wall, three high-to-low step-wall runs, and the separate garage-right gable wall.
 * @evidence spaces/envelope/right.md#right-roof-closures Main-right panels include the exposed siding above the garage-owned lower wall; separate step runs close high-to-low roof spans.
 * @evidenceReview spaces/envelope/right.md#right-roof-closures #6996e98 `garageSharedUpper` begins on the garage roof weather line and ends at the right-roof underside; `stepRun` closes the remaining main-to-low underside spans inside the wall run and beyond both eaves.
 * @evidence spaces/envelope/right.md#right-openings Two house windows and one garage window puncture exposed walls, never the main/garage shared contact.
 * @evidenceReview spaces/envelope/right.md#right-openings #42f4eb6 The exposed back panel has family and tub holes, the garage-right wall has its own high window hole, and neither the shared-upper panel nor its lower garage-owned mate is perforated by an exterior window.
 * @evidence spaces/envelope/right.md#family-right-window The ground family hole lies behind the garage rear wall under the low right roof.
 * @evidenceReview spaces/envelope/right.md#family-right-window #b0e14b9 The `FAMILY_RIGHT_WINDOW` Z interval lies behind `GARAGE.outer.z[0]`; the back panel under `rightRoof` receives its rough hole at the plan's lower family-room Y interval.
 * @evidence spaces/envelope/right.md#tub-right-window The high upper-bath hole lies above the family window span with its own Y=4.56 sill.
 * @evidenceReview spaces/envelope/right.md#tub-right-window #23e3090 The upper hole in `backPanel` is Z [-8.40, -7.50], Y [4.56, 5.31], above the lower family hole and behind the garage rear, matching the bath-window parent without merging their distinct vertical cuts.
 * @evidence spaces/envelope/right.md#garage-right-window The garage-side void sits under its own gable between the front and rear garage walls.
 * @evidenceReview spaces/envelope/right.md#garage-right-window #eba71a3 `garageWall` follows the garage inner Z faces beneath `garageRoof` and contains the Z [-5.85, -4.25], Y [1.40, 2.20] high-window cut in the right exterior thickness.
 * @evidence principles/core/source-units.md#source-scope-preservation Garage owns the shared lower body and this builder owns siding above its roof; window leaves remain with models.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `buildGarageSharedWall` owns the door-bearing body through the garage roof weather line; `garageSharedUpper` starts there, and `buildRight` makes rough wall holes without model-owned window leaves.
 * @evidence principles/core/source-units.md#source-substantive-completion Back/sliver and above-garage panels, three step runs, and the garage gable form concrete meshes with three named holes.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Seven named wall parts contain back/front main panels, siding above the garage, three step runs, and the garage gable; their wall panels include three named window holes.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work The `garageSharedUpper` case exposed the need to split one shared wall at the garage roof weather line; spaces/envelope/right.md#right-roof-closures, spaces/03-surface-owners.md#exterior-surface-handoff, and spaces/07-boundary-assembly.md#exterior-boundary-junctions allocate lower door body to garage and exposed upper siding to right.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `garageSharedUpper` begins at `garageRoof` while `buildGarageSharedWall` ends there; the three named design parents assign that single contact and its source owners, resolving the overlap the implementation exposed.
 */
export const buildRight = (): IHousePart[] => {
  const back = MAIN.inner.z[0];
  const garageBack = GARAGE.outer.z[0];
  const garageFront = GARAGE.outer.z[1];
  const backPanel = wallPanel({
    axis: "z",
    across: ACROSS,
    outline: [
      { u: back, y: B },
      { u: garageBack, y: B },
      { u: garageBack, y: under(garageBack) },
      { u: back, y: under(back) },
    ],
    holes: [
      FAMILY_RIGHT_WINDOW,
      { id: "tub-right-window", from: -8.4, to: -7.5, bottom: 4.56, top: 5.31 },
    ],
  });
  const front = MAIN.inner.z[1];
  const sliver = wallPanel({
    axis: "z",
    across: ACROSS,
    outline: [
      { u: garageFront, y: B },
      { u: front, y: B },
      { u: front, y: under(front) },
      { u: garageFront, y: under(garageFront) },
    ],
  });
  const garageSharedUpper = wallPanel({
    axis: "z",
    across: ACROSS,
    outline: [
      { u: garageBack, y: garageRoof(garageBack) },
      { u: GARAGE_RIDGE_Z, y: garageRoof(GARAGE_RIDGE_Z) },
      { u: garageFront, y: garageRoof(garageFront) },
      { u: garageFront, y: under(garageFront) },
      { u: MAIN_RIDGE_Z, y: under(MAIN_RIDGE_Z) },
      { u: garageBack, y: under(garageBack) },
    ],
  });
  const step = (id: string, z0: number, z1: number): IHousePart =>
    part(
      id,
      OWNER,
      "wall",
      PALETTE.siding,
      wallPanel({
        axis: "z",
        across: [SPLIT_X - 0.15, SPLIT_X],
        outline: stepRun(z0, z1),
      }),
    );
  const garageUnder = (z: number): number => garageRoof(z) - ROOF_THICKNESS;
  const garageWall = wallPanel({
    axis: "z",
    across: [GARAGE.inner.x[1], GARAGE.outer.x[1]],
    outline: [
      { u: GARAGE.inner.z[0], y: B },
      { u: GARAGE.inner.z[1], y: B },
      { u: GARAGE.inner.z[1], y: garageUnder(GARAGE.inner.z[1]) },
      { u: GARAGE_RIDGE_Z, y: garageUnder(GARAGE_RIDGE_Z) },
      { u: GARAGE.inner.z[0], y: garageUnder(GARAGE.inner.z[0]) },
    ],
    holes: [
      {
        id: "garage-right-window",
        from: -5.85,
        to: -4.25,
        bottom: 1.4,
        top: 2.2,
      },
    ],
  });
  return [
    part("right-main-wall-back", OWNER, "wall", PALETTE.siding, backPanel),
    part("right-main-wall-front", OWNER, "wall", PALETTE.siding, sliver),
    part(
      "right-garage-shared-upper-wall",
      OWNER,
      "wall",
      PALETTE.siding,
      garageSharedUpper,
    ),
    step("right-step-wall", MAIN.inner.z[0], MAIN.inner.z[1]),
    step(
      "right-step-wall-front-eave",
      MAIN.outer.z[1],
      Math.min(FRONT_EAVE_Z, RIGHT_FRONT_EAVE_Z),
    ),
    step(
      "right-step-wall-back-eave",
      Math.max(BACK_EAVE_Z, RIGHT_BACK_EAVE_Z),
      MAIN.outer.z[0],
    ),
    part("right-garage-wall", OWNER, "wall", PALETTE.siding, garageWall),
  ];
};
