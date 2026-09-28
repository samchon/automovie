/** Section area and hole checks use independent metric fixture dimensions. */
import assert from "node:assert/strict";
import test from "node:test";

import {
  type FittingBuilt,
  FittingParts,
  type FittingPoint,
} from "../models/furnishings/geometry";
import { lowerViewerModels } from "../viewer/modelScene.cjs";
import type { IViewerSceneItem } from "../viewer/scenePayload";
import { sectionCap, sectionCaps } from "../viewer/sectionCaps";

const item = (built: FittingBuilt): IViewerSceneItem =>
  lowerViewerModels({
    prototypes: [built],
    instances: [{ id: "fixture", modelId: built.model.id, transform: {} }],
    finishes: { solid: { color: 0xaaaaaa, roughness: 0.5, metalness: 0 } },
  })[0]!;
const area = (m: IViewerSceneItem): number => {
  let sum = 0;
  for (let i = 0; i < m.indices.length; i += 3) {
    const [a, b, c] = m.indices
      .slice(i, i + 3)
      .map((n) => m.positions.slice(n * 3, n * 3 + 3)) as [
      number[],
      number[],
      number[],
    ];
    const signed =
      ((b[1]! - a[1]!) * (c[2]! - a[2]!) - (b[2]! - a[2]!) * (c[1]! - a[1]!)) /
      2;
    assert.ok(signed > 0);
    sum += signed;
  }
  return sum;
};
void test("a convex section closes its actual area with +X winding and metre UVs", () => {
  const parts = new FittingParts();
  parts.box("box", "solid", [-1, 1, 0, 2, -2, 2]);
  const source = item(parts.finish("box")),
    snapshot = JSON.stringify(source),
    cap = sectionCap(source)!;
  assert.equal(area(cap), 8);
  assert.equal(cap.faceId, "solid");
  assert.equal(cap.inspectionSection, true);
  assert.equal(JSON.stringify(source), snapshot);
  assert.ok(cap.positions.filter((_, i) => i % 3 === 0).every((x) => x === 0));
  for (let i = 0; i < cap.uvs!.length; i += 2) {
    assert.equal(cap.uvs![i], cap.positions[(i / 2) * 3 + 2]);
    assert.equal(cap.uvs![i + 1], cap.positions[(i / 2) * 3 + 1]);
  }
  assert.deepEqual(sectionCap(source), cap);
});
void test("a hollow square tube retains its empty section rather than filling the aperture", () => {
  const parts = new FittingParts(),
    outer = [
      [-2, -2],
      [2, -2],
      [2, 2],
      [-2, 2],
    ] as const,
    inner = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const;
  const point = (x: number, p: readonly [number, number]): FittingPoint => [
    x,
    p[0],
    p[1],
  ];
  parts.mesh("tube", "solid", (q) => {
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4,
        a = outer[i]!,
        b = outer[j]!,
        c = inner[i]!,
        d = inner[j]!,
        n: FittingPoint = [0, b[1] - a[1], a[0] - b[0]];
      q([point(-1, a), point(1, a), point(1, b), point(-1, b)], n);
      q(
        [point(-1, c), point(1, c), point(1, d), point(-1, d)],
        [0, -n[1], -n[2]],
      );
      for (const x of [-1, 1])
        q([point(x, a), point(x, b), point(x, d), point(x, c)], [x, 0, 0]);
    }
  });
  const cap = sectionCap(item(parts.finish("tube")))!;
  assert.equal(area(cap), 12);
  for (let i = 0; i < cap.indices.length; i += 3) {
    const vertices = cap.indices
      .slice(i, i + 3)
      .map((n) => cap.positions.slice(n * 3, n * 3 + 3));
    const cy = vertices.reduce((s, v) => s + v[1]!, 0) / 3,
      cz = vertices.reduce((s, v) => s + v[2]!, 0) / 3;
    assert.ok(Math.abs(cy) >= 1 || Math.abs(cz) >= 1);
  }
});
void test("touching planes emit no fabricated section and an open crossing is refused", () => {
  const parts = new FittingParts();
  parts.box("box", "solid", [0, 1, 0, 1, 0, 1]);
  assert.equal(sectionCap(item(parts.finish("touch"))), undefined);
  const open = {
    ...item(parts.finish("open")),
    positions: [-1, 0, 0, 1, 0, 0, 1, 1, 0],
    indices: [0, 1, 2],
  };
  assert.throws(() => sectionCap(open), /open section/);
});
void test("a material-partitioned shell closes across real shared edges and reports its contributors", () => {
  const parts = new FittingParts();
  parts.box("box", "solid", [-1, 1, 0, 2, -2, 2]);
  const source = item(parts.finish("partitioned")),
    split = Array.from({ length: 6 }, (_, i) => ({
      ...source,
      id: `face-${i}`,
      faceId: `surface-${i}`,
      positions: source.positions.slice(i * 12, i * 12 + 12),
      indices: [0, 1, 2, 0, 2, 3],
    }));
  const caps = sectionCaps(split);
  assert.equal(caps.length, 1);
  assert.equal(area(caps[0]!), 8);
  assert.equal(caps[0]!.sectionSourceFaces!.length, 6);
  assert.equal(sectionCaps([]).length, 0);
  assert.throws(() => sectionCaps(split.slice(0, 1)), /open section/);
  assert.throws(
    () =>
      sectionCaps(
        split.map((face, i) => ({ ...face, assemblyMember: String(i % 2) })),
      ),
    /open section/,
  );
});
void test("roundoff zero is one endpoint identity and touching closed solids remain separate", () => {
  const parts = new FittingParts();
  parts.box("first", "solid", [-1, 1, 0, 2, -2, 2]);
  const source = item(parts.finish("first"));
  const noisy = {
    ...source,
    positions: source.positions.map((n, i) =>
      i % 3 === 2 && n === -2 ? n + 1e-12 : n,
    ),
  };
  assert.ok(Math.abs(area(sectionCap(noisy)!) - 8) < 1e-10);
  const second = {
    ...source,
    id: "second",
    positions: source.positions.map((n, i) => (i % 3 === 1 ? n + 2 : n)),
  };
  assert.equal(sectionCaps([source, second]).length, 2);
});
void test("two closed contours meeting at one section vertex stay two filled islands", () => {
  const parts = new FittingParts();
  parts.box("box", "solid", [-1, 1, 0, 2, -2, 2]);
  const source = item(parts.finish("touching-islands")),
    other = source.positions.map((n, i) =>
      i % 3 === 1 ? n + 2 : i % 3 === 2 ? n + 4 : n,
    ),
    offset = source.positions.length / 3;
  const merged = {
    ...source,
    positions: [...source.positions, ...other],
    indices: [...source.indices, ...source.indices.map((i) => i + offset)],
  };
  assert.equal(area(sectionCap(merged)!), 16);
});
void test("opposite touching interfaces cancel despite different triangle seam endpoints", () => {
  const parts = new FittingParts();
  parts.box("box", "solid", [-1, 1, 0, 2, -2, 2]);
  const source = item(parts.finish("seams")),
    other = source.positions.map((n, i) =>
      i % 3 === 1 ? n + 2 : i % 3 === 0 ? n + 0.4 : n,
    ),
    offset = source.positions.length / 3;
  const merged = {
    ...source,
    positions: [...source.positions, ...other],
    indices: [...source.indices, ...source.indices.map((i) => i + offset)],
  };
  assert.ok(Math.abs(area(sectionCap(merged)!) - 16) < 1e-9);
});
void test("material patch T-junctions close without changing the source shell", () => {
  const parts = new FittingParts();
  parts.box("box", "solid", [-1, 1, 0, 2, -2, 2]);
  const source = item(parts.finish("subdivided-patch"));
  const split = Array.from({ length: 6 }, (_, i) => ({
    ...source,
    id: `face-${i}`,
    positions: source.positions.slice(i * 12, i * 12 + 12),
    indices: [0, 1, 2, 0, 2, 3],
  }));
  const selected = split.find(
    (face) => face.positions[0] !== face.positions[3],
  )!;
  const p = Array.from({ length: 4 }, (_, i) =>
    selected.positions.slice(i * 3, i * 3 + 3),
  );
  const at = (u: number, v: number) =>
    p[0]!.map((n, i) => n + u * (p[1]![i]! - n) + v * (p[3]![i]! - n));
  selected.positions = [];
  selected.indices = [];
  for (const u of [0, 0.5])
    for (const v of [0, 0.5]) {
      const offset = selected.positions.length / 3;
      selected.positions.push(
        ...at(u, v),
        ...at(u + 0.5, v),
        ...at(u + 0.5, v + 0.5),
        ...at(u, v + 0.5),
      );
      selected.indices.push(
        offset,
        offset + 1,
        offset + 2,
        offset,
        offset + 2,
        offset + 3,
      );
    }
  const before = JSON.stringify(split),
    caps = sectionCaps(split);
  assert.equal(caps.length, 1);
  assert.equal(area(caps[0]!), 8);
  assert.equal(JSON.stringify(split), before);
  assert.throws(
    () => sectionCaps(split.filter((face) => face !== selected)),
    /open section/,
  );
  // A repeated seam endpoint adds a collapsed triangle without changing the
  // welded shell. It must neither open the contour nor invent another cap.
  const seam = { ...source, indices: [...source.indices, 0, 0, 0] };
  assert.equal(area(sectionCaps([seam])[0]!), 8);
  assert.equal(
    sectionCaps([{ ...source, positions: [0, 0, 0], indices: [0, 0, 0] }])
      .length,
    0,
  );
});
