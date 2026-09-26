/**
 * Front elevation: the main front wall with the gable triangle, and the garage
 * front wall, each with its real voids.
 *
 * Design owner: `docs/spaces/envelope/front.md`. The main front wall is
 * Z = [-0.25, 0] m over X = [-5.75, 5.75] m and owns both front corners (07
 * exterior-boundary-junctions). Its top follows the roof undersides at the
 * outer line: the gable triangle F − 0.24 over X = [-5.75, -1.80], the main roof
 * to the split X = 1.60, the right low roof beyond it; wall-head wedges carry
 * the slope across the thickness. Voids (X, Y m):
 * - `living-front-window` [-5.10, -2.30] × [0.70, 2.30];
 * - `bedroom-two-front-window` [-4.80, -2.70] × [3.91, 5.31];
 * - `stair-front-window` [-1.62, -0.84] × [4.11, 5.21];
 * - `bedroom-three-front-window` [2.65, 4.75] × [3.91, 5.31];
 * - `front-door` [0.40, 1.40] × [-0.175, 2.20] (void owned by entry-plan); the
 *   wall leaves the ground base reservation under it (10
 *   ground-threshold-junctions) and `front-door-threshold` fills the finish
 *   zone through the thickness, top 0.02 m above the finished floor.
 * The garage front wall is Z = [-0.55, -0.30] over X = [5.75, 11.70] with the
 * `garage-front-door` void X = [6.10, 11.10], Y = [-0.30, 2.15] (the garage
 * base runs through the thickness below -0.15, 10); the closed
 * panel leaf and rails are later models, so the void is open here.
 */
import { EXTERIOR_WALL_BOTTOM, GARAGE, MAIN } from "../building";
import { PALETTE } from "../palette";
import { GABLE, ROOF_THICKNESS, SPLIT_X, gFront, gable, mFront, rFront } from "../roof/junctions";
import { type IHousePart, block, part, wallPanel, slopedSlab } from "../solids";
import { GROUND_LAYERS, STOREYS } from "../storeys";
import { FRONT_DOOR } from "../rooms/entry";
import { wallHead } from "./wall-head";

const OWNER = "envelope/front.ts";
const B = EXTERIOR_WALL_BOTTOM;
const FRONT = MAIN.outer.z[1];
const INNER = FRONT - MAIN.wall;
/** Rough garage opening; room fit-out reserves the guide from this host. */
/**
 * @evidence spaces/envelope/front.md GARAGE_FRONT_DOOR is the single authored measurement record consumed by neighboring owners.
 * @evidence spaces/envelope/front.md#garage-front-opening Its bounds or datum follow this source owner's reviewed plan.
 * @evidence principles/core/source-units.md#source-scope-preservation GARAGE_FRONT_DOOR shares a host value without creating a second part or place.
 * @evidence principles/core/source-units.md#source-substantive-completion Consumers import GARAGE_FRONT_DOOR for matching boundaries and reservations.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The reviewed GARAGE_FRONT_DOOR owner fixes this measurement; its consumers add no independent value.
 */
export const GARAGE_FRONT_DOOR = { id: "garage-front-door", from: 6.1, to: 11.1, bottom: STOREYS.garageFloor - GROUND_LAYERS.garageBase, top: 2.15 } as const;
/** Bottom of the ground base reservation the wall leaves under the front door (10). */

/** Emit the front elevation walls. */
/**
 * @evidence spaces/envelope/front.md This builder emits the complete front wall bodies with their authored rough voids and threshold support.
 * @evidence spaces/envelope/front.md#front-roof-closures One wall outline rises under the high gable, main plane, and low right roof, with thickness wedges at those contacts.
 * @evidence spaces/envelope/front.md#front-openings Five named front voids remain in the shared wall face; service and powder receive no invented front window.
 * @evidence spaces/envelope/front.md#living-front-window The ground living void spans X=-5.10..-2.30 below the porch roof.
 * @evidence spaces/envelope/front.md#bedroom-two-front-window The left upper bedroom void spans X=-4.80..-2.70 beneath the gable.
 * @evidence spaces/envelope/front.md#stair-front-window The narrow upper-height void stays in the stair's front-wall span.
 * @evidence spaces/envelope/front.md#bedroom-three-front-window The right upper bedroom void lies on the lower-roof portion, not the garage face.
 * @evidence spaces/envelope/front.md#front-entry-filling The front-door rough void and finish threshold give the later wood/glass leaf its authored host and porch contact.
 * @evidence spaces/envelope/front.md#garage-front-opening One wide garage-front-door void and the base beneath it leave room for the later single moving panel door.
 * @evidence principles/core/source-units.md#source-scope-preservation This source builds wall/reveal void geometry and threshold only; window frames, door leaves, and rails remain model work.
 * @evidence principles/core/source-units.md#source-substantive-completion The result includes main and garage wall solids, roof-contact wedges, six real voids, and a solid front threshold.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The front parent specifies all wall heights, void extents, and threshold datum; no extra facade opening was needed.
 */
