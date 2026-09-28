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
 * The exposed rear, short front, and garage outer wall runs split at world
 * Y = 0.60 m into brick below and siding above. Their whole-height logical
 * faces stay on the siding parts; the covered garage shared wall is unsplit.
 */
import { EXTERIOR_WALL_BOTTOM, GARAGE, MAIN } from "../building";
import { PALETTE } from "../palette";
import {
  BACK_EAVE_Z,
  FRONT_EAVE_Z,
  GARAGE_RIDGE_Z,
  MAIN_RIDGE_Z,
  RIGHT_BACK_EAVE_Z,
  RIGHT_FRONT_EAVE_Z,
  ROOF_THICKNESS,
  SPLIT_X,
  garageRoof,
  mainRoof,
  rightRoof,
} from "../roof/junctions";
import { type IHousePart, type IWallPoint, part } from "../solid-records";
import { wallPanel } from "../solids";
import { EXTERIOR_PLINTH_TOP } from "./finish-boundary";

/**
 * @evidence spaces/envelope/right.md The family room side window owns its rough wall cut.
 * @evidence principles/core/source-units.md#source-scope-preservation The common room consumes only the cut's inward curtain extent.
 * @evidence principles/core/source-units.md#source-substantive-completion The wall hole and fit-out reservation move from one coordinate.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Family-right-window fixes the ground side opening Z=-9.95..-8.25 m at a 0.75 m sill; the common-room curtain consumes this host span.
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
  const zs =
    z0 < MAIN_RIDGE_Z && MAIN_RIDGE_Z < z1 ? [z0, MAIN_RIDGE_Z, z1] : [z0, z1];
  return [
    ...zs.map((z) => ({ u: z, y: rightRoof(z) - ROOF_THICKNESS })),
    ...[...zs]
      .reverse()
      .map((z) => ({ u: z, y: mainRoof(z) - ROOF_THICKNESS })),
  ];
};

/** Emit the right elevation parts. */
/**
 * @evidence spaces/envelope/right.md This builder forms the exposed main-right, stepped roof, and garage-right wall segments.
 * @evidence spaces/envelope/right.md#right-roof-closures Main-right panels include the exposed siding above the garage-owned lower wall; separate step runs close high-to-low roof spans.
 * @evidence spaces/envelope/right.md#right-openings Two house windows and one garage window puncture exposed walls, never the main/garage shared contact.
 * @evidence spaces/envelope/right.md#family-right-window The ground family hole lies behind the garage rear wall under the low right roof.
 * @evidence spaces/envelope/right.md#tub-right-window The upper bath hole lies behind the garage rear at Z=[-8.40,-7.50] and Y=[4.56,5.31]; its Z span overlaps the family hole by 0.15 m.
 * @evidence spaces/envelope/right.md#garage-right-window The garage-side void sits under its own gable between the front and rear garage walls.
 * @evidence principles/core/source-units.md#source-scope-preservation Garage owns the shared lower body and this builder owns siding above its roof; window leaves remain with models.
 * @evidence principles/core/source-units.md#source-substantive-completion Back/sliver and garage siding panels, their brick bases, the above-garage panel, and three step runs form concrete meshes with three named holes.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work The `garageSharedUpper` case exposed the need to split one shared wall at the garage roof weather line; spaces/envelope/right.md#right-roof-closures, spaces/03-surface-owners.md#exterior-surface-handoff, and spaces/07-boundary-assembly.md#exterior-boundary-junctions allocate lower door body to garage and exposed upper siding to right.
 */
export const buildRight = (): IHousePart[] => {
  const back = MAIN.inner.z[0];
  const garageBack = GARAGE.outer.z[0];
  const garageFront = GARAGE.outer.z[1];
  const backPanel = wallPanel({
    axis: "z",
    across: ACROSS,
    outline: [
      { u: back, y: EXTERIOR_PLINTH_TOP },
      { u: garageBack, y: EXTERIOR_PLINTH_TOP },
      { u: garageBack, y: under(garageBack) },
      { u: back, y: under(back) },
    ],
    holes: [
      FAMILY_RIGHT_WINDOW,
      { id: "tub-right-window", from: -8.4, to: -7.5, bottom: 4.56, top: 5.31 },
    ],
  });
  const backPlinth = wallPanel({
    axis: "z",
    across: ACROSS,
    outline: [
      { u: back, y: B },
      { u: garageBack, y: B },
      { u: garageBack, y: EXTERIOR_PLINTH_TOP },
      { u: back, y: EXTERIOR_PLINTH_TOP },
    ],
  });
  const front = MAIN.inner.z[1];
  const sliver = wallPanel({
    axis: "z",
    across: ACROSS,
    outline: [
      { u: garageFront, y: EXTERIOR_PLINTH_TOP },
      { u: front, y: EXTERIOR_PLINTH_TOP },
      { u: front, y: under(front) },
      { u: garageFront, y: under(garageFront) },
    ],
  });
  const sliverPlinth = wallPanel({
    axis: "z",
    across: ACROSS,
    outline: [
      { u: garageFront, y: B },
      { u: front, y: B },
      { u: front, y: EXTERIOR_PLINTH_TOP },
      { u: garageFront, y: EXTERIOR_PLINTH_TOP },
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
      { u: GARAGE.inner.z[0], y: EXTERIOR_PLINTH_TOP },
      { u: GARAGE.inner.z[1], y: EXTERIOR_PLINTH_TOP },
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
  const garagePlinth = wallPanel({
    axis: "z",
    across: [GARAGE.inner.x[1], GARAGE.outer.x[1]],
    outline: [
      { u: GARAGE.inner.z[0], y: B },
      { u: GARAGE.inner.z[1], y: B },
      { u: GARAGE.inner.z[1], y: EXTERIOR_PLINTH_TOP },
      { u: GARAGE.inner.z[0], y: EXTERIOR_PLINTH_TOP },
    ],
  });
  const fullBoundary = (solid: typeof backPanel) => ({
    ...solid,
    face: {
      ...solid.face,
      outline: solid.face.outline.map((point, i) =>
        i < 2 ? { ...point, y: B } : point,
      ),
    },
  });
  return [
    part(
      "right-main-wall-back",
      OWNER,
      "wall",
      PALETTE.siding,
      fullBoundary(backPanel),
    ),
    {
      ...part(
        "right-main-wall-back-plinth",
        OWNER,
        "wall",
        PALETTE.brick,
        backPlinth.mesh,
      ),
      pendingMapGround: "map-ground-pending",
    },
    part(
      "right-main-wall-front",
      OWNER,
      "wall",
      PALETTE.siding,
      fullBoundary(sliver),
    ),
    {
      ...part(
        "right-main-wall-front-plinth",
        OWNER,
        "wall",
        PALETTE.brick,
        sliverPlinth.mesh,
      ),
      pendingMapGround: "map-ground-pending",
    },
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
    part(
      "right-garage-wall",
      OWNER,
      "wall",
      PALETTE.siding,
      fullBoundary(garageWall),
    ),
    {
      ...part(
        "right-garage-wall-plinth",
        OWNER,
        "wall",
        PALETTE.brick,
        garagePlinth.mesh,
      ),
      pendingMapGround: "map-ground-pending",
    },
  ];
};
