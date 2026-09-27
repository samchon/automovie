/**
 * Builds the stair-owned guard bands, handrails, posts, opening edge finish,
 * and high stair-hall ceiling after the flights and enclosing partitions.
 *
 * `buildStair` in `stair.ts` is the only caller and remains the production owner.
 * It passes its opening, tread datums, upper base, owner id, and wall builder;
 * this helper adds no independent plan dimensions or owner label. Its returned
 * parts are appended after the stair walls so ids and element order remain
 * stable. The section check rejects a post or rail that escapes the stair's
 * 0.075 m side reservation. Changing the opening or finish thickness requires
 * rebuilding both these parts and the floor/room/environment consumers.
 */
import { MAIN } from "./building";
import { PALETTE } from "./palette";
import { bar, block, slab } from "./solids";
import { part, type IHousePart } from "./solid-records";
import { CEILING_FINISH, INTERSTOREY_FLOOR_FINISH, STOREYS } from "./storeys";
import type { STAIR_OPENING, STAIR_STEPS } from "./stair";

type StairWall = (
  id: string,
  axis: "x" | "z",
  across: readonly [number, number],
  along: readonly [number, number],
  bottom: number,
  top: number,
) => IHousePart;

/**
 * @evidence spaces/02-stair.md This called helper fills the stair's open guard edges, floor notch finish and high ceiling under the same stair owner.
 * @evidenceReview spaces/02-stair.md #d17bdfd The complete stair design assigns guards, the L opening edge, and the high ceiling to stair.ts; buildStair calls this helper with its owner id and datums after constructing the enclosing walls.
 * @evidence spaces/02-stair.md#stair-floor-opening Five edge strips finish the interstorey recession; the same outline closes the stair hall ceiling above the guard band.
 * @evidenceReview spaces/02-stair.md#stair-floor-opening #c2b6e36 The five edge solids follow the finished L outline at the CEILING_FINISH recession, and stair-hall-ceiling closes over the back guard band at upperCeiling without blocking the front window side.
 * @evidence spaces/02-stair.md#stair-clearance Posts and rails derive their section from the opening's guardReserve and are checked against it.
 * @evidenceReview spaces/02-stair.md#stair-clearance #8753e6a RESERVE reads opening.guardReserve = 0.075; guard post and rail sections use it, and the final section loop rejects a narrow section that differs from that reservation.
 * @evidence spaces/02-stair.md#stair-boundary-heights Sloped handrails rise 0.90 m over the nosing, while the upper hall fall-edge rail rises 1.05 m over its floor.
 * @evidenceReview spaces/02-stair.md#stair-boundary-heights #3da4d8f The lower and upper bars use railTop(nosing) from HANDRAIL = 0.9, while guardTop adds HALL_GUARD = 1.05 to upperFloor; baluster infill remains outside this helper.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper receives the stair owner and datums rather than declaring another stair or taking the entry-owned closet interior.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The only call is inside buildStair, which supplies owner, opening, steps, upper base and wall; the helper emits no closet body or room floor and names no second stair.
 * @evidence principles/core/source-units.md#source-substantive-completion The returned ordered solids close the floor edge and ceiling while constructing and checking actual guard sections.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Ordered part calls emit the guard band, posts, rails, corner closure, five floor edges and hall ceiling, then inspect every guard mesh section before returning them to buildStair.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The reviewed floor-opening and boundary-height units already fix these guard and finish roles; extraction adds no new spatial decision.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 I compared the stair-floor-opening and stair-boundary-heights units with the moved part calls: they retain the same opening, 0.075 and 0.90/1.05 m reservations and owner, so the helper exposes no missing parent decision.
 */
