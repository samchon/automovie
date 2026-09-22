/**
 * 같은 높이의 방/문턱 support 구획에서 하나의 외곽과 구멍을 유도한다.
 * 계산 격자의 내부 이음선을 support 경계로 남기지 않는다. +XZ CCW 외곽,
 * CW 구멍으로 native IAutoMovieBuiltSurface를 만들며 y 좌표는 API대로 0,
 * 높이는 constant 하나로만 선언한다. 연결되지 않은 섬·점 접촉은 거부한다.
 */
import type { IAutoMovieBuiltSurface } from "@automovie/interface";
import type { FloorInput, FloorRegion } from "./floor-input";
import { rectanglePolygon, type PlanPoint } from "./planar-domain";

/** 여러 높이는 실제 계단 단면이므로 각각 독립된 수평 support다. */
export const floorSupportSurfaces = (input: FloorInput): IAutoMovieBuiltSurface[] => {
  const heights = [...new Set(input.supports.map((region) => region.floor))].sort((a, b) => a - b);
  return heights.map((height, index) => {
    if (!Number.isFinite(height)) throw new Error(`${input.space}/support: 비유한 높이`);
    const regions = input.supports.filter((region) => region.floor === height);
    const loops = supportLoops(input.space, regions);
    const outers = loops.filter((loop) => signedArea(loop) > 0);
    const holes = loops.filter((loop) => signedArea(loop) < 0);
    if (outers.length !== 1) {
      throw new Error(`${input.space}/support: 같은 높이에서 외곽 ${outers.length}개가 분리됐습니다.`);
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

/** 입력의 실제 끝선에서만 분해하므로 굽은 선이나 곡면을 근사하지 않는다. */
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
      if (count > 1) throw new Error(`${owner}/support: 양의 면적 중첩 ${key(x, z)}`);
      if (count === 1) occupied.add(key(x, z));
    }
  }
  const edges = new Map<string, Edge>();
  const add = (x: number, z: number, tx: number, tz: number): void => {
    const from = key(x, z);
    if (edges.has(from)) throw new Error(`${owner}/support: 경계가 한 점에서 분기합니다: ${from}`);
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
    if (first === undefined) throw new Error(`${owner}/support: 시작 경계 누락`);
    const loop: PlanPoint[] = [];
    let next = first.from;
    do {
      const edge = edges.get(next);
      if (edge === undefined) throw new Error(`${owner}/support: 열린 경계 ${next}`);
      loop.push(edge.start);
      edges.delete(next);
      next = edge.to;
    } while (next !== first.from);
    if (Math.abs(signedArea(loop)) < 1e-9) throw new Error(`${owner}/support: 면적 없는 경계`);
    loops.push(loop);
  }
  return loops;
};

const signedArea = (loop: readonly PlanPoint[]): number => loop.reduce((sum, a, i) => {
  const b = loop[(i + 1) % loop.length]!;
  return sum + a.x * b.z - b.x * a.z;
}, 0) / 2;
