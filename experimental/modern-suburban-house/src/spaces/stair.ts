/**
 * `main-stair`: the single L-shaped stair, its closed sides and its guards.
 *
 * Design owner: `docs/spaces/02-stair.md`. 3.06 m is split into 18 risers of
 * 0.17 m. The lower flight (8 risers, 7 treads of 0.28 m) climbs -Z over
 * X = [-1.80, -0.65] from Z = -1.45 to the landing X = [-1.80, -0.65],
 * Z = [-4.56, -3.41] at Y = 1.36; the upper flight (10 risers, 9 treads) climbs
 * +X over Z = [-4.56, -3.41] from X = -0.65 and arrives at X = 1.87 on the upper
 * floor. Tread positions are derived from count, direction and start, never
 * copied by hand. The space under both flights is closed down to the floor
 * (stair-boundary-heights), so each tread is a solid block from the floor base.
 *
 * Boundaries owned here (stair-floor-opening, stair-boundary-heights):
 * - the left partition X = [-1.95, -1.80] beside the flights on the ground
 *   storey and beside the opening on the upper storey;
 * - the back partition Z = [-4.71, -4.56] from the ground floor to the upper
 *   floor, and the under-stair closure X = [1.87, 2.02] at the arrival end;
 * - the upper bedroom-side partitions X = [-0.65, -0.50] and Z = [-3.41, -3.26];
 * - the upper-hall edge guard, top 1.05 m above the upper floor, and the lower
 *   flight's open-side handrail 0.90 m above the nosing line.
 * Balusters and their count are later model work; rails and end posts are
 * emitted here as the blocking of those guards.
 */
import { PALETTE } from "./palette";
import { type IHousePart, bar, block, part, straightWall } from "./solids";
import { LAYERS, STOREYS } from "./storeys";

const OWNER = "stair.ts";
const RISE = STOREYS.upperFloor / 18;
const RUN = 0.28;
const BASE = STOREYS.groundFloor - LAYERS.groundFinish;
const UPPER_BASE = STOREYS.upperFloor - LAYERS.interstoreyFloorFinish;

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
  for (let j = 1; j <= 9; ++j) {
    const start = -0.65 + RUN * (j - 1);
    parts.push(part(`stair-upper-tread-${j}`, OWNER, "stair", PALETTE.stairWood, block([start, BASE, -4.56], [start + RUN, RISE * (8 + j), -3.41])));
  }
  const wall = (id: string, axis: "x" | "z", across: readonly [number, number], along: readonly [number, number], bottom: number, top: number): IHousePart =>
    part(id, OWNER, "partition", PALETTE.interiorWall, straightWall({ axis, across, along, bottom, top }));
  parts.push(
    wall("stair-left-ground", "z", [-1.95, -1.8], [-4.56, -1.45], BASE, STOREYS.groundCeiling),
    wall("stair-left-upper", "z", [-1.95, -1.8], [-4.56, -0.25], UPPER_BASE, STOREYS.upperCeiling),
    wall("stair-back-ground", "x", [-4.71, -4.56], [-1.95, 1.87], BASE, STOREYS.groundCeiling),
    wall("stair-arrival-closure", "z", [1.87, 2.02], [-4.71, -3.41], BASE, STOREYS.groundCeiling),
    wall("stair-bedroom-side-upper", "z", [-0.65, -0.5], [-3.41, -0.25], UPPER_BASE, STOREYS.upperCeiling),
    wall("stair-bedroom-front-upper", "x", [-3.41, -3.26], [-0.5, 1.72], UPPER_BASE, STOREYS.upperCeiling),
  );
  // Upper hall edge guard along Z = [-4.71, -4.56]: end posts, top and bottom rails.
  const guardTop = STOREYS.upperFloor + 1.05;
  const z = -4.635;
  parts.push(
    part("stair-guard-post-east", OWNER, "guard", PALETTE.railing, block([1.81, STOREYS.upperFloor, z - 0.03], [1.87, guardTop, z + 0.03])),
    part("stair-guard-top-rail", OWNER, "guard", PALETTE.stairWood, bar({ x: -1.8, y: guardTop - 0.03, z }, { x: 1.87, y: guardTop - 0.03, z }, 0.06)),
    part("stair-guard-bottom-rail", OWNER, "guard", PALETTE.railing, bar({ x: -1.8, y: STOREYS.upperFloor + 0.1, z }, { x: 1.87, y: STOREYS.upperFloor + 0.1, z }, 0.04)),
  );
  // Lower flight open side toward the entry: handrail 0.90 m above the nosing line, two end posts.
  const x = -0.575;
  const firstNosing = { z: -1.45, y: RISE };
  const landingEdge = { z: -3.41, y: RISE * 8 };
  parts.push(
    part("stair-handrail-lower", OWNER, "guard", PALETTE.stairWood, bar({ x, y: firstNosing.y + 0.9, z: firstNosing.z }, { x, y: landingEdge.y + 0.9, z: landingEdge.z }, 0.06)),
    part("stair-post-lower-start", OWNER, "guard", PALETTE.railing, block([x - 0.04, BASE, firstNosing.z - 0.04], [x + 0.04, firstNosing.y + 0.9, firstNosing.z + 0.04])),
    part("stair-post-lower-end", OWNER, "guard", PALETTE.railing, block([x - 0.04, BASE, landingEdge.z - 0.04], [x + 0.04, landingEdge.y + 0.9, landingEdge.z + 0.04])),
  );
  return parts;
};