export const buildFront = (): IHousePart[] => {
  const mainTop = mFront(FRONT) - ROOF_THICKNESS;
  const rightTop = rFront(FRONT) - ROOF_THICKNESS;
  const peak = gable(GABLE.center) - ROOF_THICKNESS;
  const main = wallPanel({
    axis: "x",
    across: [INNER, FRONT],
    outline: [
      { u: MAIN.outer.x[0], y: B },
      { u: MAIN.outer.x[1], y: B },
      { u: MAIN.outer.x[1], y: rightTop },
      { u: SPLIT_X, y: rightTop },
      { u: SPLIT_X, y: mainTop },
      { u: GABLE.b, y: mainTop },
      { u: GABLE.center, y: peak },
      { u: GABLE.a, y: mainTop },
    ],
    holes: [
      { id: "living-front-window", from: -5.1, to: -2.3, bottom: 0.7, top: 2.3 },
      { id: "bedroom-two-front-window", from: -4.8, to: -2.7, bottom: 3.91, top: 5.31 },
      { id: "stair-front-window", from: -1.62, to: -0.84, bottom: 4.11, top: 5.21 },
      { id: "bedroom-three-front-window", from: 2.65, to: 4.75, bottom: 3.91, top: 5.31 },
      FRONT_DOOR,
    ],
  });
  const garageTop = gFront(GARAGE.outer.z[1]) - ROOF_THICKNESS;
  const garage = wallPanel({
    axis: "x",
    across: [-0.55, GARAGE.outer.z[1]],
    outline: [
      { u: GARAGE.inner.x[0], y: B },
      { u: GARAGE.outer.x[1], y: B },
      { u: GARAGE.outer.x[1], y: garageTop },
      { u: GARAGE.inner.x[0], y: garageTop },
    ],
    holes: [GARAGE_FRONT_DOOR],
  });
  // Over the gable ends the valley Z = -(9/8)·min(X - a, b - X) crosses the wall
  // thickness: between it and the inner face the main front roof is the higher
  // surface, so its underside, not the gable's, closes the wall there
  // (roof-wall-head-junctions). Each end gets one wedge from the gable underside
  // up to the main front underside; the wedge vanishes along the valley.
  const slope = (gable(GABLE.center) - gable(GABLE.a)) / (GABLE.center - GABLE.a);
  const reach = (mFront(INNER) - gable(GABLE.a)) / slope;
  const valleyHead = (id: string, plan: { x: number; z: number }[]): IHousePart =>
    part(id, OWNER, "wall", PALETTE.siding, slopedSlab({ plan, top: (_x, z) => mFront(z) - ROOF_THICKNESS, floor: (x) => gable(x) - ROOF_THICKNESS }));
  return [
    part("front-main-wall", OWNER, "wall", PALETTE.siding, main),
    valleyHead("front-gable-left-valley-head", [{ x: GABLE.a, z: FRONT }, { x: GABLE.a, z: INNER }, { x: GABLE.a + reach, z: INNER }]),
    valleyHead("front-gable-right-valley-head", [{ x: GABLE.b, z: FRONT }, { x: GABLE.b - reach, z: INNER }, { x: GABLE.b, z: INNER }]),
    wallHead({ id: "front-main-wall-head", owner: OWNER, x: [GABLE.b, SPLIT_X], z: [INNER, FRONT], roof: mFront, outerZ: FRONT }),
    wallHead({ id: "front-right-wall-head", owner: OWNER, x: [SPLIT_X, MAIN.outer.x[1]], z: [INNER, FRONT], roof: rFront, outerZ: FRONT }),
    part(
      "front-door-threshold",
      OWNER,
      "floor",
      PALETTE.structure,
      block([FRONT_DOOR.from, STOREYS.groundFloor - GROUND_LAYERS.finish, INNER], [FRONT_DOOR.to, STOREYS.groundFloor + 0.02, FRONT]),
    ),
    part("front-garage-wall", OWNER, "wall", PALETTE.siding, garage),
    wallHead({ id: "front-garage-wall-head", owner: OWNER, x: [GARAGE.inner.x[0], GARAGE.outer.x[1]], z: [-0.55, GARAGE.outer.z[1]], roof: gFront, outerZ: GARAGE.outer.z[1] }),
  ];
};
