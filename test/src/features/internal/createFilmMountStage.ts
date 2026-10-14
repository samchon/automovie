import { makeStagingWrite } from "./filmFixtures";
import type { IAutoMovieStage } from "@automovie/interface";

/**
 * Build the mount unit's existing horse at the origin, rider at (5,5,5) attached to spine, and camera. The displaced rider makes a missing baked follow observable, while the owning unit independently checks movement and documents its shared FK reference limitation; this constructor itself neither admits the stage nor exercises a visual host.
 */
export const createFilmMountStage: () => IAutoMovieStage = (): IAutoMovieStage =>
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
