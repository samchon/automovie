import { makeStagingWrite } from "./filmFixtures";

/** Preserve the attach scenario's existing staging input and authored values. */
export const createFilmAttachStage = () =>
  makeStagingWrite({
    actors: [
      { node: "knight", position: { x: 0, y: 0, z: 0 }, facingDeg: 0 },
      { node: "sword", position: { x: 0.75, y: 1.4, z: 0 }, facingDeg: 0 },
      { node: "shield", position: { x: 0, y: 1.4, z: 0 }, facingDeg: 0 },
    ],
    cameras: [
      {
        node: "cam-main",
        position: { x: 3, y: 1.6, z: 3 },
        lookAt: { kind: "node", node: "knight" },
        fovDeg: 45,
        near: 0.1,
        far: 1000,
        depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
      },
    ],
  });
