import { makeStagingWrite } from "./filmFixtures";

/** Preserve the mount scenario's existing staging input and authored values. */
export const createFilmMountStage = () =>
  makeStagingWrite({
    scene: { id: "scene-ride", name: "the ride" },
    actors: [
      { node: "horse", position: { x: 0, y: 0, z: 0 }, facingDeg: 0 },
      {
        node: "rider",
        position: { x: 5, y: 5, z: 5 },
        facingDeg: 0,
        attach: { parent: "horse", bone: "spine" },
      },
    ],
    cameras: [
      {
        node: "cam",
        position: { x: 3, y: 2, z: 3 },
        lookAt: { kind: "node", node: "horse" },
        fovDeg: 45,
        near: 0.1,
        far: 1000,
        depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
      },
    ],
  });
