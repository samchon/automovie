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
import { MAIN } from "./building";
import { type IHousePart, bar, block, part, slab, straightWall } from "./solids";
import { CEILING_FINISH, GROUND_LAYERS, INTERSTOREY_FLOOR_FINISH, STOREYS } from "./storeys";

const OWNER = "stair.ts";
/** The finished L void and its back guard band are the stair owner's shared plan. */
/**
 * @evidence spaces/02-stair.md#stair-floor-opening This polygon is the one finished opening received by the floor and ceiling owners.
 * @evidence spaces/02-stair.md The stair owns the L opening used by its structural consumers.
 * @evidence principles/core/source-units.md#source-scope-preservation The stair retains the opening while adjacent rooms receive its edges.
 * @evidence principles/core/source-units.md#source-substantive-completion Named corners and an ordered outline allow consumers to derive their cuts and checks.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The L outline is specified by the stair design.
 */
export const STAIR_OPENING = {
  west: -1.8,
  turnX: -0.65,
  east: 1.87,
  back: -4.56,
  turnZ: -3.41,
  front: -0.25,
  get guardBack() { return this.back - MAIN.partition; },
  get outline() { return [
    { x: this.west, z: this.back }, { x: this.east, z: this.back },
    { x: this.east, z: this.turnZ }, { x: this.turnX, z: this.turnZ },
    { x: this.turnX, z: this.front }, { x: this.west, z: this.front },
  ]; },
} as const;
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
/**
 * @evidence spaces/02-stair.md This builder owns the one L-shaped two-flight stair, its closed boundaries, opening edge finish, and guards.
 * @evidence spaces/02-stair.md#stair-reservation Seven lower and nine upper treads derive from 18 risers and reach the 1.36 m landing and 3.06 m upper floor.
 * @evidence spaces/02-stair.md#stair-connector-handoff The returned flight/landing parts provide the route's one physical stair rather than a second shortcut.
 * @evidence spaces/02-stair.md#stair-floor-opening Five narrow edge solids close the receded interstorey notch, while the front opening remains clear.
 * @evidence spaces/02-stair.md#stair-clearance Sloped handrails and the upper fall-edge rail stay in their 0.075 m side reservations.
 * @evidence spaces/02-stair.md#stair-boundary-heights Lower open guards, upper closed walls, closet opening, and 1.05 m hall guard are distinct height cases.
 * @evidence principles/core/source-units.md#source-scope-preservation The stair owns flights, guards, and its edge finish, leaving the hollow coat storage interior and room floors to entry/upper-hall.
 * @evidence principles/core/source-units.md#source-substantive-completion Deterministic tread loops, walls, posts, rails, edge strips, and hall ceiling produce actual named solids.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The stair parent fixes flight counts, landing, closet passage, opening, and guards; no new connection or rise was chosen.
 */
