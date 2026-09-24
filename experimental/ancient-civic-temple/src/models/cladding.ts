/**
 * docs/models/cladding.md의 둥근기와·평기와 단위와 용마루 기와. 합성 지붕 조각(같은 owner·
 * 같은 상면 평면의 조각 묶음) 위에 경사를 따라 내려오는 줄(간격 0.40m)마다 처마 쪽에서 위로
 * 단위(길이 0.52m, 노출 0.44m)를 놓는다. 단위의 평면 발자국 네 모서리가 모두 묶음 안에 들어야
 * 놓이므로 골선·조각 경계에서는 단위가 빠진다(문서의 표현 한계). 평기와는 slab 상면 위 0.02m
 * 판, 둥근기와는 처마 쪽 반지름 0.085m→위쪽 0.075m의 반원 껍질(8분할)과 처마 쪽 끝 단면이다.
 * 좌표는 world m이며 배치 규칙(줄 간격·겹침·잘림)은 이 source가 조각에서 유도한다.
 */
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { planeHeight, type PlanPoint, type RoofPatch } from "../geometry/planar-domain";
import { add, cross, model, part, scale, TriangleSink, unit, vec, type Vec } from "./mesh-kit";

const rowSpacing = 0.4, unitLength = 0.52, exposed = 0.44, tegulaThickness = 0.02;

const inside = (polygon: readonly PlanPoint[], p: PlanPoint, margin: number): boolean => polygon.every((a, i) => {
  const b = polygon[(i + 1) % polygon.length]!;
  const length = Math.hypot(b.x - a.x, b.z - a.z);
  return ((b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x)) / length >= margin;
});

interface Frame { down: Vec; across: Vec; normal: Vec; downPlan: PlanPoint; acrossPlan: PlanPoint; cos: number }

const frameOf = (patch: RoofPatch): Frame => {
  const g = Math.hypot(patch.height.x, patch.height.z);
  const downPlan = { x: -patch.height.x / g, z: -patch.height.z / g };
  const acrossPlan = { x: -downPlan.z, z: downPlan.x };
  const down = unit(vec(downPlan.x, -g, downPlan.z));
  const across = vec(acrossPlan.x, 0, acrossPlan.z);
  const normal = unit(cross(across, down));
  return { down, across, normal: normal.y < 0 ? scale(normal, -1) : normal, downPlan, acrossPlan, cos: 1 / Math.hypot(1, g) };
};

/** 반원 껍질 한 단위: 처마 쪽 아래 끝 중심 base에서 위(-down)로 length, 반지름 r0→r1. */
const shell = (sink: TriangleSink, base: Vec, f: Frame, length: number, r0: number, r1: number, thickness: number, segments: number): void => {
  const upSlope = scale(f.down, -1);
  const at = (s: number, r: number, k: number) => {
    const phi = Math.PI * k / segments;
    return add(add(base, scale(upSlope, s)), add(scale(f.across, r * Math.cos(phi)), scale(f.normal, r * Math.sin(phi))));
  };
  const outerLow = Array.from({ length: segments + 1 }, (_, k) => sink.vertex(at(0, r0, k)));
  const outerHigh = Array.from({ length: segments + 1 }, (_, k) => sink.vertex(at(length, r1, k)));
  const innerLow = Array.from({ length: segments + 1 }, (_, k) => sink.vertex(at(0, r0 - thickness, k)));
  for (let k = 0; k < segments; ++k) {
    sink.quad(outerLow[k]!, outerLow[k + 1]!, outerHigh[k + 1]!, outerHigh[k]!);
    sink.quad(innerLow[k]!, innerLow[k + 1]!, outerLow[k + 1]!, outerLow[k]!);
  }
};

/** 평기와 한 장: slab 상면 위 두께 판(윗면과 처마 쪽 끝면만; 아랫면은 slab에 닿아 가려진다). */
const plate = (sink: TriangleSink, base: Vec, f: Frame, width: number, length: number): void => {
  const upSlope = scale(f.down, -1);
  const corner = (u: number, s: number, h: number) => add(add(add(base, scale(f.across, u)), scale(upSlope, s)), scale(f.normal, h));
  const a = sink.vertex(corner(-width / 2, 0, tegulaThickness)), b = sink.vertex(corner(width / 2, 0, tegulaThickness));
  const c = sink.vertex(corner(width / 2, length, tegulaThickness)), d = sink.vertex(corner(-width / 2, length, tegulaThickness));
  sink.quad(a, d, c, b);
  const e = sink.vertex(corner(-width / 2, 0, 0)), g = sink.vertex(corner(width / 2, 0, 0));
  sink.quad(e, a, b, g);
};

