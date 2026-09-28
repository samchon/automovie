/**
 * 기하 연산 pure test의 공용 fixture. 면 목록을 engine polyhedron으로 만들어 mesh-ledger로
 * 재고, 닫힌 실체의 기대값(열린 모서리·비다양체·감김·퇴화 0, 기대 체적)을 확인한다.
 * 기대 체적은 연산 코드가 아니라 fixture의 입력 치수로 따로 계산한 값이다.
 */
import assert from "node:assert/strict";
import { buildAutoMoviePolyhedron } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { accountMeshes, type MeshAccount } from "../mesh-ledger";

export const v = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

export const accountFaces = (id: string, faces: ReadonlyArray<{ corners: readonly IAutoMovieVector3[] }>): MeshAccount =>
  accountMeshes(id, [buildAutoMoviePolyhedron(faces.map((face) => face.corners))]);

export const near = (actual: number, expected: number, tolerance = 1e-9, what = "value"): void => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${what}: ${actual} ≠ ${expected} (±${tolerance})`);
};

/** 닫힌 실체의 결산 조건. T 접합은 허용하되 해소 뒤 틈은 없어야 한다. */
export const assertClosed = (account: MeshAccount, volume: number, components = 1): void => {
  assert.equal(account.degenerate, 0, `${account.id}: degenerate`);
  assert.equal(account.nonFinite, 0, `${account.id}: non-finite`);
  assert.equal(account.nonManifoldEdges, 0, `${account.id}: non-manifold`);
  assert.equal(account.resolvedNonManifold, 0, `${account.id}: resolved non-manifold`);
  assert.equal(account.windingErrors, 0, `${account.id}: winding`);
  assert.equal(account.openEdges, 0, `${account.id}: open edges after T-junction resolution`);
  assert.equal(account.components, components, `${account.id}: components`);
  near(account.volume, volume, 1e-9, `${account.id}: volume`);
};

/** 축 정렬 상자의 바깥 감김 면 여섯(engine polyhedron 순서). */
export const boxFaces = (b: { west: number; east: number; bottom: number; top: number; north: number; south: number }) => {
  const { west: x0, east: x1, bottom: y0, top: y1, north: z0, south: z1 } = b;
  return [
    [v(x0, y1, z0), v(x0, y1, z1), v(x1, y1, z1), v(x1, y1, z0)],
    [v(x0, y0, z0), v(x1, y0, z0), v(x1, y0, z1), v(x0, y0, z1)],
    [v(x0, y0, z0), v(x0, y1, z0), v(x1, y1, z0), v(x1, y0, z0)],
    [v(x0, y0, z1), v(x1, y0, z1), v(x1, y1, z1), v(x0, y1, z1)],
    [v(x0, y0, z0), v(x0, y0, z1), v(x0, y1, z1), v(x0, y1, z0)],
    [v(x1, y0, z0), v(x1, y1, z0), v(x1, y1, z1), v(x1, y0, z1)],
  ].map((corners) => ({ surface: "surface.test.box", corners }));
};

/** 볼록 평면 다각형의 면적(3D, m²). */
export const faceArea = (corners: readonly IAutoMovieVector3[]): number => {
  let x = 0, y = 0, z = 0;
  for (let i = 1; i + 1 < corners.length; ++i) {
    const a = corners[0]!, b = corners[i]!, c = corners[i + 1]!;
    const u = [b.x - a.x, b.y - a.y, b.z - a.z], w = [c.x - a.x, c.y - a.y, c.z - a.z];
    x += u[1]! * w[2]! - u[2]! * w[1]!;
    y += u[2]! * w[0]! - u[0]! * w[2]!;
    z += u[0]! * w[1]! - u[1]! * w[0]!;
  }
  return Math.hypot(x, y, z) / 2;
};

/** XZ 다각형 부호 면적(m², CCW 양수). */
export const planArea = (polygon: ReadonlyArray<{ x: number; z: number }>): number => polygon.reduce((sum, a, i) => {
  const b = polygon[(i + 1) % polygon.length]!;
  return sum + a.x * b.z - b.x * a.z;
}, 0) / 2;