export const buildStairGuards = (props: {
  owner: string;
  opening: typeof STAIR_OPENING;
  steps: typeof STAIR_STEPS;
  upperBase: number;
  wall: StairWall;
}): IHousePart[] => {
  const {
    owner: OWNER,
    opening: STAIR_OPENING,
    steps: STAIR_STEPS,
    upperBase: UPPER_BASE,
    wall,
  } = props;
  const RESERVE = STAIR_OPENING.guardReserve;
  const HANDRAIL = 0.9;
  const HALL_GUARD = 1.05;
  const parts: IHousePart[] = [];
  // Upper-hall fall edge over the back band Z = [-4.71, -4.56]: two end posts and the top rail.
  const guardTop = STOREYS.upperFloor + HALL_GUARD;
  const z = (STAIR_OPENING.guardBack + STAIR_OPENING.back) / 2;
  parts.push(
    part(
      "stair-guard-band-floor",
      OWNER,
      "floor",
      PALETTE.woodFloor,
      block(
        [
          STAIR_OPENING.west,
          STOREYS.upperFloor - INTERSTOREY_FLOOR_FINISH,
          STAIR_OPENING.guardBack,
        ],
        [
          STAIR_OPENING.east,
          STOREYS.upperFloor,
          STAIR_OPENING.back - CEILING_FINISH,
        ],
      ),
    ),
    part(
      "stair-guard-post-west",
      OWNER,
      "guard",
      PALETTE.railing,
      block(
        [STAIR_OPENING.west, STOREYS.upperFloor, z - RESERVE / 2],
        [STAIR_OPENING.west + RESERVE, guardTop, z + RESERVE / 2],
      ),
    ),
    part(
      "stair-guard-post-east",
      OWNER,
      "guard",
      PALETTE.railing,
      block(
        [STAIR_OPENING.east - RESERVE, STOREYS.upperFloor, z - RESERVE / 2],
        [STAIR_OPENING.east, guardTop, z + RESERVE / 2],
      ),
    ),
    part(
      "stair-guard-top-rail",
      OWNER,
      "guard",
      PALETTE.stairWood,
      bar(
        { x: STAIR_OPENING.west, y: guardTop - RESERVE / 2, z },
        { x: STAIR_OPENING.east, y: guardTop - RESERVE / 2, z },
        RESERVE,
      ),
    ),
    wall(
      "stair-west-back-corner",
      "z",
      [STAIR_OPENING.west - MAIN.partition, STAIR_OPENING.west],
      [STAIR_OPENING.guardBack, STAIR_OPENING.back],
      UPPER_BASE,
      STOREYS.upperCeiling,
    ),
    part(
      "stair-west-back-corner-ceiling",
      OWNER,
      "ceiling",
      PALETTE.ceiling,
      block(
        [
          STAIR_OPENING.west - MAIN.partition,
          STOREYS.upperCeiling,
          STAIR_OPENING.guardBack,
        ],
        [
          STAIR_OPENING.west,
          STOREYS.upperCeiling + CEILING_FINISH,
          STAIR_OPENING.back,
        ],
      ),
    ),
  );
  // Sloped handrails inside the 0.075 m reservation: the lower flight's open
  // side X = [-0.725, -0.65] and the upper flight's front side Z = [-3.485, -3.41].
  // Both reach 0.90 m above the landing at the corner (-0.65, -3.41).
  const x = STAIR_OPENING.turnX - RESERVE / 2;
  const zFront = STAIR_OPENING.turnZ - RESERVE / 2;
  const railTop = (nosing: number): number => nosing + HANDRAIL - RESERVE / 2;
  parts.push(
    part(
      "stair-handrail-lower",
      OWNER,
      "guard",
      PALETTE.stairWood,
      bar(
        { x, y: railTop(STAIR_STEPS.rise), z: STAIR_STEPS.lowerStartZ },
        { x, y: railTop(STAIR_STEPS.landingTop), z: STAIR_OPENING.turnZ },
        RESERVE,
      ),
    ),
    part(
      "stair-handrail-upper",
      OWNER,
      "guard",
      PALETTE.stairWood,
      bar(
        { x: STAIR_OPENING.turnX, y: railTop(STAIR_STEPS.landingTop), z: zFront },
        { x: STAIR_OPENING.east, y: railTop(STOREYS.upperFloor), z: zFront },
        RESERVE,
      ),
    ),
    part(
      "stair-post-lower-start",
      OWNER,
      "guard",
      PALETTE.railing,
      block(
        [STAIR_OPENING.turnX - RESERVE, STAIR_STEPS.rise, STAIR_STEPS.lowerStartZ - RESERVE],
        [STAIR_OPENING.turnX, STAIR_STEPS.rise + HANDRAIL, STAIR_STEPS.lowerStartZ],
      ),
    ),
    part(
      "stair-post-landing-corner",
      OWNER,
      "guard",
      PALETTE.railing,
      block(
        [
          STAIR_OPENING.turnX - RESERVE,
          STAIR_STEPS.landingTop,
          STAIR_OPENING.turnZ - RESERVE,
        ],
        [STAIR_OPENING.turnX, STAIR_STEPS.landingTop + HANDRAIL, STAIR_OPENING.turnZ],
      ),
    ),
  );
  // stair-floor-opening, 08 interstorey-edge-junctions: the interstorey structure stops
  // 0.015 m short of the finished opening; this owner closes that band with the
  // opening's vertical finish from the ground ceiling up to the upper floor, and
  // closes the stair hall top, the open guard band Z = [-4.71, -4.56] included, with
  // its own ceiling finish (09 upper-ceiling-closure).
  const edge = (id: string, x: readonly [number, number], z: readonly [number, number]): IHousePart =>
    part(
      id,
      OWNER,
      "floor",
      PALETTE.interiorWall,
      block([x[0], STOREYS.groundCeiling, z[0]], [x[1], STOREYS.upperFloor, z[1]]),
    );
  parts.push(
    edge(
      "stair-opening-edge-east",
      [STAIR_OPENING.turnX, STAIR_OPENING.turnX + CEILING_FINISH],
      [STAIR_OPENING.turnZ + CEILING_FINISH, STAIR_OPENING.front],
    ),
    edge(
      "stair-opening-edge-front",
      [STAIR_OPENING.turnX, STAIR_OPENING.east + CEILING_FINISH],
      [STAIR_OPENING.turnZ, STAIR_OPENING.turnZ + CEILING_FINISH],
    ),
    edge(
      "stair-opening-edge-arrival",
      [STAIR_OPENING.east, STAIR_OPENING.east + CEILING_FINISH],
      [STAIR_OPENING.back - CEILING_FINISH, STAIR_OPENING.turnZ],
    ),
    edge(
      "stair-opening-edge-back",
      [STAIR_OPENING.west - CEILING_FINISH, STAIR_OPENING.east],
      [STAIR_OPENING.back - CEILING_FINISH, STAIR_OPENING.back],
    ),
    edge(
      "stair-opening-edge-west",
      [STAIR_OPENING.west - CEILING_FINISH, STAIR_OPENING.west],
      [STAIR_OPENING.back, STAIR_OPENING.front],
    ),
    part(
      "stair-hall-ceiling",
      OWNER,
      "ceiling",
      PALETTE.ceiling,
      slab({
        outline: STAIR_OPENING.outline.map((p) => ({
          x: p.x,
          z: p.z === STAIR_OPENING.back ? STAIR_OPENING.guardBack : p.z,
        })),
        bottom: STOREYS.upperCeiling,
        top: STOREYS.upperCeiling + CEILING_FINISH,
      }),
    ),
  );
  for (const guard of parts.filter((p) => p.role === "guard")) {
    for (const axis of [0, 2]) {
      const values = guard.mesh.positions.filter((_, i) => i % 3 === axis);
      const width = Math.max(...values) - Math.min(...values);
      if (width < 0.2 && Math.abs(width - RESERVE) > 1e-6)
        throw new Error(
          `${guard.id}: guard section ${width.toFixed(4)} differs from the stair clearance reservation ${RESERVE.toFixed(4)}`,
        );
    }
  }
  return parts;
};
