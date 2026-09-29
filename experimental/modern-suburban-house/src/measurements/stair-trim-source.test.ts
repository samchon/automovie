/** Geometry checks for the authored stair infill, side skirts and wall trim. */
import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { Baseboard } from "../models/interior/baseboard";
import { StairBaluster } from "../models/stair-baluster";
import { StairSkirt } from "../models/stair-skirt";

const meshOf = (part: IAutoMovieModelPart): IAutoMovieMesh => {
  assert.equal(part.geometry.type, "mesh");
  if (part.geometry.type !== "mesh")
    throw new Error(`missing mesh: ${part.id}`);
  return part.geometry.mesh;
};
const range = (
  mesh: IAutoMovieMesh,
  axis: number,
): readonly [number, number] => {
  const values = mesh.positions.filter((_, i) => i % 3 === axis);
  return [Math.min(...values), Math.max(...values)];
};
const close = (actual: number, expected: number): void =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const verifyTriangles = (mesh: IAutoMovieMesh): void => {
  assert.equal(mesh.positions.length % 3, 0);
  assert.equal(mesh.normals?.length, mesh.positions.length);
  assert.equal(mesh.uvs?.length, (mesh.positions.length / 3) * 2);
  assert.equal(mesh.indices!.length % 3, 0);
  for (let i = 0; i < mesh.indices!.length; i += 3) {
    const p = mesh.positions;
    const ai = mesh.indices![i]! * 3,
      bi = mesh.indices![i + 1]! * 3,
      ci = mesh.indices![i + 2]! * 3;
    const a = [p[ai]!, p[ai + 1]!, p[ai + 2]!],
      b = [p[bi]!, p[bi + 1]!, p[bi + 2]!],
      c = [p[ci]!, p[ci + 1]!, p[ci + 2]!];
    const u = b.map((v, j) => v - a[j]!),
      v = c.map((q, j) => q - a[j]!);
    const cross = [
      u[1]! * v[2]! - u[2]! * v[1]!,
      u[2]! * v[0]! - u[0]! * v[2]!,
      u[0]! * v[1]! - u[1]! * v[0]!,
    ];
    const dot = cross.reduce(
      (sum, n, j) => sum + n * mesh.normals![ai + j]!,
      0,
    );
    assert.ok(dot > 0, `reversed or degenerate triangle ${i / 3}`);
  }
};

void test("stair infill fills lower, upper and hall spans at the reviewed count and height", () => {
  const { model, faceByPart } = new StairBaluster().build();
  assert.equal(model.parts.length, 77); // 15 lower, 32 upper, 1 rail, 29 hall.
  assert.equal(Object.keys(faceByPart).length, model.parts.length);
  assert.equal(model.parts.filter((p) => p.id.startsWith("lower-")).length, 15);
  assert.equal(model.parts.filter((p) => p.id.startsWith("upper-")).length, 32);
  assert.equal(model.parts.filter((p) => p.id.startsWith("hall-")).length, 30);
  const rail = model.parts.find((p) => p.id === "hall-bottom-rail")!;
  assert.equal(faceByPart[rail.id], "bottom-rail");
  close(range(meshOf(rail), 0)[0], -1.725);
  close(range(meshOf(rail), 0)[1], 1.795);
  close(range(meshOf(rail), 1)[0], 3.11);
  close(range(meshOf(rail), 1)[1], 3.15);
  for (const part of model.parts) {
    verifyTriangles(meshOf(part));
    if (part.id !== "hall-bottom-rail")
      assert.equal(faceByPart[part.id], "baluster");
  }
  const lower = model.parts.filter((part) => part.id.startsWith("lower-"));
  const lowerRanges = lower.map((part) => range(meshOf(part), 2));
  close(-1.525 - lowerRanges[0]![1], (1.885 - 15 * 0.02) / 16);
  for (let i = 1; i < lowerRanges.length; i++) {
    const gap = lowerRanges[i - 1]![0] - lowerRanges[i]![1];
    assert.ok(gap > 0 && gap <= 0.1);
  }
  const hall = model.parts.filter((part) => /^hall-\d+$/.test(part.id));
  const hallRanges = hall.map((part) => range(meshOf(part), 0));
  close(hallRanges[0]![0] + 1.725, 0.098);
  for (let i = 1; i < hallRanges.length; i++)
    close(hallRanges[i]![0] - hallRanges[i - 1]![1], 0.098);
  const firstLower = meshOf(lower[0]!);
  // Four side faces keep the 0.02 m square's perimeter V across seams.
  close(firstLower.uvs![2 * 1 + 1]!, firstLower.uvs![2 * 8 + 1]!);
  close(firstLower.uvs![2 * 9 + 1]!, firstLower.uvs![2 * 4 + 1]!);
  const upperLast = meshOf(model.parts.find((p) => p.id === "upper-8-4")!);
  close(range(upperLast, 1)[0], 2.72);
  close(range(upperLast, 1)[1], 2.75);
  const hallFirst = meshOf(model.parts.find((p) => p.id === "hall-1")!);
  close(range(hallFirst, 1)[0], 3.15);
  close(range(hallFirst, 1)[1], 4.035);
});

