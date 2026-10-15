/**
 * Derives one outline and its holes from room and threshold support compartments at the same height.
 * Interior seams of the computation grid are not left as support boundaries. Builds a native
 * IAutoMovieBuiltSurface with a +XZ CCW outline and CW holes; y coordinates are 0 as the API requires,
 * and the height is declared only as one constant. Disconnected islands and point contacts are refused.
 */
import type { IAutoMovieBuiltSurface } from "@automovie/interface";
import type { FloorInput } from "./FloorInput";
import type { FloorRegion } from "./FloorRegion";
import { rectanglePolygon } from "./rectanglePolygon";
import { type PlanPoint } from "./PlanPoint";

/** Several heights are real stair sections, so each is an independent horizontal support. */
export const floorSupportSurfaces = (input: FloorInput): IAutoMovieBuiltSurface[] => {
  const heights = [...new Set(input.supports.map((region) => region.floor))].sort((a, b) => a - b);
  return heights.map((height, index) => {
    if (!Number.isFinite(height)) throw new Error(`${input.space}/support: non-finite height`);
    const regions = input.supports.filter((region) => region.floor === height);
    const loops = supportLoops(input.space, regions);
    const outers = loops.filter((loop) => signedArea(loop) > 0);
    const holes = loops.filter((loop) => signedArea(loop) < 0);
    if (outers.length !== 1) {
      throw new Error(`${input.space}/support: ${outers.length} separate outlines at the same height.`);
    }
    const toPlan = (loop: PlanPoint[]) => loop.map(({ x, z }) => ({ x, y: 0, z }));
    return {
      space: input.space,
      surface: {
        id: `support.${input.space}.floor.${index}`, kind: "floor",
        polygon: toPlan(outers[0]!), holes: holes.map(toPlan),
        height: { kind: "constant", value: height },
      },
    };
  });
};

interface Edge { from: string; to: string; start: PlanPoint }

/** Decomposes only at the input's real end lines, so curved lines or surfaces are not approximated. */
const supportLoops = (owner: string, regions: readonly FloorRegion[]): PlanPoint[][] => {
  for (const region of regions) rectanglePolygon(region);
  const xs = [...new Set(regions.flatMap((r) => [r.west, r.east]))].sort((a, b) => a - b);
  const zs = [...new Set(regions.flatMap((r) => [r.north, r.south]))].sort((a, b) => a - b);
  const occupied = new Set<string>();
  const key = (x: number, z: number) => `${x},${z}`;
  for (let x = 0; x < xs.length - 1; ++x) {
    for (let z = 0; z < zs.length - 1; ++z) {
      const cx = (xs[x]! + xs[x + 1]!) / 2;
      const cz = (zs[z]! + zs[z + 1]!) / 2;
      const count = regions.filter((r) => cx > r.west && cx < r.east && cz > r.north && cz < r.south).length;
      if (count > 1) throw new Error(`${owner}/support: positive-area overlap ${key(x, z)}`);
      if (count === 1) occupied.add(key(x, z));
    }
  }
  const edges = new Map<string, Edge>();
  const add = (x: number, z: number, tx: number, tz: number): void => {
    const from = key(x, z);
    if (edges.has(from)) throw new Error(`${owner}/support: the boundary branches at one point: ${from}`);
    edges.set(from, { from, to: key(tx, tz), start: { x: xs[x]!, z: zs[z]! } });
  };
  for (let x = 0; x < xs.length - 1; ++x) {
    for (let z = 0; z < zs.length - 1; ++z) {
      if (!occupied.has(key(x, z))) continue;
      if (!occupied.has(key(x, z - 1))) add(x, z, x + 1, z);
      if (!occupied.has(key(x + 1, z))) add(x + 1, z, x + 1, z + 1);
      if (!occupied.has(key(x, z + 1))) add(x + 1, z + 1, x, z + 1);
      if (!occupied.has(key(x - 1, z))) add(x, z + 1, x, z);
    }
  }
  const loops: PlanPoint[][] = [];
  while (edges.size > 0) {
    const first = edges.values().next().value;
    if (first === undefined) throw new Error(`${owner}/support: missing start boundary`);
    const loop: PlanPoint[] = [];
    let next = first.from;
    do {
      const edge = edges.get(next);
      if (edge === undefined) throw new Error(`${owner}/support: open boundary ${next}`);
      loop.push(edge.start);
      edges.delete(next);
      next = edge.to;
    } while (next !== first.from);
    if (Math.abs(signedArea(loop)) < 1e-9) throw new Error(`${owner}/support: boundary without area`);
    loops.push(loop);
  }
  return loops;
};

const signedArea = (loop: readonly PlanPoint[]): number => loop.reduce((sum, a, i) => {
  const b = loop[(i + 1) % loop.length]!;
  return sum + a.x * b.z - b.x * a.z;
}, 0) / 2;
