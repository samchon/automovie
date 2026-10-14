import type { IAutoMovieStage } from "@automovie/interface";

/** Authored pursuit-film staging; the runtime compiles this tracked example unchanged. */
export const staging: IAutoMovieStage = {
  scene: { id: "scene-pursuit", name: "the pursuit" },
  plan: "walker starts 2.95 m behind the waiter, both facing +Z; a 12 × 10 m floor carries the walk, a low wall closes the far side; the camera stands side-on and follows the walker in.",
  actors: [
    { node: "walker", position: { x: 0, y: 0, z: -2.4 }, facingDeg: 0 },
    { node: "waiter", position: { x: 0, y: 0, z: 0.55 }, facingDeg: 0 },
  ],
  // Set pieces (#1173): one unit box model resized per placement. The wall,
  // crate, and physical floor slab are the SAME `block` model at three sizes,
  // which is the point of `scale`.
  set: [
    {
      node: "floor-slab",
      model: "block",
      position: { x: 0, y: -0.05, z: 0 },
      scale: { x: 12, y: 0.1, z: 10 },
    },
    {
      node: "wall-back",
      model: "block",
      position: { x: 0, y: 0.9, z: -4.6 },
      scale: { x: 12, y: 1.8, z: 0.24 },
    },
    {
      node: "crate",
      model: "block",
      position: { x: -1.6, y: 0.25, z: -1.2 },
      facingDeg: 24,
      scale: 0.5,
    },
  ],
  // The space is the floor's MEANING: one walkable patch under the whole walk.
  // `buildSpaceObject` carries it into every structural guide pass but writes no
  // beauty colour or depth; the explicit slab above is the visible floor.
  space: {
    id: "space-pursuit",
    surfaces: [
      {
        id: "floor",
        kind: "floor",
        polygon: [
          { x: -6, y: 0, z: -5 },
          { x: 6, y: 0, z: -5 },
          { x: 6, y: 0, z: 5 },
          { x: -6, y: 0, z: 5 },
        ],
        anchor: { x: 0, y: 0, z: 0 },
        rampTo: null,
      },
    ],
    walkable: ["floor"],
  },
  cameras: [
    {
      node: "cam-main",
      position: { x: 2.2, y: 1.4, z: -0.8 },
      lookAt: { kind: "node", node: "walker" },
      fovDeg: 40,
      near: 0.1,
      far: 1000,
      depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 0.6 },
    },
  ],
  lights: [
    {
      node: "sun",
      role: "sun",
      direction: { x: -1, y: -1.4, z: 0.4 },
      intensity: 1.4,
    },
  ],
};
