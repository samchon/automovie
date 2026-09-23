/**
 * 외벽 위의 석재 코핑과 외벽 발치의 석재 기단 띠를 벽 기둥에서 유도한다.
 * 코핑은 평평한 윗면 기둥(파라펫·마당 벽)의 평면 위에 두께만큼 얹히고 양쪽
 * 긴 면과 자유 끝에서 돌출한다. 더 높은 벽으로 이어지는 끝은 돌출하지 않고,
 * 돌출분이 다른 벽 기둥 안으로 들어가는 칸은 버린다. 기단은 건물 외곽선 위
 * 바깥면 중 발치부터 기단 상단까지 끊기지 않은 면 앞에만 돌출하며 상단은
 * 호출자가 준 지면 높이를 따른다. 두 결과 모두 격자 칸의 합집합이라 한 part
 * 안에 겹친 실체가 없고, 맞닿은 칸의 공통 면은 culling으로 제거된다.
 */
import { cullCoincidentVerticalFaces } from "./face-culling";
import { planeHeight, rectanglePolygon, type HeightPlane, type PlanPoint, type PlanRectangle, type RoofPatch } from "./planar-domain";
import { prismFaces } from "./prism";
import { wallColumns, wallFaces, type WallFace, type WallSpec } from "./wall-solids";

export interface WallTrimProfile {
  /** 코핑 돌출(m): 벽 긴 면과 자유 끝에서. */
  copingProjection: number;
  /** 기단 돌출(m): 외곽 바깥면에서. */
  plinthProjection: number;
  /** 기단 상단의 지면 위 높이(m). */
  plinthRise: number;
}

export interface WallTrimInput {
  walls: readonly WallSpec[];
  roof: readonly RoofPatch[];
  profile: WallTrimProfile;
  /** 건물 외곽 바깥선. 기단은 이 선 위의 면에만 붙는다. */
  outline: PlanRectangle;
  /** 평면 위치의 지면 평면(기단 상단 = 지면 + rise). */
  grade: (at: PlanPoint) => HeightPlane;
  /** 기단 칸을 나눌 지면 경사 전환선(Z). */
  gradeBreaks: readonly number[];
  /** 외곽 면을 소유한 입면 이름에서 기단 표면 ID를 만든다. */
  plinthSurface: (outerSurface: string) => string;
}

interface Tagged { rect: PlanRectangle; surface: string; owner: string; core: boolean }

const eps = 1e-7;
const inside = (r: PlanRectangle, p: PlanPoint) =>
  p.x > r.west + eps && p.x < r.east - eps && p.z > r.north + eps && p.z < r.south - eps;
const bbox = (polygon: readonly PlanPoint[]): PlanRectangle => ({
  west: Math.min(...polygon.map((p) => p.x)), east: Math.max(...polygon.map((p) => p.x)),
  north: Math.min(...polygon.map((p) => p.z)), south: Math.max(...polygon.map((p) => p.z)),
});
const containsPoint = (polygon: readonly PlanPoint[], p: PlanPoint): boolean => polygon.every((a, i) => {
  const b = polygon[(i + 1) % polygon.length]!;
  return (b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x) >= -1e-9;
});

/** 격자 칸 합집합: 칸 중심을 덮는 첫 태그의 표면을 받는다(core 우선). */
const gridCells = (tags: readonly Tagged[], reject: (center: PlanPoint) => boolean) => {
  const xs = [...new Set(tags.flatMap((t) => [t.rect.west, t.rect.east]))].sort((a, b) => a - b);
  const zs = [...new Set(tags.flatMap((t) => [t.rect.north, t.rect.south]))].sort((a, b) => a - b);
  const cells: Array<{ rect: PlanRectangle; tag: Tagged }> = [];
  for (let i = 0; i + 1 < xs.length; ++i) {
    for (let j = 0; j + 1 < zs.length; ++j) {
      const rect = { west: xs[i]!, east: xs[i + 1]!, north: zs[j]!, south: zs[j + 1]! };
      if (rect.east - rect.west < 1e-6 || rect.south - rect.north < 1e-6) continue;
      const center = { x: (rect.west + rect.east) / 2, z: (rect.north + rect.south) / 2 };
      const hits = tags.filter((t) => inside(t.rect, center));
      const tag = hits.find((t) => t.core) ?? hits[0];
      if (tag === undefined || (!tag.core && reject(center))) continue;
      cells.push({ rect, tag });
    }
  }
  return cells;
};