void test("stair skirts close three outward plates at the landing and ceiling", () => {
  const { model, faceByPart } = new StairSkirt().build();
  assert.deepEqual(
    model.parts.map((p) => p.id),
    ["lower-skirt", "upper-skirt", "landing-corner-skirt"],
  );
  assert.deepEqual(Object.values(faceByPart), [
    "stair-skirt",
    "stair-skirt",
    "stair-skirt",
  ]);
  for (const part of model.parts) verifyTriangles(meshOf(part));
  const lower = meshOf(model.parts[0]!);
  close(range(lower, 0)[0], -0.65);
  close(range(lower, 0)[1], -0.635);
  close(range(lower, 2)[0], -3.395);
  close(range(lower, 2)[1], -1.45);
  const upper = meshOf(model.parts[1]!);
  close(range(upper, 0)[0], -0.635);
  close(range(upper, 0)[1], -0.65 + ((2.75 - 1.46) * 0.28) / 0.17);
  close(range(upper, 1)[1], 2.75);
  close(range(upper, 2)[0], -3.41);
  close(range(upper, 2)[1], -3.395);
  const corner = meshOf(model.parts[2]!);
  close(range(corner, 0)[0], -0.65);
  close(range(corner, 0)[1], -0.635);
  close(range(corner, 2)[0], -3.41);
  close(range(corner, 2)[1], -3.395);
});

void test("baseboard sweeps one closed pentagonal run with metric UV and optional miters", () => {
  const builder = new Baseboard();
  for (const [startMiter, endMiter] of [
    [0, 0],
    [1, -1],
    [-1, 1],
  ] as const) {
    const { model, faceByPart } = builder.build({
      id: `run-${startMiter}-${endMiter}`,
      length: 2,
      startMiter,
      endMiter,
    });
    assert.equal(model.parts.length, 1);
    assert.equal(faceByPart.run, "wall-baseboard");
    const mesh = meshOf(model.parts[0]!);
    verifyTriangles(mesh);
    assert.equal(mesh.indices?.length, 48); // Five rectangular sides and two pentagonal caps.
    close(range(mesh, 1)[0], 0);
    close(range(mesh, 1)[1], 0.1);
    close(range(mesh, 2)[0], 0);
    close(range(mesh, 2)[1], 0.015);
    close(range(mesh, 0)[0], Math.min(0, startMiter * 0.015));
    close(range(mesh, 0)[1], Math.max(2, 2 + endMiter * 0.015));
    assert.deepEqual(
      builder.build({
        id: `run-${startMiter}-${endMiter}`,
        length: 2,
        startMiter,
        endMiter,
      }),
      { model, faceByPart },
    );
  }
  assert.throws(
    () => builder.build({ id: "", length: 2 }),
    /invalid baseboard run/,
  );
  assert.throws(
    () => builder.build({ id: "zero", length: 0 }),
    /invalid baseboard run/,
  );
  assert.throws(
    () => builder.build({ id: "nan", length: Number.NaN }),
    /invalid baseboard run/,
  );
  assert.throws(
    () =>
      builder.build({
        id: "crossed",
        length: 0.02,
        startMiter: 1,
        endMiter: -1,
      }),
    /invalid baseboard run/,
  );
});