/** 한 roof owner의 기와 mesh(평기와·둥근기와 두 part). patches는 그 owner의 합성 조각. */
export const roofTileMeshes = (patches: readonly RoofPatch[]): { tegula: IAutoMovieMesh; imbrex: IAutoMovieMesh; units: number } => {
  const tegula = new TriangleSink();
  const imbrex = new TriangleSink();
  let units = 0;
  const groups = new Map<string, RoofPatch[]>();
  for (const patch of patches) {
    const key = [patch.height.x, patch.height.z, patch.height.constant].map((v) => v.toFixed(6)).join(",");
    groups.set(key, [...groups.get(key) ?? [], patch]);
  }
  for (const group of groups.values()) {
    const f = frameOf(group[0]!);
    const points = group.flatMap((p) => p.polygon);
    const acrossValues = points.map((p) => p.x * f.acrossPlan.x + p.z * f.acrossPlan.z);
    const downValues = points.map((p) => p.x * f.downPlan.x + p.z * f.downPlan.z);
    const [a0, a1] = [Math.min(...acrossValues), Math.max(...acrossValues)];
    const [d0, d1] = [Math.min(...downValues), Math.max(...downValues)];
    const covered = (p: PlanPoint) => group.some((patch) => inside(patch.polygon, p, 1e-6));
    const plan = (a: number, d: number): PlanPoint => ({
      x: f.acrossPlan.x * a + f.downPlan.x * d, z: f.acrossPlan.z * a + f.downPlan.z * d,
    });
    const top = (p: PlanPoint) => planeHeight(group[0]!.height, p);
    // 줄은 world 원점 기준 0.40m 격자(같은 경사의 이웃 조각과 줄이 맞는다).
    for (let a = Math.ceil((a0 + rowSpacing / 2) / rowSpacing) * rowSpacing; a <= a1 - rowSpacing / 2 + 1e-9; a += rowSpacing) {
      for (let d = d1; d - unitLength * f.cos >= d0 - 1e-9; d -= exposed * f.cos) {
        const footprint = [plan(a - rowSpacing / 2, d), plan(a + rowSpacing / 2, d),
          plan(a + rowSpacing / 2, d - unitLength * f.cos), plan(a - rowSpacing / 2, d - unitLength * f.cos)];
        if (!footprint.every(covered)) continue;
        const low = plan(a, d);
        const base = vec(low.x, top(low), low.z);
        plate(tegula, base, f, rowSpacing, unitLength);
        shell(imbrex, add(add(base, scale(f.across, rowSpacing / 2)), scale(f.normal, tegulaThickness)), f, unitLength, 0.085, 0.075, 0.015, 8);
        ++units;
      }
    }
  }
  return { tegula: tegula.mesh(), imbrex: imbrex.mesh(), units };
};

/** 용마루 기와 줄: from→to 수평선(용마루 높이 y) 위 반지름 0.13m 반원 껍질(12분할), 단위 0.45m·겹침 0.05m. */
export const ridgeTileMesh = (from: Vec, to: Vec): IAutoMovieMesh => {
  const sink = new TriangleSink();
  const length = Math.hypot(to.x - from.x, to.z - from.z);
  const along = unit(vec(to.x - from.x, 0, to.z - from.z));
  const f: Frame = { down: scale(along, -1), across: unit(cross(vec(0, 1, 0), along)), normal: vec(0, 1, 0), downPlan: { x: 0, z: 0 }, acrossPlan: { x: 0, z: 0 }, cos: 1 };
  for (let s = 0; s < length - 1e-6; s += 0.4) {
    const piece = Math.min(0.45, length - s);
    shell(sink, add(from, scale(along, s)), f, piece, 0.13, 0.13, 0.02, 12);
  }
  return sink.mesh();
};

/** owner별 기와 model. ridges는 그 owner의 용마루 선(world). */
export const roofCladdingModel = (owner: string, patches: readonly RoofPatch[], ridges: ReadonlyArray<[Vec, Vec]>): { model: IAutoMovieModel; units: number } => {
  const tiles = roofTileMeshes(patches);
  const name = `cladding-${owner}`;
  const parts = [part(`surface.${name}.tegula`, tiles.tegula), part(`surface.${name}.imbrex`, tiles.imbrex)];
  if (ridges.length > 0) {
    const sink: IAutoMovieMesh[] = ridges.map(([a, b]) => ridgeTileMesh(a, b));
    const positions: number[] = [];
    const indices: number[] = [];
    for (const mesh of sink) {
      const base = positions.length / 3;
      positions.push(...mesh.positions);
      indices.push(...(mesh.indices ?? []).map((i) => i + base));
    }
    parts.push(part(`surface.${name}.ridge`, { positions, normals: null, uvs: null, indices, skin: null }));
  }
  return { model: model(`model.${name}`, name, parts), units: tiles.units };
};