/**
 * 코핑: 평평한 윗면에 coping 두께가 있는 기둥마다 그 평면의 외접 사각형을
 * 핵으로 삼는다. 같은 높이의 인접 기둥끼리는 합집합으로 잇고, 벽 평면의
 * 끝(모서리·자유 끝)에서만 길이 방향으로 돌출한다.
 */
export const copingFaces = (input: WallTrimInput): WallFace[] => {
  const { walls, roof, profile } = input;
  const e = profile.copingProjection;
  const byHeight = new Map<number, Tagged[]>();
  const blockers: PlanPoint[][] = [];
  const beds: Array<{ polygon: PlanPoint[]; surface: string; height: number }> = [];
  for (const wall of walls) {
    const along = (p: PlanPoint) => wall.axis === "x" ? p.x : p.z;
    const coordinates = wall.plan.map(along);
    const [min, max] = [Math.min(...coordinates), Math.max(...coordinates)];
    for (const column of wallColumns(wall, roof)) {
      const top = column.segment.top;
      if (top.kind !== "flat" || top.coping === undefined) {
        blockers.push(column.polygon);
        continue;
      }
      const r = bbox(column.polygon);
      const [lo, hi] = wall.axis === "x" ? [r.west, r.east] : [r.north, r.south];
      const endLow = Math.abs(lo - min) < 1e-9 ? e : 0;
      const endHigh = Math.abs(hi - max) < 1e-9 ? e : 0;
      const grown = wall.axis === "x"
        ? { west: r.west - endLow, east: r.east + endHigh, north: r.north - e, south: r.south + e }
        : { west: r.west - e, east: r.east + e, north: r.north - endLow, south: r.south + endHigh };
      const list = byHeight.get(top.height) ?? [];
      list.push({ rect: r, surface: top.surface, owner: wall.owner, core: true });
      list.push({ rect: grown, surface: top.surface, owner: wall.owner, core: false });
      byHeight.set(top.height, list);
      beds.push({ polygon: column.polygon, surface: `surface.${wall.owner}.joint`, height: top.height - top.coping });
    }
  }
  const faces: WallFace[] = [];
  for (const [height, tags] of byHeight) {
    const thickness = walls.flatMap((w) => w.segments).find((s) => s.top.kind === "flat" && s.top.height === height && s.top.coping !== undefined);
    const t = thickness?.top.kind === "flat" ? thickness.top.coping ?? 0 : 0;
    const others = beds.filter((b) => Math.abs(b.height - (height - t)) > 1e-9).map((b) => b.polygon);
    const cells = gridCells(tags, (center) => [...blockers, ...others].some((polygon) => containsPoint(polygon, center)));
    for (const { rect, tag } of cells) {
      const polygon = rectanglePolygon(rect);
      const center = { x: (rect.west + rect.east) / 2, z: (rect.north + rect.south) / 2 };
      const onBed = beds.some((b) => b.height === height - t && containsPoint(b.polygon, center));
      for (const face of prismFaces(polygon, { x: 0, z: 0, constant: height - t }, { x: 0, z: 0, constant: height })) {
        const bed = face.side === "bottom" && onBed;
        faces.push({ surface: bed ? `surface.${tag.owner}.joint` : tag.surface, corners: face.corners });
      }
    }
  }
  return cullCoincidentVerticalFaces(faces);
};

/**
 * 기단: 외곽선 위에 놓인 바깥면 중 벽 하단에서 시작해 기단 상단보다 높이
 * 이어지는 면 앞에 돌출 띠를 둔다. 문턱 아래처럼 기단 상단보다 낮게 끝나는
 * 면(개구부 아래)은 건너뛰어 void 앞을 막지 않는다. 네 바깥 모서리는 띠끼리
 * 잇는 정사각 칸을 더한다. 칸은 지면 경사 전환선에서 나뉘어 상단이 평면이다.
 */
