/**
 * Emit the stair's two flights, landing, enclosing walls, edge finishes and
 * guards from the stair layout. All coordinates are world metres in Y-up;
 * the route and opening are shared with floor and environment consumers.
 * The builder returns named parts without changing the stair plan or the
 * entry-owned coat closet under upper treads seven through nine. The 3.06 m
 * rise uses 18 steps, with eight to the landing and ten to the upper floor.
 * Guard sections occupy the shared 0.075 m side reservation. The closure
 * at the upper arrival remains open on +X; room finishes stay with rooms.
 */
import { PALETTE } from "./palette";
import { MAIN } from "./building";
import { bar, block, slab, straightWall } from "./solids";
import { part, type IHousePart } from "./solid-records";
import {
  CEILING_FINISH,
  GROUND_LAYERS,
  INTERSTOREY_FLOOR_FINISH,
  STOREYS,
} from "./storeys";
import { COAT_STORAGE } from "./rooms/entry";
import { STAIR_OPENING, STAIR_STEPS } from "./stair";

const OWNER = "stair.ts";
const RISE = STAIR_STEPS.rise;
const RUN = STAIR_STEPS.run;
const BASE = STOREYS.groundFloor - GROUND_LAYERS.finish;
const UPPER_BASE = STOREYS.upperFloor - INTERSTOREY_FLOOR_FINISH;
/** Handrail/guard occupancy reservation on each side of the path (stair-clearance). */
const RESERVE = STAIR_OPENING.guardReserve;
/** Sloped handrail top above the nosing line and above the landing. */
const HANDRAIL = 0.9;
/** Upper-hall fall-edge guard top above the upper floor. */
const HALL_GUARD = 1.05;

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
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work buildStair's overCloset branch exposed a reversed vertical owner: a15c1dd1 revised rooms/entry.md#entry-coat-storage and 02-stair.md#stair-boundary-heights to make treads 7-9 consume the entry-owned Y=2.15 closet top.
 */
