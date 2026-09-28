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
 * @evidenceReview spaces/02-stair.md #3de739d `buildStair` calls this helper after its flights and walls, supplying the stair owner and opening; the returned parts fill the guard, opening-edge, and high-ceiling roles assigned to that stair.
 * @evidence spaces/02-stair.md#stair-floor-opening The five opening sides receive stair-owned edge finish; the front side splits where its upper neighbour changes, and the same outline closes the stair hall ceiling above the guard band.
 * @evidenceReview spaces/02-stair.md#stair-floor-opening #c78d9a6 Six `edge` parts finish the five sides of the recessed L opening, with the front split at the linen partition; `stair-hall-ceiling` uses the same opening outline with its back replaced by `guardBack` above the guard band.
 * @evidence spaces/02-stair.md#stair-clearance Posts and rails derive their section from the opening's guardReserve and are checked against it.
 * @evidenceReview spaces/02-stair.md#stair-clearance #8753e6a `RESERVE` comes from `opening.guardReserve`; both posts and bars use that width, and the final guard-section loop rejects any narrow X or Z span that differs from it.
 * @evidence spaces/02-stair.md#stair-boundary-heights Each sloped rail follows its flight's tread noses 0.90 m above them; the corner post receives their distinct landing and first upper-nose heights, and the hall rail rises 1.05 m over its floor.
 * @evidenceReview spaces/02-stair.md#stair-boundary-heights #3d9bed1 The lower `railTop` endpoints follow the first lower nose and landing; the upper endpoints follow `landingTop + rise` at turnX and upperFloor at east. The corner post reaches the upper start while receiving the lower end below it, and `guardTop` sets the flat hall rail at upperFloor + 1.05 m.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper receives the stair owner and datums rather than declaring another stair or taking the entry-owned closet interior.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `buildStair` supplies owner, opening, steps, upper base, and wall constructor; this helper returns only stair-owned guards, edge finish, and ceiling, leaving the entry closet and room floor to their owners.
 * @evidence principles/core/source-units.md#source-substantive-completion The returned ordered solids close the floor edge and ceiling while constructing and checking actual guard sections.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The ordered result includes band, posts, rails, rear corner closure, six opening edge pieces across five sides, and ceiling; before return it checks the narrow horizontal section of every returned guard mesh.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work Emission first exposed shared ceiling and floor finish volumes at the opening edge, then exposed lower gaps at its west and back sides and an upper gap at the linen corner. The revisions to 02-stair.md#stair-boundary-heights, 08-floor-assembly.md#interstorey-edge-junctions and 03-surface-owners.md#interior-surface-handoff assign each edge interval to its actual neighbour.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The `edge` calls use groundCeiling at west and back where a wall ends, groundCeiling + CEILING_FINISH where a room ceiling reaches the opening, upperFloor at the front linen corner, and upperFloor - INTERSTOREY_FLOOR_FINISH elsewhere; the helper still receives its opening and guard geometry from `buildStair`.
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
          STAIR_OPENING.back,
        ],
      ),
    ),
    part(
      "stair-guard-post-west",
      OWNER,
      "guard",
      PALETTE.trim,
      block(
        [STAIR_OPENING.west, STOREYS.upperFloor, z - RESERVE / 2],
        [STAIR_OPENING.west + RESERVE, guardTop, z + RESERVE / 2],
      ),
    ),
    part(
      "stair-guard-post-east",
      OWNER,
      "guard",
      PALETTE.trim,
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
  // The lower bar reaches landing + 0.90 m at the corner. The upper bar starts
  // one rise higher, over the first upper nose, so the corner post receives both.
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
        { x: STAIR_OPENING.turnX, y: railTop(STAIR_STEPS.landingTop + STAIR_STEPS.rise), z: zFront },
        { x: STAIR_OPENING.east, y: railTop(STOREYS.upperFloor), z: zFront },
        RESERVE,
      ),
    ),
    part(
      "stair-post-lower-start",
      OWNER,
      "guard",
      PALETTE.trim,
      block(
        [STAIR_OPENING.turnX - RESERVE, STAIR_STEPS.rise, STAIR_STEPS.lowerStartZ - RESERVE],
        [STAIR_OPENING.turnX, STAIR_STEPS.rise + HANDRAIL, STAIR_STEPS.lowerStartZ],
      ),
    ),
    part(
      "stair-post-landing-corner",
      OWNER,
      "guard",
      PALETTE.trim,
      block(
        [
          STAIR_OPENING.turnX - RESERVE,
          STAIR_STEPS.landingTop,
          STAIR_OPENING.turnZ - RESERVE,
        ],
        [STAIR_OPENING.turnX, STAIR_STEPS.landingTop + STAIR_STEPS.rise + HANDRAIL, STAIR_OPENING.turnZ],
      ),
    ),
  );
  // stair-floor-opening, 08 interstorey-edge-junctions: the interstorey structure stops
  // 0.015 m short of the finished opening; this owner closes that band with the
  // opening's vertical finish between the actual neighbours at each edge, and
  // closes the stair hall top, the open guard band Z = [-4.71, -4.56] included, with
  // its own ceiling finish (09 upper-ceiling-closure).
  const edge = (id: string, x: readonly [number, number], z: readonly [number, number], bottom: number, top: number): IHousePart =>
    part(
      id,
      OWNER,
      "floor",
      PALETTE.interiorWall,
      block([x[0], bottom, z[0]], [x[1], top, z[1]]),
    );
  parts.push(
    edge(
      "stair-opening-edge-east",
      [STAIR_OPENING.turnX, STAIR_OPENING.turnX + CEILING_FINISH],
      [STAIR_OPENING.turnZ + CEILING_FINISH, STAIR_OPENING.front],
      STOREYS.groundCeiling + CEILING_FINISH,
      STOREYS.upperFloor - INTERSTOREY_FLOOR_FINISH,
    ),
    edge(
      "stair-opening-edge-front",
      [STAIR_OPENING.turnX, 1.72],
      [STAIR_OPENING.turnZ, STAIR_OPENING.turnZ + CEILING_FINISH],
      STOREYS.groundCeiling + CEILING_FINISH,
      STOREYS.upperFloor - INTERSTOREY_FLOOR_FINISH,
    ),
    edge(
      "stair-opening-edge-front-linen",
      [1.72, STAIR_OPENING.east + CEILING_FINISH],
      [STAIR_OPENING.turnZ, STAIR_OPENING.turnZ + CEILING_FINISH],
      STOREYS.groundCeiling + CEILING_FINISH,
      STOREYS.upperFloor,
    ),
    edge(
      "stair-opening-edge-arrival",
      [STAIR_OPENING.east, STAIR_OPENING.east + CEILING_FINISH],
      [STAIR_OPENING.back - CEILING_FINISH, STAIR_OPENING.turnZ],
      STOREYS.groundCeiling + CEILING_FINISH,
      STOREYS.upperFloor - INTERSTOREY_FLOOR_FINISH,
    ),
    edge(
      "stair-opening-edge-back",
      [STAIR_OPENING.west - CEILING_FINISH, STAIR_OPENING.east],
      [STAIR_OPENING.back - CEILING_FINISH, STAIR_OPENING.back],
      STOREYS.groundCeiling,
      STOREYS.upperFloor - INTERSTOREY_FLOOR_FINISH,
    ),
    edge(
      "stair-opening-edge-west",
      [STAIR_OPENING.west - CEILING_FINISH, STAIR_OPENING.west],
      [STAIR_OPENING.back, STAIR_OPENING.front],
      STOREYS.groundCeiling,
      STOREYS.upperFloor - INTERSTOREY_FLOOR_FINISH,
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