export const plinthFaces = (input: WallTrimInput): WallFace[] => {
  const { walls, roof, profile, outline: o } = input;
  const d = profile.plinthProjection;
  const tags: Tagged[] = [];
  const bottom = Math.min(...walls.map((w) => w.bottom));
  for (const wall of walls) {
    for (const face of wallFaces(wall, roof)) {
      if (!face.surface.endsWith(".outer")) continue;
      const xs = face.corners.map((c) => c.x);
      const zs = face.corners.map((c) => c.z);
      const ys = face.corners.map((c) => c.y);
      if (Math.abs(Math.min(...ys) - bottom) > 1e-9) continue;
      const constX = Math.max(...xs) - Math.min(...xs) < 1e-9 ? xs[0]! : null;
      const constZ = Math.max(...zs) - Math.min(...zs) < 1e-9 ? zs[0]! : null;
      let rect: PlanRectangle | null = null;
      if (constX !== null && Math.abs(Math.abs(constX) - o.east) < 1e-9) {
        const sign = Math.sign(constX);
        rect = { west: sign < 0 ? constX - d : constX, east: sign < 0 ? constX : constX + d,
          north: Math.min(...zs), south: Math.max(...zs) };
      } else if (constZ !== null && (Math.abs(constZ - o.south) < 1e-9 || Math.abs(constZ - o.north) < 1e-9)) {
        const sign = constZ > 0 ? 1 : -1;
        rect = { west: Math.min(...xs), east: Math.max(...xs),
          north: sign < 0 ? constZ - d : constZ, south: sign < 0 ? constZ : constZ + d };
      }
      if (rect === null) continue;
      // 면 위쪽 끝(양 꼭짓점 중 낮은 쪽)이 기단 상단보다 낮으면 그 면 앞은 void 아래다.
      const topEdge = Math.min(...face.corners.filter((c) => c.y > wall.bottom + 1e-9).map((c) => c.y));
      const probe = { x: (rect.west + rect.east) / 2, z: (rect.north + rect.south) / 2 };
      if (!(topEdge > planeHeight(input.grade(probe), probe) + profile.plinthRise + 1e-9)) continue;
      tags.push({ rect, surface: input.plinthSurface(face.surface), owner: wall.owner, core: true });
    }
  }
  const corners: Array<[number, number, number, number]> = [
    [o.west - d, o.west, o.north - d, o.north], [o.east, o.east + d, o.north - d, o.north],
    [o.west - d, o.west, o.south, o.south + d], [o.east, o.east + d, o.south, o.south + d],
  ];
  for (const [west, east, north, south] of corners) {
    const neighbour = tags.find((t) => Math.abs(t.rect.north - north) < 1e-9 && Math.abs(t.rect.south - south) < 1e-9);
    if (neighbour !== undefined) tags.push({ rect: { west, east, north, south }, surface: neighbour.surface, owner: neighbour.owner, core: true });
  }
  const zBreaks = [...input.gradeBreaks];
  const split: Tagged[] = tags.flatMap((t) => {
    const cuts = [t.rect.north, ...zBreaks.filter((z) => z > t.rect.north + 1e-9 && z < t.rect.south - 1e-9), t.rect.south];
    return cuts.slice(0, -1).map((north, i) => ({ ...t, rect: { ...t.rect, north, south: cuts[i + 1]! } }));
  });
  const faces: WallFace[] = [];
  for (const { rect, tag } of gridCells(split, () => false)) {
    const center = { x: (rect.west + rect.east) / 2, z: (rect.north + rect.south) / 2 };
    const ground = input.grade(center);
    const top = { ...ground, constant: ground.constant + profile.plinthRise };
    for (const face of prismFaces(rectanglePolygon(rect), { x: 0, z: 0, constant: bottom }, top)) {
      const back = face.side === "edge" && isBackFace(rect, face.normal, o);
      const hidden = face.side === "bottom" || back;
      faces.push({ surface: hidden ? `surface.${tag.owner}.joint` : tag.surface, corners: face.corners });
    }
  }
  return cullCoincidentVerticalFaces(faces);
};

/** 기단 칸의 옆면 중 외곽선 위에서 벽 쪽을 향한 면(벽과 맞닿는 가려진 면). */
const isBackFace = (rect: PlanRectangle, normal: PlanPoint, o: PlanRectangle): boolean =>
  (normal.x > 0.5 && Math.abs(rect.east - o.west) < 1e-9) || (normal.x < -0.5 && Math.abs(rect.west - o.east) < 1e-9) ||
  (normal.z > 0.5 && Math.abs(rect.south - o.north) < 1e-9) || (normal.z < -0.5 && Math.abs(rect.north - o.south) < 1e-9);