export const buildStair = (): IHousePart[] => {
  const parts: IHousePart[] = [];
  // Lower flight: tread i (1..7) sits at i risers, stepping -Z from Z = -1.45.
  for (let i = 1; i <= 7; ++i) {
    const front = -1.45 - RUN * (i - 1);
    parts.push(part(`stair-lower-tread-${i}`, OWNER, "stair", PALETTE.stairWood, block([STAIR_OPENING.west, BASE, front - RUN], [STAIR_OPENING.turnX, RISE * i, front])));
  }
  // The eighth riser reaches the landing at 8 risers = 1.36 m.
  parts.push(part("stair-landing", OWNER, "stair", PALETTE.stairWood, block([STAIR_OPENING.west, BASE, STAIR_OPENING.back], [STAIR_OPENING.turnX, RISE * 8, STAIR_OPENING.turnZ])));
  // Upper flight: tread j (1..9) sits at 8 + j risers, stepping +X from X = -0.65.
  // A tread over the coat closet body keeps its underside at the closet top.
  for (let j = 1; j <= 9; ++j) {
    const start = STAIR_OPENING.turnX + RUN * (j - 1);
    const overCloset = start + RUN > COAT.x[0] && start < COAT.x[1];
    const underside = overCloset ? COAT.top : BASE;
    parts.push(part(`stair-upper-tread-${j}`, OWNER, "stair", PALETTE.stairWood, block([start, underside, STAIR_OPENING.back], [start + RUN, RISE * (8 + j), STAIR_OPENING.turnZ])));
  }
  const wall = (id: string, axis: "x" | "z", across: readonly [number, number], along: readonly [number, number], bottom: number, top: number): IHousePart =>
    part(id, OWNER, "partition", PALETTE.interiorWall, straightWall({ axis, across, along, bottom, top }));
  parts.push(
    wall("stair-left-ground", "z", [STAIR_OPENING.west - MAIN.partition, STAIR_OPENING.west], [STAIR_OPENING.back, -1.45], BASE, STOREYS.groundCeiling),
    wall("stair-left-upper", "z", [STAIR_OPENING.west - MAIN.partition, STAIR_OPENING.west], [STAIR_OPENING.back, STAIR_OPENING.front], UPPER_BASE, STOREYS.upperCeiling),
    wall("stair-back-ground", "x", [STAIR_OPENING.guardBack, STAIR_OPENING.back], [STAIR_OPENING.west - MAIN.partition, STAIR_OPENING.east], BASE, STOREYS.groundCeiling),
    part(
      "stair-arrival-closure",
      OWNER,
      "partition",
      PALETTE.interiorWall,
      straightWall({
        axis: "z",
        across: [STAIR_OPENING.east, STAIR_OPENING.east + MAIN.partition],
        along: [STAIR_OPENING.guardBack, STAIR_OPENING.turnZ],
        bottom: BASE,
        top: STOREYS.groundCeiling,
        holes: [{ id: "entry-coat-opening", from: -4.51, to: -3.56, bottom: STOREYS.groundFloor, top: COAT.top }],
      }),
    ),
    wall("stair-bedroom-side-upper", "z", [STAIR_OPENING.turnX, STAIR_OPENING.turnX + MAIN.partition], [STAIR_OPENING.turnZ, STAIR_OPENING.front], UPPER_BASE, STOREYS.upperCeiling),
    wall("stair-bedroom-front-upper", "x", [STAIR_OPENING.turnZ, STAIR_OPENING.turnZ + MAIN.partition], [STAIR_OPENING.turnX + MAIN.partition, STAIR_OPENING.east - MAIN.partition], UPPER_BASE, STOREYS.upperCeiling),
  );
  // Upper-hall fall edge over the back band Z = [-4.71, -4.56]: two end posts and the top rail.
  const guardTop = STOREYS.upperFloor + HALL_GUARD;
  const z = (STAIR_OPENING.guardBack + STAIR_OPENING.back) / 2;
  parts.push(
    part("stair-guard-band-floor", OWNER, "floor", PALETTE.woodFloor, block([STAIR_OPENING.west, STOREYS.upperFloor - INTERSTOREY_FLOOR_FINISH, STAIR_OPENING.guardBack], [STAIR_OPENING.east, STOREYS.upperFloor, STAIR_OPENING.back - CEILING_FINISH])),
    part("stair-guard-post-west", OWNER, "guard", PALETTE.railing, block([STAIR_OPENING.west, STOREYS.upperFloor, z - RESERVE / 2], [STAIR_OPENING.west + RESERVE, guardTop, z + RESERVE / 2])),
    part("stair-guard-post-east", OWNER, "guard", PALETTE.railing, block([STAIR_OPENING.east - RESERVE, STOREYS.upperFloor, z - RESERVE / 2], [STAIR_OPENING.east, guardTop, z + RESERVE / 2])),
    part("stair-guard-top-rail", OWNER, "guard", PALETTE.stairWood, bar({ x: STAIR_OPENING.west, y: guardTop - RESERVE / 2, z }, { x: STAIR_OPENING.east, y: guardTop - RESERVE / 2, z }, RESERVE)),
    wall("stair-west-back-corner", "z", [STAIR_OPENING.west - MAIN.partition, STAIR_OPENING.west], [STAIR_OPENING.guardBack, STAIR_OPENING.back], UPPER_BASE, STOREYS.upperCeiling),
  );
  // Sloped handrails inside the 0.075 m reservation: the lower flight's open
  // side X = [-0.725, -0.65] and the upper flight's front side Z = [-3.485, -3.41].
  // Both reach 0.90 m above the landing at the corner (-0.65, -3.41).
  const x = STAIR_OPENING.turnX - RESERVE / 2;
  const zFront = STAIR_OPENING.turnZ - RESERVE / 2;
  const railTop = (nosing: number): number => nosing + HANDRAIL - RESERVE / 2;
  const landingTop = RISE * 8;
  parts.push(
    part("stair-handrail-lower", OWNER, "guard", PALETTE.stairWood, bar({ x, y: railTop(RISE), z: -1.45 }, { x, y: railTop(landingTop), z: STAIR_OPENING.turnZ }, RESERVE)),
    part("stair-handrail-upper", OWNER, "guard", PALETTE.stairWood, bar({ x: STAIR_OPENING.turnX, y: railTop(landingTop), z: zFront }, { x: STAIR_OPENING.east, y: railTop(STOREYS.upperFloor), z: zFront }, RESERVE)),
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
    edge("stair-opening-edge-east", [STAIR_OPENING.turnX, STAIR_OPENING.turnX + e], [STAIR_OPENING.turnZ + e, STAIR_OPENING.front]),
    edge("stair-opening-edge-front", [STAIR_OPENING.turnX, STAIR_OPENING.east + e], [STAIR_OPENING.turnZ, STAIR_OPENING.turnZ + e]),
    edge("stair-opening-edge-arrival", [STAIR_OPENING.east, STAIR_OPENING.east + e], [STAIR_OPENING.back - e, STAIR_OPENING.turnZ]),
    edge("stair-opening-edge-back", [STAIR_OPENING.west - e, STAIR_OPENING.east], [STAIR_OPENING.back - e, STAIR_OPENING.back]),
    edge("stair-opening-edge-west", [STAIR_OPENING.west - e, STAIR_OPENING.west], [STAIR_OPENING.back, STAIR_OPENING.front]),
    part(
      "stair-hall-ceiling",
      OWNER,
      "ceiling",
      PALETTE.ceiling,
      slab({
        outline: STAIR_OPENING.outline.map((p) => ({ x: p.x, z: p.z === STAIR_OPENING.back ? STAIR_OPENING.guardBack : p.z })),
        bottom: STOREYS.upperCeiling,
        top: STOREYS.upperCeiling + CEILING_FINISH,
      }),
    ),
  );
  return parts;
};