export const buildStair = (): IHousePart[] => {
  const parts: IHousePart[] = [];
  /** Coat closet body plan and top (entry-coat-storage). */
  const COAT = COAT_STORAGE;
  // Lower flight: tread i (1..7) sits at i risers, stepping -Z from Z = -1.45.
  for (let i = 1; i <= 7; ++i) {
    const front = STAIR_STEPS.lowerStartZ - RUN * (i - 1);
    parts.push(
      part(
        `stair-lower-tread-${i}`,
        OWNER,
        "stair",
        PALETTE.stairWood,
        block(
          [STAIR_OPENING.west, BASE, front - RUN],
          [STAIR_OPENING.turnX, RISE * i, front],
        ),
      ),
    );
  }
  // The eighth riser reaches the landing at 8 risers = 1.36 m.
  parts.push(
    part(
      "stair-landing",
      OWNER,
      "stair",
      PALETTE.stairWood,
      block(
        [STAIR_OPENING.west, BASE, STAIR_OPENING.back],
        [STAIR_OPENING.turnX, RISE * 8, STAIR_OPENING.turnZ],
      ),
    ),
  );
  // Upper flight: tread j (1..9) sits at 8 + j risers, stepping +X from X = -0.65.
  // A tread over the coat closet body keeps its underside at the closet top.
  for (let j = 1; j <= 9; ++j) {
    const start = STAIR_STEPS.upperTreadStart(j);
    const overCloset = start + RUN > COAT.x[0] && start < COAT.x[1];
    const underside = overCloset ? COAT.top : BASE;
    parts.push(
      part(
        `stair-upper-tread-${j}`,
        OWNER,
        "stair",
        PALETTE.stairWood,
        block(
          [start, underside, STAIR_OPENING.back],
          [start + RUN, RISE * (8 + j), STAIR_OPENING.turnZ],
        ),
      ),
    );
  }
  const wall = (id: string, axis: "x" | "z", across: readonly [number, number], along: readonly [number, number], bottom: number, top: number): IHousePart =>
    part(
      id,
      OWNER,
      "partition",
      PALETTE.interiorWall,
      straightWall({ axis, across, along, bottom, top }),
    );
  parts.push(
    wall(
      "stair-left-ground",
      "z",
      [STAIR_OPENING.west - MAIN.partition, STAIR_OPENING.west],
      [STAIR_OPENING.back, STAIR_STEPS.lowerStartZ],
      BASE,
      STOREYS.groundCeiling,
    ),
    wall(
      "stair-left-upper",
      "z",
      [STAIR_OPENING.west - MAIN.partition, STAIR_OPENING.west],
      [STAIR_OPENING.back, STAIR_OPENING.front],
      UPPER_BASE,
      STOREYS.upperCeiling,
    ),
    wall(
      "stair-back-ground",
      "x",
      [STAIR_OPENING.guardBack, STAIR_OPENING.back],
      [STAIR_OPENING.west - MAIN.partition, STAIR_OPENING.east],
      BASE,
      STOREYS.groundCeiling,
    ),
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
        holes: [
          {
            id: "entry-coat-opening",
            from: COAT.opening.from,
            to: COAT.opening.to,
            bottom: STOREYS.groundFloor,
            top: COAT.top,
          },
        ],
      }),
    ),
    wall(
      "stair-bedroom-side-upper",
      "z",
      [STAIR_OPENING.turnX, STAIR_OPENING.turnX + MAIN.partition],
      [STAIR_OPENING.turnZ, STAIR_OPENING.front],
      UPPER_BASE,
      STOREYS.upperCeiling,
    ),
    wall(
      "stair-bedroom-front-upper",
      "x",
      [STAIR_OPENING.turnZ, STAIR_OPENING.turnZ + MAIN.partition],
      [
        STAIR_OPENING.turnX + MAIN.partition,
        STAIR_OPENING.east - MAIN.partition,
      ],
      UPPER_BASE,
      STOREYS.upperCeiling,
    ),
  );
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
  const landingTop = RISE * 8;
  parts.push(
    part(
      "stair-handrail-lower",
      OWNER,
      "guard",
      PALETTE.stairWood,
      bar(
        { x, y: railTop(RISE), z: STAIR_STEPS.lowerStartZ },
        { x, y: railTop(landingTop), z: STAIR_OPENING.turnZ },
        RESERVE,
      ),
    ),
    part(
      "stair-handrail-upper",
      OWNER,
      "guard",
      PALETTE.stairWood,
      bar(
        { x: STAIR_OPENING.turnX, y: railTop(landingTop), z: zFront },
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
        [STAIR_OPENING.turnX - RESERVE, RISE, STAIR_STEPS.lowerStartZ - RESERVE],
        [STAIR_OPENING.turnX, RISE + HANDRAIL, STAIR_STEPS.lowerStartZ],
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
          landingTop,
          STAIR_OPENING.turnZ - RESERVE,
        ],
        [STAIR_OPENING.turnX, landingTop + HANDRAIL, STAIR_OPENING.turnZ],
      ),
    ),
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
    part(
      id,
      OWNER,
      "floor",
      PALETTE.interiorWall,
      block([x[0], edgeBottom, z[0]], [x[1], edgeTop, z[1]]),
    );
  parts.push(
    edge(
      "stair-opening-edge-east",
      [STAIR_OPENING.turnX, STAIR_OPENING.turnX + e],
      [STAIR_OPENING.turnZ + e, STAIR_OPENING.front],
    ),
    edge(
      "stair-opening-edge-front",
      [STAIR_OPENING.turnX, STAIR_OPENING.east + e],
      [STAIR_OPENING.turnZ, STAIR_OPENING.turnZ + e],
    ),
    edge(
      "stair-opening-edge-arrival",
      [STAIR_OPENING.east, STAIR_OPENING.east + e],
      [STAIR_OPENING.back - e, STAIR_OPENING.turnZ],
    ),
    edge(
      "stair-opening-edge-back",
      [STAIR_OPENING.west - e, STAIR_OPENING.east],
      [STAIR_OPENING.back - e, STAIR_OPENING.back],
    ),
    edge(
      "stair-opening-edge-west",
      [STAIR_OPENING.west - e, STAIR_OPENING.west],
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
