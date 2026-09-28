/** Model scene input tests for explicit prototype, instance, face, and UV binding. */
import type { IAutoMovieModel } from "@automovie/interface";
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { buildHouseScene } from "../viewer/houseScene.cjs";
import {
  type IViewerModelInputs,
  lowerViewerModels,
} from "../viewer/modelScene.cjs";

const model: IAutoMovieModel = {
  id: "sample-window",
  name: null,
  origin: "generated",
  parts: [
    {
      id: "frame",
      name: null,
      geometry: {
        type: "mesh",
        mesh: {
          positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
          normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
          uvs: [0, 0, 1, 0, 0, 1],
          indices: [0, 1, 2],
          skin: null,
        },
      },
      material: null,
      attachedBone: null,
      transform: null,
    },
  ],
  skeleton: null,
  body: null,
  materials: [],
  asset: null,
};

const input = (): IViewerModelInputs => ({
  prototypes: [{ model, faceByPart: { frame: "frame" } }],
  instances: [
    {
      id: "window-1",
      modelId: "sample-window",
      transform: { translation: { x: 2, y: 3, z: 4 } },
    },
  ],
  finishes: {
    frame: {
      color: 0x333333,
      roughness: 0.4,
      metalness: 0,
      texture: "/textures/siding.png",
    },
  },
});

void test("model placement carries face finish and model metric UVs", () => {
  assert.deepEqual(lowerViewerModels({ ...input(), instances: [] }), []);
  const [item] = lowerViewerModels(input());
  assert.equal(item?.id, "window-1/frame");
  assert.equal(item?.modelId, "sample-window");
  assert.equal(item?.faceId, "frame");
  assert.equal(item?.texture, "/textures/siding.png");
  assert.deepEqual(item?.positions, [2, 3, 4, 3, 3, 4, 2, 4, 4]);
  assert.deepEqual(item?.uvs, [0, 0, 1, 0, 0, 1]);
});

void test("house scene accepts an authored model placement input", () => {
  const scene = buildHouseScene("test-source", input());
  assert.equal(
    scene.items.find((item) => item.id === "window-1/frame")?.faceId,
    "frame",
  );
});

void test("model path refuses unresolved identity and texture coordinates", () => {
  const missingModel = input();
  missingModel.instances[0]!.modelId = "unknown";
  assert.throws(() => lowerViewerModels(missingModel), /unknown model/);
  const missingFace = input();
  missingFace.prototypes[0]!.faceByPart = {};
  assert.throws(() => lowerViewerModels(missingFace), /unbound model face/);
  const missingFinish = input();
  missingFinish.finishes = {};
  assert.throws(() => lowerViewerModels(missingFinish), /missing finish/);
  const missingUvs = input();
  const bare = structuredClone(model);
  if (bare.parts[0]!.geometry.type !== "mesh")
    throw new Error("test needs mesh");
  bare.parts[0]!.geometry.mesh.uvs = null;
  missingUvs.prototypes[0]!.model = bare;
  assert.throws(() => lowerViewerModels(missingUvs), /lacks aligned UVs/);
  missingUvs.finishes = {
    frame: { color: 0xffffff, roughness: 1, metalness: 0 },
  };
  assert.throws(() => lowerViewerModels(missingUvs), /lacks aligned UVs/);
  const scaled = input();
  scaled.instances[0]!.transform.scale = { x: 2, y: 1, z: 1 };
  assert.throws(() => lowerViewerModels(scaled), /must keep metric UV scale/);
  const noNormals = input();
  const flat = structuredClone(model);
  if (flat.parts[0]!.geometry.type !== "mesh")
    throw new Error("test needs mesh");
  flat.parts[0]!.geometry.mesh.normals = null;
  noNormals.prototypes[0]!.model = flat;
  assert.throws(() => lowerViewerModels(noNormals), /lacks normals or indices/);
  const primitive = input();
  const box = structuredClone(model);
  box.parts[0]!.geometry = {
    type: "primitive",
    shape: { type: "box", width: 1, height: 1, depth: 1 },
  };
  primitive.prototypes[0]!.model = box;
  primitive.finishes = {
    frame: { color: 0xffffff, roughness: 1, metalness: 0 },
  };
  assert.throws(() => lowerViewerModels(primitive), /lacks aligned UVs/);
});
