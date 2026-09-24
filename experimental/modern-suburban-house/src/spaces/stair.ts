/**
 * `main-stair`: the single L-shaped stair, its closed sides and its guards.
 *
 * Design owner: `docs/spaces/02-stair.md`. 3.06 m is split into 18 risers of
 * 0.17 m. The lower flight (8 risers, 7 treads of 0.28 m) climbs -Z over
 * X = [-1.80, -0.65] from Z = -1.45 to the landing X = [-1.80, -0.65],
 * Z = [-4.56, -3.41] at Y = 1.36; the upper flight (10 risers, 9 treads) climbs
 * +X over Z = [-4.56, -3.41] from X = -0.65 and arrives at X = 1.87 on the upper
 * floor. Tread positions are derived from count, direction and start, never
 * copied by hand. The non-walkable space under the flights is closed inside the
 * stair plan, so each tread is a solid block from the floor base, except where
 * the upper flight passes over the entry coat closet body X = [1.10, 1.75]
 * (`docs/spaces/rooms/entry.md#entry-coat-storage`): there the treads keep
 * their structural underside at the closet top Y = 2.15 and leave the closet
 * volume hollow. The closet's own walls belong to `rooms/entry.ts`.
 *
 * Boundaries owned here (stair-floor-opening, stair-boundary-heights):
 * - the left partition X = [-1.95, -1.80] beside the flights on the ground
 *   storey and beside the opening on the upper storey;
 * - the back partition Z = [-4.71, -4.56] from the ground floor up to the
 *   interstorey structure, which closes it on to the upper floor;
 * - the under-stair closure X = [1.87, 2.02] at the arrival end, below the
 *   interstorey structure, cut only by `entry-coat-opening`
 *   Z = [-4.51, -3.56], Y = [0, 2.15];
 * - the upper bedroom-side partitions X = [-0.65, -0.50] and Z = [-3.41, -3.26].
 *
 * Guards (stair-clearance, stair-boundary-heights): every post and handrail
 * sits inside the 0.075 m occupancy reservation on its side of the 1.15 m path
 * and uses that width as its section. The lower flight's open side toward the
 * entry and the upper flight's front side carry a handrail whose top is 0.90 m
 * above the nosing line, meeting at 0.90 m above the landing at their corner
 * post; the upper-hall edge guard over the back band has its top 1.05 m above
 * the upper floor. The +X arrival stays open. Balusters, their count and the
 * bottom member are later model work and are not emitted.
 */
import { PALETTE } from "./palette";
import { type IHousePart, bar, block, part, slab, straightWall } from "./solids";
import { CEILING_FINISH, GROUND_LAYERS, INTERSTOREY_FLOOR_FINISH, STOREYS } from "./storeys";

const OWNER = "stair.ts";
const RISE = STOREYS.upperFloor / 18;
const RUN = 0.28;
const BASE = STOREYS.groundFloor - GROUND_LAYERS.finish;
const UPPER_BASE = STOREYS.upperFloor - INTERSTOREY_FLOOR_FINISH;
/** Handrail/guard occupancy reservation on each side of the path (stair-clearance). */
const RESERVE = 0.075;
/** Sloped handrail top above the nosing line and above the landing. */
const HANDRAIL = 0.9;
/** Upper-hall fall-edge guard top above the upper floor. */
const HALL_GUARD = 1.05;
/** Coat closet body plan and top (entry-coat-storage). */
const COAT = { x: [1.1, 1.75], top: 2.15 } as const;

