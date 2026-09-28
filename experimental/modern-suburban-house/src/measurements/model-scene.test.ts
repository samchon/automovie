/** Model scene input tests for explicit prototype, instance, face, and UV binding. */
import type { IAutoMovieModel } from "@automovie/interface";
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { buildHouseScene } from "../viewer/houseScene.cjs";
import {
  lowerViewerModels,
  type IViewerModelInputs,
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

void test("a material tile module converts model metres into texture repeats", () => {
  const tiled = input();
  tiled.finishes = {
    frame: {
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0,
      texture: "/textures/siding.png",
      textureMetres: [0.25, 0.5],
    },
  };
  assert.deepEqual(lowerViewerModels(tiled)[0]?.uvs, [0, 0, 4, 0, 0, 2]);
  tiled.finishes = {
    frame: { color: 0xffffff, roughness: 0.4, metalness: 0, textureMetres: [0, 1] },
  };
  assert.throws(() => lowerViewerModels(tiled), /invalid texture module/);
});

void test("house scene accepts an authored model placement input", () => {
  const scene = buildHouseScene("test-source", input());
  assert.equal(
    scene.items.find((item) => item.id === "window-1/frame")?.faceId,
    "frame",
  );
});

void test("a glass model face retains its authored physical optics in the scene", () => {
  const glassInput = input();
  glassInput.finishes = {
    frame: {
      color: 0xe8eef0,
      roughness: 0.03,
      metalness: 0,
      transmission: 0.92,
      ior: 1.5,
      thickness: 0.006,
      doubleSided: true,
    },
  };
  const [glass] = lowerViewerModels(glassInput);
  assert.equal(glass?.transmission, 0.92);
  assert.equal(glass?.ior, 1.5);
  assert.equal(glass?.thickness, 0.006);
  assert.equal(glass?.doubleSided, true);
});

void test("a model-qualified finish wins when different prototypes reuse a face id", () => {
  const bound = input();
  bound.finishes = {
    ...bound.finishes,
    "sample-window/frame": {
      color: 0x111111,
      roughness: 0.2,
      metalness: 0.4,
    },
  };
  const [item] = lowerViewerModels(bound);
  assert.equal(item?.color, 0x111111);
  assert.equal(item?.roughness, 0.2);
  assert.equal(item?.metalness, 0.4);
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
