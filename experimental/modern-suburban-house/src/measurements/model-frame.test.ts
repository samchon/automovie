/**
 * Test Frame with actual toilet/laundry prototypes and a deliberately broad box.
 * node:test compares source UVs and face IDs, the 1.9 m occupancy reference, overlay
 * geometry, section metadata, and Three camera projections at 1536/1024 aspect with
 * a 0.9 screen margin. Unknown/empty models must throw. Projection checks exercise
 * camera math, not rasterization, clipping pixels, visual fidelity or every model.
 * Fixtures and cameras stay in process memory; no WebGL context or renderer is made,
 * and synchronous producer/assertion failures are reported by the test runner.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { OrthographicCamera, PerspectiveCamera, Vector3 } from "three";

import { Frame } from "../models/Frame";
import {
  FittingParts,
} from "../models/furnishings/FittingParts";
import { type FittingBuilt } from "../models/furnishings/FittingBuilt";
import { SanitaryFittings } from "../models/furnishings/SanitaryFittings";
import { ServiceRooms } from "../models/furnishings/ServiceRooms";
import type { IViewerModelInputs } from "../viewer/IViewerModelInputs";
import type { IViewerScene } from "../viewer/IViewerScene";
import type { IViewerSceneItem } from "../viewer/IViewerSceneItem";

const input: (built: FittingBuilt) => IViewerModelInputs = (built: FittingBuilt): IViewerModelInputs => ({
  prototypes: [built],
  instances: [],
  finishes: Object.fromEntries(
    Object.values(built.faceByPart).map((f: string) : [string, { color: number; roughness: number; metalness: number; }] => [
      f,
      { color: 0xababab, roughness: 0.4, metalness: 0.1 },
    ]),
  ),
});

void test("front orthographic review preserves height, UVs, face identities and the full human scale", () : void => {
  const built: FittingBuilt = new SanitaryFittings().toilet(),
    scene: IViewerScene = new Frame().build(
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
  const parts: IViewerSceneItem[] = scene.items.filter((i: IViewerSceneItem) : boolean => i.role === "model");
  assert.equal(parts.length, built.model.parts.length);
  for (const [j, part] of parts.entries()) {
    const source: import("@automovie/interface").IAutoMovieGeometry = built.model.parts[j]!.geometry;
    assert.equal(source.type, "mesh");
    if (source.type !== "mesh") throw new Error(part.id);
    assert.deepEqual(part.uvs, source.mesh.uvs);
    assert.equal(part.faceId, built.faceByPart[built.model.parts[j]!.id]);
    assert.equal(part.inspectionFace, undefined);
  }
  const human: IViewerSceneItem = scene.items.find((i: IViewerSceneItem) : boolean => i.role === "reference")!,
    ys: number[] = human.positions.filter((_: number, i: number) : boolean => i % 3 === 1);
  assert.equal(Math.max(...ys) - Math.min(...ys), 1.9);
});

void test("the world-anchored slab uses its authored front yaw while overlay changes only appearance", () : void => {
  const built: FittingBuilt = new ServiceRooms().laundryTop(),
    frames: Frame = new Frame();
  const actual: IViewerScene = frames.build(
      input(built),
      built.model.id,
      "front",
      false,
      "b",
    ),
    overlay: IViewerScene = frames.build(input(built), built.model.id, "front", true, "b");
  for (const [j, item] of actual.items.entries()) {
    const marked: IViewerSceneItem = overlay.items[j]!;
    assert.deepEqual(marked.positions, item.positions);
    assert.deepEqual(marked.normals, item.normals);
    assert.deepEqual(marked.uvs, item.uvs);
    if (item.role === "model") {
      assert.equal(marked.inspectionFace, true);
      assert.equal(marked.transmission, 0);
    }
  }
  const top: IViewerSceneItem = actual.items.find((i: IViewerSceneItem) : boolean => i.faceId === "top")!,
    xs: number[] = top.positions.filter((_: number, i: number) : boolean => i % 3 === 0);
  assert.ok(Math.abs(Math.max(...xs) - Math.min(...xs) - 1.3) < 1e-10);
  const colors: Map<string | undefined, number> = new Map(
    overlay.items
      .filter((i: IViewerSceneItem) : boolean => i.role === "model")
      .map((i: IViewerSceneItem) : [string | undefined, number] => [i.faceId, i.color]),
  );
  assert.equal(new Set(colors.values()).size, colors.size);
});

void test("side section keeps the entire scale body behind its plane and diagonal uses the 1.6m eye", () : void => {
  const built: FittingBuilt = new SanitaryFittings().toilet(),
    f: Frame = new Frame(),
    i: IViewerModelInputs = input(built);
  const side: IViewerScene = f.build(i, built.model.id, "side", false, "b");
  assert.equal(side.sectionX, 0);
  assert.ok(side.camera.orthographicSpan);
  const human: IViewerSceneItem = side.items.find((p: IViewerSceneItem) : boolean => p.role === "reference")!;
  assert.ok(human.positions.filter((_: number, j: number) : boolean => j % 3 === 0).every((x: number) : boolean => x < 0));
  const diagonal: IViewerScene = f.build(i, built.model.id, "diagonal", false, "b");
  assert.equal(diagonal.camera.position[1], 1.6);
  assert.equal(diagonal.camera.fovDeg, 45);
  assert.equal(diagonal.camera.orthographicSpan, undefined);
  const camera: PerspectiveCamera = new PerspectiveCamera(
    45,
    1536 / 1024,
    diagonal.camera.near,
    diagonal.camera.far,
  );
  camera.position.set(...diagonal.camera.position);
  camera.lookAt(...diagonal.camera.target);
  camera.updateMatrixWorld();
  for (const part of diagonal.items)
    for (let k: number = 0; k < part.positions.length; k += 3) {
      const p: Vector3 = new Vector3(
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

void test("review refuses an unknown or empty model instead of producing an empty success", () : void => {
  const built: FittingBuilt = new SanitaryFittings().toilet(),
    f: Frame = new Frame();
  assert.throws(
    () : IViewerScene => f.build(input(built), "absent", "front", false, "b"),
    /unknown review model/,
  );
  const empty: typeof built = { ...built, model: { ...built.model, parts: [] } };
  assert.throws(
    () : IViewerScene => f.build(input(empty), built.model.id, "front", false, "b"),
    /empty review model/,
  );
});

void test("orthographic views fit a broad and deep solid plus its full scale reference", () : void => {
  const parts: FittingParts = new FittingParts();
  parts.box("wide-deep", "solid", [-1.15, 1.15, 0, 2.3, -1.5, 1.5]);
  const built: FittingBuilt = parts.finish("wide-deep"),
    basis: string = JSON.stringify(built);
  for (const view of ["front", "side"] as const) {
    const scene: IViewerScene = new Frame().build(
      input(built),
      built.model.id,
      view,
      false,
      "basis",
    );
    const half: number = scene.camera.orthographicSpan! / 2;
    const camera: OrthographicCamera = new OrthographicCamera(
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
      for (let k: number = 0; k < part.positions.length; k += 3) {
        const p: Vector3 = new Vector3(
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