/** Emit the stair treads, landing, closed sides and guards. */
export const buildStair = (): IHousePart[] => {
  const parts: IHousePart[] = [];
  // Lower flight: tread i (1..7) sits at i risers, stepping -Z from Z = -1.45.
  for (let i = 1; i <= 7; ++i) {
    const front = -1.45 - RUN * (i - 1);
    parts.push(part(`stair-lower-tread-${i}`, OWNER, "stair", PALETTE.stairWood, block([-1.8, BASE, front - RUN], [-0.65, RISE * i, front])));
  }
  // The eighth riser reaches the landing at 8 risers = 1.36 m.
  parts.push(part("stair-landing", OWNER, "stair", PALETTE.stairWood, block([-1.8, BASE, -4.56], [-0.65, RISE * 8, -3.41])));
  // Upper flight: tread j (1..9) sits at 8 + j risers, stepping +X from X = -0.65.
  // A tread over the coat closet body keeps its underside at the closet top.
  for (let j = 1; j <= 9; ++j) {
    const start = -0.65 + RUN * (j - 1);
    const overCloset = start + RUN > COAT.x[0] && start < COAT.x[1];
    const underside = overCloset ? COAT.top : BASE;
    parts.push(part(`stair-upper-tread-${j}`, OWNER, "stair", PALETTE.stairWood, block([start, underside, -4.56], [start + RUN, RISE * (8 + j), -3.41])));
  }
  const wall = (id: string, axis: "x" | "z", across: readonly [number, number], along: readonly [number, number], bottom: number, top: number): IHousePart =>
    part(id, OWNER, "partition", PALETTE.interiorWall, straightWall({ axis, across, along, bottom, top }));
  parts.push(
    wall("stair-left-ground", "z", [-1.95, -1.8], [-4.56, -1.45], BASE, STOREYS.groundCeiling),
    wall("stair-left-upper", "z", [-1.95, -1.8], [-4.56, -0.25], UPPER_BASE, STOREYS.upperCeiling),
    wall("stair-back-ground", "x", [-4.71, -4.56], [-1.95, 1.87], BASE, STOREYS.groundCeiling),
    part(
      "stair-arrival-closure",
      OWNER,
      "partition",
      PALETTE.interiorWall,
      straightWall({
        axis: "z",
        across: [1.87, 2.02],
        along: [-4.71, -3.41],
        bottom: BASE,
        top: STOREYS.groundCeiling,
        holes: [{ id: "entry-coat-opening", from: -4.51, to: -3.56, bottom: STOREYS.groundFloor, top: COAT.top }],
      }),
    ),
    wall("stair-bedroom-side-upper", "z", [-0.65, -0.5], [-3.41, -0.25], UPPER_BASE, STOREYS.upperCeiling),
    wall("stair-bedroom-front-upper", "x", [-3.41, -3.26], [-0.5, 1.72], UPPER_BASE, STOREYS.upperCeiling),
  );
  // Upper-hall fall edge over the back band Z = [-4.71, -4.56]: two end posts and the top rail.
  const guardTop = STOREYS.upperFloor + HALL_GUARD;
  const z = -4.635;
  parts.push(
    part("stair-guard-post-west", OWNER, "guard", PALETTE.railing, block([-1.8, STOREYS.upperFloor, z - RESERVE / 2], [-1.8 + RESERVE, guardTop, z + RESERVE / 2])),
    part("stair-guard-post-east", OWNER, "guard", PALETTE.railing, block([1.87 - RESERVE, STOREYS.upperFloor, z - RESERVE / 2], [1.87, guardTop, z + RESERVE / 2])),
    part("stair-guard-top-rail", OWNER, "guard", PALETTE.stairWood, bar({ x: -1.8, y: guardTop - RESERVE / 2, z }, { x: 1.87, y: guardTop - RESERVE / 2, z }, RESERVE)),
  );
  // Sloped handrails inside the 0.075 m reservation: the lower flight's open
  // side X = [-0.725, -0.65] and the upper flight's front side Z = [-3.485, -3.41].
  // Both reach 0.90 m above the landing at the corner (-0.65, -3.41).
  const x = -0.65 - RESERVE / 2;
  const zFront = -3.41 - RESERVE / 2;
  const railTop = (nosing: number): number => nosing + HANDRAIL - RESERVE / 2;
  const landingTop = RISE * 8;
  parts.push(
    part("stair-handrail-lower", OWNER, "guard", PALETTE.stairWood, bar({ x, y: railTop(RISE), z: -1.45 }, { x, y: railTop(landingTop), z: -3.41 }, RESERVE)),
    part("stair-handrail-upper", OWNER, "guard", PALETTE.stairWood, bar({ x: -0.65, y: railTop(landingTop), z: zFront }, { x: 1.87, y: railTop(STOREYS.upperFloor), z: zFront }, RESERVE)),
    part("stair-post-lower-start", OWNER, "guard", PALETTE.railing, block([-0.65 - RESERVE, RISE, -1.45 - RESERVE], [-0.65, RISE + HANDRAIL, -1.45])),
    part("stair-post-landing-corner", OWNER, "guard", PALETTE.railing, block([-0.65 - RESERVE, landingTop, -3.41 - RESERVE], [-0.65, landingTop + HANDRAIL, -3.41])),
  );
  // stair-floor-opening, 08 interstorey-edge-junctions: the interstorey structure stops
  // 0.015 m short of the finished opening; this owner closes that band with the
  // opening's vertical finish from the ground ceiling up to the upper floor, and
  // closes the stair hall top, the open guard band Z = [-4.71, -4.56] included, with
  // its own ceiling finish (09 upper-ceiling-closure).
  const edgeBottom = STOREYS.groundCeiling;
  const edgeTop = STOREYS.upperFloor;
  const e = CEILING_FINISH;
  const edge = (id: string, x: readonly [number, number], z: readonly [number, number]): IHousePart =>
    part(id, OWNER, "floor", PALETTE.interiorWall, block([x[0], edgeBottom, z[0]], [x[1], edgeTop, z[1]]));
  parts.push(
    edge("stair-opening-edge-east", [-0.65, -0.65 + e], [-3.41 + e, -0.25]),
    edge("stair-opening-edge-front", [-0.65, 1.87 + e], [-3.41, -3.41 + e]),
    edge("stair-opening-edge-arrival", [1.87, 1.87 + e], [-4.56 - e, -3.41]),
    edge("stair-opening-edge-back", [-1.8 - e, 1.87], [-4.56 - e, -4.56]),
    edge("stair-opening-edge-west", [-1.8 - e, -1.8], [-4.56, -0.25]),
    part(
      "stair-hall-ceiling",
      OWNER,
      "ceiling",
      PALETTE.ceiling,
      slab({
        outline: [
          { x: -1.8, z: -4.71 },
          { x: 1.87, z: -4.71 },
          { x: 1.87, z: -3.41 },
          { x: -0.65, z: -3.41 },
          { x: -0.65, z: -0.25 },
          { x: -1.8, z: -0.25 },
        ],
        bottom: STOREYS.upperCeiling,
        top: STOREYS.upperCeiling + CEILING_FINISH,
      }),
    ),
  );
  return parts;
};
