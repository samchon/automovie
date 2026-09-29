/**
 * 서로 내부가 겹치지 않는 직교 바닥 구획의 경계면을 직접 구성한다.
 * 입력 끝선/높이에서만 나눈 비균일 격자로 정확한 면 접합을 구하고 내부
 * 접면을 출력하지 않는다. 일정 해상도 샘플링이나 입력 mesh 변경은 없다.
 * 면은 볼록 사각형, world m, 바깥쪽 winding이다. engine이 normals/UV를
 * 만들 수 있도록 모든 끝점과 물리 구획/공간의 원래 ID를 보존한다.
 */
import type { IAutoMovieVector3 } from "@automovie/interface";
import type { FloorInput, FloorSlab } from "./floor-input";

export interface FloorBoundaryFace {
  id: string;
  space: string;
  slab: string;
  surface: string;
  direction: "west" | "east" | "bottom" | "top" | "north" | "south";
  corners: IAutoMovieVector3[];
}

interface Occupant {
  floor: FloorInput;
  slab: FloorSlab;
}

/**
 * 모든 방을 함께 읽어 서로 맞닿은 바닥 사이의 내부 면도 제거한다.
 * 양의 체적 중첩, 빈 입력, 중복 ID, 비유한 값, 뒤집힌 범위는 거부한다.
 * 결과의 닫힘/비다양체 여부는 후속 engine topology 계측 대상이다.
 */
export const floorBoundaryFaces = (inputs: readonly FloorInput[]): FloorBoundaryFace[] => {
  const solids = inputs.flatMap((floor) => floor.slabs.map((slab) => ({ floor, slab })));
  if (solids.length === 0) throw new Error("floor: 바닥 실체 입력이 없습니다.");
  const spaces = new Set<string>();
  for (const floor of inputs) {
    if (spaces.has(floor.space) || floor.slabs.length === 0) {
      throw new Error(`${floor.space}/floor: 중복 소유자 또는 빈 바닥입니다.`);
    }
    spaces.add(floor.space);
    const ids = new Set<string>();
    for (const slab of floor.slabs) {
      if (ids.has(slab.id)) throw new Error(`${floor.space}/floor: 중복 구획 ${slab.id}`);
      ids.add(slab.id);
      if (![slab.west, slab.east, slab.north, slab.south, slab.bottom, slab.floor].every(Number.isFinite) ||
          slab.west >= slab.east || slab.north >= slab.south || slab.bottom >= slab.floor) {
        throw new Error(`${floor.space}/floor/${slab.id}: 유한한 양의 실체 범위가 필요합니다.`);
      }
    }
  }
  const xs = orderedCoordinates(solids.flatMap(({ slab }) => [slab.west, slab.east]));
  const ys = orderedCoordinates(solids.flatMap(({ slab }) => [slab.bottom, slab.floor]));
  const zs = orderedCoordinates(solids.flatMap(({ slab }) => [slab.north, slab.south]));
  const occupied = new Map<string, Occupant>();
  for (let x = 0; x < xs.length - 1; ++x) {
    for (let y = 0; y < ys.length - 1; ++y) {
      for (let z = 0; z < zs.length - 1; ++z) {
        const cx = (xs[x]! + xs[x + 1]!) / 2;
        const cy = (ys[y]! + ys[y + 1]!) / 2;
        const cz = (zs[z]! + zs[z + 1]!) / 2;
        const matches = solids.filter(({ slab }) =>
          cx > slab.west && cx < slab.east && cz > slab.north && cz < slab.south &&
          cy > slab.bottom && cy < slab.floor,
        );
        if (matches.length > 1) {
          throw new Error(`floor: ${matches.map(({ floor, slab }) => `${floor.space}/${slab.id}`).join(", ")} 체적 중첩`);
        }
        if (matches[0] !== undefined) occupied.set(key(x, y, z), matches[0]);
      }
    }
  }
  const faces: FloorBoundaryFace[] = [];
  for (const [address, owner] of occupied) {
    const [x, y, z] = address.split(",").map(Number);
    if (x === undefined || y === undefined || z === undefined) throw new Error("floor: 격자 주소 오류");
    const x0 = xs[x]!, x1 = xs[x + 1]!;
    const y0 = ys[y]!, y1 = ys[y + 1]!;
    const z0 = zs[z]!, z1 = zs[z + 1]!;
    const v = (px: number, py: number, pz: number): IAutoMovieVector3 => ({ x: px, y: py, z: pz });
    const sides: Array<{
      direction: FloorBoundaryFace["direction"];
      neighbor: string;
      corners: IAutoMovieVector3[];
    }> = [
      { direction: "west", neighbor: key(x - 1, y, z), corners: [v(x0,y0,z0),v(x0,y0,z1),v(x0,y1,z1),v(x0,y1,z0)] },
      { direction: "east", neighbor: key(x + 1, y, z), corners: [v(x1,y0,z0),v(x1,y1,z0),v(x1,y1,z1),v(x1,y0,z1)] },
      { direction: "bottom", neighbor: key(x, y - 1, z), corners: [v(x0,y0,z0),v(x1,y0,z0),v(x1,y0,z1),v(x0,y0,z1)] },
      { direction: "top", neighbor: key(x, y + 1, z), corners: [v(x0,y1,z0),v(x0,y1,z1),v(x1,y1,z1),v(x1,y1,z0)] },
      { direction: "north", neighbor: key(x, y, z - 1), corners: [v(x0,y0,z0),v(x0,y1,z0),v(x1,y1,z0),v(x1,y0,z0)] },
      { direction: "south", neighbor: key(x, y, z + 1), corners: [v(x0,y0,z1),v(x1,y0,z1),v(x1,y1,z1),v(x0,y1,z1)] },
    ];
    for (const side of sides) {
      if (occupied.has(side.neighbor)) continue;
      faces.push({
        id: `${owner.floor.space}.${owner.slab.id}.${address}.${side.direction}`,
        space: owner.floor.space, slab: owner.slab.id, surface: owner.floor.surface,
        direction: side.direction, corners: side.corners,
      });
    }
  }
  return faces;
};

/** 입력 좌표를 이동하지 않는다. 부동소수점 잔여 크기의 실체는 거부한다. */
const orderedCoordinates = (values: number[]): number[] => {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; ++i) {
    if (sorted[i]! - sorted[i - 1]! < 1e-9) {
      throw new Error("floor: 수치 한계보다 가까운 서로 다른 끝선입니다.");
    }
  }
  return sorted;
};

const key = (x: number, y: number, z: number): string => `${x},${y},${z}`;
