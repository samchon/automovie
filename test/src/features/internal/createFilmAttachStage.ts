import { IAutoMovieStage } from "@automovie/interface";

import { makeStagingWrite } from "./filmFixtures";

/** Create the existing knight/sword/shield placements and main-camera input through makeStagingWrite, keeping positions, facing, lens and depth precision values unchanged. The attachment case passes this data to the real stageScene gate. */
export const createFilmAttachStage: () => IAutoMovieStage =
  (): IAutoMovieStage =>
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
