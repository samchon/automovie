/** Geometry measurements for the four exterior prototypes in docs/models/15-outdoor.md. */
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { strict as assert } from "node:assert";
import { createRequire } from "node:module";
import { test } from "node:test";

import { EaveDrainage } from "../models/exterior/drainage";
import { AsphaltShingle } from "../models/exterior/shingle";
import { Siding } from "../models/exterior/siding";
import { ExteriorCornerTrim } from "../models/exterior/trim";

const engine = createRequire(import.meta.url)(
  "@automovie/engine",
) as typeof import("@automovie/engine");

const allMeshes = (model: IAutoMovieModel): IAutoMovieMesh[] =>
  model.parts.map((part) => {
    assert.equal(part.geometry.type, "mesh");
    if (part.geometry.type !== "mesh")
      throw new Error(`missing mesh: ${part.id}`);
    return part.geometry.mesh;
  });
const near = (actual: number, expected: number): void =>
  assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} is not ${expected}`);
const coordinate = (mesh: IAutoMovieMesh, axis: 0 | 1 | 2): number[] =>
  mesh.positions.filter((_, i) => i % 3 === axis);
const bounds = (model: IAutoMovieModel, axis: 0 | 1 | 2): [number, number] => {
  const values = allMeshes(model).flatMap((mesh) => coordinate(mesh, axis));
  return [Math.min(...values), Math.max(...values)];
};
const checkMesh = (mesh: IAutoMovieMesh): void => {
  assert.ok(mesh.positions.length > 0);
  assert.equal(mesh.positions.length % 3, 0);
  assert.equal(mesh.normals?.length, mesh.positions.length);
  assert.equal(mesh.uvs?.length, (mesh.positions.length / 3) * 2);
  assert.ok(
    mesh.indices !== null &&
      mesh.indices.length > 0 &&
      mesh.indices.length % 3 === 0,
  );
  assert.ok(
    [...mesh.positions, ...mesh.normals!, ...mesh.uvs!].every(Number.isFinite),
  );
  for (let i = 0; i < mesh.indices!.length; i += 3) {
    const p = mesh
      .indices!.slice(i, i + 3)
      .map((index) => mesh.positions.slice(3 * index, 3 * index + 3));
    const ab = p[1]!.map((v, k) => v - p[0]![k]!);
    const ac = p[2]!.map((v, k) => v - p[0]![k]!);
    const cross = [
      ab[1]! * ac[2]! - ab[2]! * ac[1]!,
      ab[2]! * ac[0]! - ab[0]! * ac[2]!,
      ab[0]! * ac[1]! - ab[1]! * ac[0]!,
    ];
    const n = mesh.normals!.slice(
      3 * mesh.indices![i]!,
      3 * mesh.indices![i]! + 3,
    );
    assert.ok(
      cross.reduce((sum, v, k) => sum + v * n[k]!, 0) > 1e-13,
      `winding or degenerate triangle ${i / 3}`,
    );
  }
};

void test("siding wedge and both roof/opening cut edges retain six named surfaces", () => {
  const modeler = new Siding();
  const { model, faceByPart } = modeler.build({
    id: "east",
    length: 2,
    topLeft: 0.18,
    topRight: 0.12,
    bottomLeft: 0.04,
    bottomRight: 0.02,
  });
  assert.equal(model.parts.length, 6);
  assert.deepEqual(
    new Set(Object.values(faceByPart)),
    new Set([
      "siding-face",
      "siding-butt",
      "siding-back",
      "siding-top",
      "siding-cut",
    ]),
  );
  near(bounds(model, 0)[0], -1);
  near(bounds(model, 0)[1], 1);
  near(bounds(model, 1)[0], 0.02);
  near(bounds(model, 1)[1], 0.18);
  near(bounds(model, 2)[0], 0);
  near(bounds(model, 2)[1], 0.018 - (0.012 * 0.02) / 0.18);
  allMeshes(model).forEach(checkMesh);
  assert.deepEqual(
    modeler.build({
      id: "east",
      length: 2,
      topLeft: 0.18,
      topRight: 0.12,
      bottomLeft: 0.04,
      bottomRight: 0.02,
    }),
    { model, faceByPart },
  );
  const full = modeler.build({ id: "full", length: 1 });
  near(bounds(full.model, 1)[0], 0);
  near(bounds(full.model, 1)[1], 0.18);
  assert.throws(
    () => modeler.build({ id: "bad", length: 0 }),
    /invalid siding length/,
  );
  assert.throws(
    () => modeler.build({ id: "bad", length: 1, bottomLeft: 0.18 }),
    /invalid siding cut/,
  );
  assert.throws(
    () => modeler.build({ id: "bad", length: 1, topRight: 0.19 }),
    /invalid siding cut/,
  );
});

void test("corner trim is one closed L section with a 0.035 m projection", () => {
  const builder = new ExteriorCornerTrim();
  const { model, faceByPart } = builder.build({ id: "front", height: 3 });
  assert.deepEqual(faceByPart, { "exterior-trim": "exterior-trim" });
  assert.equal(model.parts.length, 1);
  for (const axis of [0, 2] as const) {
    near(bounds(model, axis)[0], -0.035);
    near(bounds(model, axis)[1], 0.075);
  }
  near(bounds(model, 1)[0], 0);
  near(bounds(model, 1)[1], 3);
  allMeshes(model).forEach(checkMesh);
  assert.throws(
    () => builder.build({ id: "front", height: NaN }),
    /invalid exterior trim height/,
  );
});

void test("three-tab shingle and starter expose the specified wedge and butt gaps", () => {
  const builder = new AsphaltShingle();
  const strip = builder.buildStrip({ id: "course-0" });
  const starter = builder.buildStrip({ id: "starter", starter: true });
  near(bounds(strip.model, 0)[0], -0.5);
  near(bounds(strip.model, 0)[1], 0.5);
  near(bounds(strip.model, 1)[0], 0);
  near(bounds(strip.model, 1)[1], 0.3);
  near(bounds(strip.model, 2)[0], 0);
  near(bounds(strip.model, 2)[1], 0.01);
  assert.equal(
    Object.values(strip.faceByPart).filter((v) => v === "shingle-butt").length,
    3,
  );
  assert.equal(
    Object.values(starter.faceByPart).filter((v) => v === "shingle-butt")
      .length,
    1,
  );
  assert.ok(strip.model.parts.length > starter.model.parts.length);
  allMeshes(strip.model).forEach(checkMesh);
  allMeshes(starter.model).forEach(checkMesh);
});

void test("roof boundary clipping adds true cut faces without crossing planes", () => {
  const builder = new AsphaltShingle();
  const planes = [
    { x: 1, y: 0, limit: 0.21 },
    { x: 0, y: 1, limit: 0.24 },
    { x: -1, y: -0.4, limit: 0.35 },
  ];
  const { model, faceByPart } = builder.buildStrip({
    id: "valley-edge",
    clipPlanes: planes,
  });
  for (const mesh of allMeshes(model)) {
    checkMesh(mesh);
    for (let i = 0; i < mesh.positions.length; i += 3)
      for (const p of planes)
        assert.ok(
          p.x * mesh.positions[i]! + p.y * mesh.positions[i + 1]! <=
            p.limit + 1e-8,
        );
  }
  near(bounds(model, 0)[1], 0.21);
  near(bounds(model, 1)[1], 0.24);
  assert.ok(Object.values(faceByPart).includes("shingle-cut"));
  assert.throws(
    () =>
      builder.buildStrip({ id: "bad", clipPlanes: [{ x: 0, y: 0, limit: 1 }] }),
    /invalid shingle clipping plane/,
  );
  assert.throws(
    () =>
      builder.buildStrip({
        id: "gone",
        clipPlanes: [{ x: 1, y: 0, limit: -1 }],
      }),
    /clipped away/,
  );
});

void test("ridge and metal flashing variants keep their section bounds and ids", () => {
  const builder = new AsphaltShingle();
  const ridge = builder.buildRidgeCap({
    id: "ridge",
    leftPitch: Math.atan(8 / 12),
    rightPitch: Math.atan(9 / 12),
  });
  const ridgeEnd = builder.buildRidgeCap({
    id: "ridge-end",
    leftPitch: Math.atan(8 / 12),
    rightPitch: Math.atan(9 / 12),
    length: 0.12,
  });
  const valley = builder.buildValleyFlashing({
    id: "valley",
    length: 2,
    leftPitch: Math.atan(8 / 12),
    rightPitch: Math.atan(9 / 12),
  });
  const wall = builder.buildWallFlashing({ id: "wall", length: 1.5 });
  near(bounds(ridge.model, 0)[1], 0.3);
  near(bounds(ridgeEnd.model, 0)[1], 0.12);
  near(bounds(ridge.model, 1)[0], -0.165);
  near(bounds(ridge.model, 1)[1], 0.165);
  near(bounds(valley.model, 0)[1], 2);
  near(bounds(valley.model, 1)[0], -0.1);
  near(bounds(wall.model, 0)[1], 1.5);
  near(bounds(wall.model, 1)[1], 0.12);
  near(bounds(wall.model, 2)[1], 0.15);
  assert.deepEqual(
    new Set(Object.values(valley.faceByPart)),
    new Set(["roof-flashing"]),
  );
  assert.deepEqual(
    new Set(Object.values(wall.faceByPart)),
    new Set(["roof-flashing"]),
  );
  for (const subject of [ridge, valley, wall])
    allMeshes(subject.model).forEach(checkMesh);
  assert.throws(
    () => builder.buildRidgeCap({ id: "bad", leftPitch: 0, rightPitch: 1 }),
    /invalid ridge cap pitch/,
  );
  assert.throws(
    () =>
      builder.buildRidgeCap({
        id: "bad",
        leftPitch: 1,
        rightPitch: 1,
        length: 0.31,
      }),
    /invalid ridge cap pitch/,
  );
  assert.throws(
    () =>
      builder.buildValleyFlashing({
        id: "bad",
        length: 0,
        leftPitch: 1,
        rightPitch: 1,
      }),
    /invalid valley flashing/,
  );
  assert.throws(
    () => builder.buildWallFlashing({ id: "bad", length: 0 }),
    /invalid wall flashing/,
  );
});

void test("gutter has an open top and the selected hollow tube reaches grade offset", () => {
  const builder = new EaveDrainage();
  const bare = builder.buildGutter({ id: "unrouted", length: 2.5 });
  assert.deepEqual(bare.faceByPart, { gutter: "gutter" });
  near(bounds(bare.model, 0)[1], 2.5);
  allMeshes(bare.model).forEach(checkMesh);
  assert.throws(
    () => builder.buildGutter({ id: "invalid", length: 0 }),
    /invalid eave gutter length/,
  );
  const right = builder.build({
    id: "front",
    length: 5,
    eaveToGround: 3,
    wallDepth: -0.45,
    rightClearance: 0.2,
    leftClearance: 0,
  });
  assert.equal(right.outlet, "right");
  assert.deepEqual(right.faceByPart, {
    gutter: "gutter",
    downspout: "downspout",
  });
  near(bounds(right.model, 0)[1], 5);
  near(bounds(right.model, 1)[0], -2.9);
  allMeshes(right.model).forEach(checkMesh);
  const gutter = allMeshes(right.model)[0]!;
  for (let i = 0; i < gutter.positions.length; i += 3) {
    const x = gutter.positions[i]!,
      y = gutter.positions[i + 1]!,
      z = gutter.positions[i + 2]!;
    const n = gutter.normals!.slice(i, i + 3);
    if (
      Math.abs(n[1]!) > 0.99 &&
      Math.abs(y + 0.105) < 1e-8 &&
      x > 4.9200001 &&
      x < 4.9999999
    )
      assert.ok(
        z <= 0.0600001 || z >= 0.1199999,
        "outlet aperture must remain open",
      );
  }
  const left = builder.build({
    id: "rear",
    length: 4,
    eaveToGround: 2.7,
    wallDepth: -0.4,
    rightClearance: 0.14,
    leftClearance: 0.15,
    leftInset: 0.4,
  });
  assert.equal(left.outlet, "left");
  const leftTube = allMeshes(left.model)[1]!;
  near(Math.min(...coordinate(leftTube, 0)), 0.36);
  near(Math.max(...coordinate(leftTube, 0)), 0.44);
  assert.throws(
    () =>
      builder.build({
        id: "blocked",
        length: 4,
        eaveToGround: 3,
        wallDepth: -0.4,
        rightClearance: 0.14,
        leftClearance: 0.14,
      }),
    /no clear downspout end/,
  );
  assert.throws(
    () =>
      builder.build({
        id: "short",
        length: 4,
        eaveToGround: 3,
        wallDepth: -0.1,
        rightClearance: 0.2,
        leftClearance: 0.2,
      }),
    /no 0.20 m elbow depth/,
  );
  assert.throws(
    () =>
      builder.build({
        id: "low",
        length: 4,
        eaveToGround: 0.2,
        wallDepth: -0.4,
        rightClearance: 0.2,
        leftClearance: 0.2,
      }),
    /invalid eave drainage bounds/,
  );
  assert.throws(
    () =>
      builder.build({
        id: "inset",
        length: 4,
        eaveToGround: 3,
        wallDepth: -0.4,
        rightClearance: 0.2,
        leftClearance: 0.2,
        rightInset: 0.02,
      }),
    /invalid eave drainage bounds/,
  );
});

void test("each prototype's complete surface has no accidental open or degenerate edges", () => {
  const shingle = new AsphaltShingle();
  const drainage = new EaveDrainage();
  const complete = [
    new Siding().build({ id: "full", length: 2 }).model,
    new Siding().build({
      id: "cut",
      length: 2,
      topRight: 0.12,
      bottomLeft: 0.03,
    }).model,
    new ExteriorCornerTrim().build({ id: "corner", height: 3 }).model,
    shingle.buildStrip({ id: "tabbed" }).model,
    shingle.buildStrip({
      id: "cut",
      clipPlanes: [{ x: 1, y: 0.3, limit: 0.4 }],
    }).model,
    shingle.buildRidgeCap({ id: "ridge", leftPitch: 0.5, rightPitch: 0.6 })
      .model,
    shingle.buildValleyFlashing({
      id: "valley",
      length: 2,
      leftPitch: 0.5,
      rightPitch: 0.6,
    }).model,
    shingle.buildWallFlashing({ id: "wall", length: 2 }).model,
    drainage.buildGutter({ id: "bare", length: 2 }).model,
  ];
  for (const model of complete) {
    const topology = engine.inspectAutoMovieMeshTopology(
      engine.mergeAutoMovieMeshes(allMeshes(model)),
    );
    assert.equal(topology.degenerate, 0, model.id);
    assert.equal(topology.boundaryEdges, 0, model.id);
    assert.equal(topology.nonManifoldEdges, 0, model.id);
    assert.ok(topology.volume > 0, model.id);
  }
});
