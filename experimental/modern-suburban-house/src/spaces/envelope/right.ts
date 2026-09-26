/**
 * Right elevation: the exposed parts of the main right gable wall, the step
 * wall between the main and low roofs, and the garage right gable wall.
 *
 * Design owner: `docs/spaces/envelope/right.md` (`right-roof-closures`,
 * `right-openings`, `family-right-window`, `tub-right-window`,
 * `garage-right-window`). The main right wall is X = [5.50, 5.75] m; the part
 * shared with the garage, Z = [-6.70, -0.30], is the garage-owned wall body
 * (03, 07) emitted by `garage.ts`, so this owner emits Z = [-10.45, -6.70] and
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
import { BACK_EAVE_Z, FRONT_EAVE_Z, GARAGE_RIDGE_Z, MAIN_RIDGE_Z, ROOF_THICKNESS, SPLIT_X, garageRoof, mainRoof, rightRoof } from "../roof/junctions";
import { type IHousePart, type IWallPoint, part, wallPanel } from "../solids";

const OWNER = "envelope/right.ts";
const B = EXTERIOR_WALL_BOTTOM;
const ACROSS = [MAIN.inner.x[1], MAIN.outer.x[1]] as const;
const under = (z: number): number => rightRoof(z) - ROOF_THICKNESS;

/** A step-wall run over [z0, z1]: low-roof underside up to the main underside. */
const stepRun = (z0: number, z1: number): IWallPoint[] => {
  const zs = z0 < MAIN_RIDGE_Z && MAIN_RIDGE_Z < z1 ? [z0, MAIN_RIDGE_Z, z1] : [z0, z1];
  return [
    ...zs.map((z) => ({ u: z, y: rightRoof(z) - ROOF_THICKNESS })),
    ...[...zs].reverse().map((z) => ({ u: z, y: mainRoof(z) - ROOF_THICKNESS })),
  ];
};

/** Emit the right elevation parts. */
/**
 * @evidence spaces/envelope/right.md This builder forms the exposed main-right, stepped roof, and garage-right wall segments.
 * @evidence spaces/envelope/right.md#right-roof-closures Main-right panels stop around the garage-owned shared wall; separate step runs close only exposed high-to-low roof spans.
 * @evidence spaces/envelope/right.md#right-openings Two house windows and one garage window puncture exposed walls, never the main/garage shared contact.
 * @evidence spaces/envelope/right.md#family-right-window The ground family hole lies behind the garage rear wall under the low right roof.
 * @evidence spaces/envelope/right.md#tub-right-window The high upper-bath hole lies above the family window span with its own Y=4.56 sill.
 * @evidence spaces/envelope/right.md#garage-right-window The garage-side void sits under its own gable between the front and rear garage walls.
 * @evidence principles/core/source-units.md#source-scope-preservation Shared-wall body belongs to garage.ts and window leaves to models; this builder emits only exposed wall sections.
 * @evidence principles/core/source-units.md#source-substantive-completion Back/sliver main panels, three step runs, and the garage gable form concrete meshes with three named holes.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The right parent fixes exposed segments, step thickness, and window positions; no duplicate shared wall was required.
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
      { id: "family-right-window", from: -9.95, to: -8.25, bottom: 0.75, top: 2.3 },
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
    axis: "z", across: ACROSS,
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
    part(id, OWNER, "wall", PALETTE.siding, wallPanel({ axis: "z", across: [SPLIT_X - 0.15, SPLIT_X], outline: stepRun(z0, z1) }));
  const garageUnder = (z: number): number => garageRoof(z) - ROOF_THICKNESS;
  const garageWall = wallPanel({
    axis: "z",
    across: [11.45, GARAGE.outer.x[1]],
    outline: [
      { u: -6.45, y: B },
      { u: -0.55, y: B },
      { u: -0.55, y: garageUnder(-0.55) },
      { u: GARAGE_RIDGE_Z, y: garageUnder(GARAGE_RIDGE_Z) },
      { u: -6.45, y: garageUnder(-6.45) },
    ],
    holes: [{ id: "garage-right-window", from: -5.85, to: -4.25, bottom: 1.4, top: 2.2 }],
  });
  return [
    part("right-main-wall-back", OWNER, "wall", PALETTE.siding, backPanel),
    part("right-main-wall-front", OWNER, "wall", PALETTE.siding, sliver),
    part("right-garage-shared-upper-wall", OWNER, "wall", PALETTE.siding, garageSharedUpper),
    step("right-step-wall", MAIN.inner.z[0], MAIN.inner.z[1]),
    step("right-step-wall-front-eave", MAIN.outer.z[1], FRONT_EAVE_Z),
    step("right-step-wall-back-eave", BACK_EAVE_Z, MAIN.outer.z[0]),
    part("right-garage-wall", OWNER, "wall", PALETTE.siding, garageWall),
  ];
};
