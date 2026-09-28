/** The finite inspection plan preserves real metre geometry and face provenance. */
import assert from "node:assert/strict";
import test from "node:test";
import { OrthographicCamera, PerspectiveCamera, Vector3 } from "three";

import { Frame } from "../models/frame";
import {
  type FittingBuilt,
  FittingParts,
} from "../models/furnishings/geometry";
import { SanitaryFittings } from "../models/furnishings/sanitary-fittings";
import { ServiceRooms } from "../models/furnishings/service-rooms";
import type { IViewerModelInputs } from "../viewer/modelScene.cjs";

const input = (built: FittingBuilt): IViewerModelInputs => ({
  prototypes: [built],
  instances: [],
  finishes: Object.fromEntries(
    Object.values(built.faceByPart).map((f) => [
      f,
      { color: 0xababab, roughness: 0.4, metalness: 0.1 },
    ]),
  ),
});

void test("front orthographic review preserves height, UVs, face identities and the full human scale", () => {
  const built = new SanitaryFittings().toilet(),
    scene = new Frame().build(
      input(built),
      built.model.id,
      "front",
      false,
      "basis",
    );
  assert.equal(scene.camera.orthographicSpan, 1.9 * 1.2);
  assert.equal(scene.camera.target[1], 1.9 / 2);
  assert.ok(scene.camera.target[1] - scene.camera.orthographicSpan / 2 < 0);
  assert.equal(scene.sectionX, undefined);
  const parts = scene.items.filter((i) => i.role === "model");
  assert.equal(parts.length, built.model.parts.length);
  for (const [j, part] of parts.entries()) {
    const source = built.model.parts[j]!.geometry;
    assert.equal(source.type, "mesh");
    if (source.type !== "mesh") throw Error(part.id);
    assert.deepEqual(part.uvs, source.mesh.uvs);
    assert.equal(part.faceId, built.faceByPart[built.model.parts[j]!.id]);
    assert.equal(part.inspectionFace, undefined);
  }
  const human = scene.items.find((i) => i.role === "reference")!,
    ys = human.positions.filter((_, i) => i % 3 === 1);
  assert.equal(Math.max(...ys) - Math.min(...ys), 1.9);
});

void test("the world-anchored slab uses its authored front yaw while overlay changes only appearance", () => {
  const built = new ServiceRooms().laundryTop(),
    frames = new Frame();
  const actual = frames.build(
      input(built),
      built.model.id,
      "front",
      false,
      "b",
    ),
    overlay = frames.build(input(built), built.model.id, "front", true, "b");
  for (const [j, item] of actual.items.entries()) {
    const marked = overlay.items[j]!;
    assert.deepEqual(marked.positions, item.positions);
    assert.deepEqual(marked.normals, item.normals);
    assert.deepEqual(marked.uvs, item.uvs);
    if (item.role === "model") {
      assert.equal(marked.inspectionFace, true);
      assert.equal(marked.transmission, 0);
    }
  }
  const top = actual.items.find((i) => i.faceId === "top")!,
    xs = top.positions.filter((_, i) => i % 3 === 0);
  assert.ok(Math.abs(Math.max(...xs) - Math.min(...xs) - 1.3) < 1e-10);
  const colors = new Map(
    overlay.items
      .filter((i) => i.role === "model")
      .map((i) => [i.faceId, i.color]),
  );
  assert.equal(new Set(colors.values()).size, colors.size);
});

void test("side section keeps the entire scale body behind its plane and diagonal uses the 1.6m eye", () => {
  const built = new SanitaryFittings().toilet(),
    f = new Frame(),
    i = input(built);
  const side = f.build(i, built.model.id, "side", false, "b");
  assert.equal(side.sectionX, 0);
  assert.ok(side.camera.orthographicSpan);
  const human = side.items.find((p) => p.role === "reference")!;
  assert.ok(human.positions.filter((_, j) => j % 3 === 0).every((x) => x < 0));
  const diagonal = f.build(i, built.model.id, "diagonal", false, "b");
  assert.equal(diagonal.camera.position[1], 1.6);
  assert.equal(diagonal.camera.fovDeg, 45);
  assert.equal(diagonal.camera.orthographicSpan, undefined);
  const camera = new PerspectiveCamera(
    45,
    1536 / 1024,
    diagonal.camera.near,
    diagonal.camera.far,
  );
  camera.position.set(...diagonal.camera.position);
  camera.lookAt(...diagonal.camera.target);
  camera.updateMatrixWorld();
  for (const part of diagonal.items)
    for (let k = 0; k < part.positions.length; k += 3) {
      const p = new Vector3(
        part.positions[k]!,
        part.positions[k + 1]!,
        part.positions[k + 2]!,
      ).project(camera);
      assert.ok(
        Math.abs(p.x) <= 0.9 && Math.abs(p.y) <= 0.9 && Math.abs(p.z) < 1,
        `clipped source vertex: ${part.id}`,
      );
    }
});

void test("review refuses an unknown or empty model instead of producing an empty success", () => {
  const built = new SanitaryFittings().toilet(),
    f = new Frame();
  assert.throws(
    () => f.build(input(built), "absent", "front", false, "b"),
    /unknown review model/,
  );
  const empty = { ...built, model: { ...built.model, parts: [] } };
  assert.throws(
    () => f.build(input(empty), built.model.id, "front", false, "b"),
    /empty review model/,
  );
});

void test("orthographic views fit a broad and deep solid plus its full scale reference", () => {
  const parts = new FittingParts();
  parts.box("wide-deep", "solid", [-1.15, 1.15, 0, 2.3, -1.5, 1.5]);
  const built = parts.finish("wide-deep"),
    basis = JSON.stringify(built);
  for (const view of ["front", "side"] as const) {
    const scene = new Frame().build(
      input(built),
      built.model.id,
      view,
      false,
      "basis",
    );
    const half = scene.camera.orthographicSpan! / 2;
    const camera = new OrthographicCamera(
      -half * 1.5,
      half * 1.5,
      half,
      -half,
      scene.camera.near,
      scene.camera.far,
    );
    camera.position.set(...scene.camera.position);
    camera.lookAt(...scene.camera.target);
    camera.updateMatrixWorld();
    for (const part of scene.items)
      for (let k = 0; k < part.positions.length; k += 3) {
        const p = new Vector3(
          part.positions[k]!,
          part.positions[k + 1]!,
          part.positions[k + 2]!,
        ).project(camera);
        assert.ok(
          Math.abs(p.x) <= 0.9 + 1e-12 &&
            Math.abs(p.y) <= 0.9 + 1e-12 &&
            Math.abs(p.z) < 1,
          part.id,
        );
      }
  }
  assert.equal(JSON.stringify(built), basis);
});
