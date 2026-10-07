import { performShot, stageScene } from "@automovie/engine";
import type { IAutoMovieModel, IAutoMovieClip } from "@automovie/interface";
import { makeScriptWrite, makeStagingWrite, makePerformanceWrite, validSynthesizer } from "./filmFixtures";

/** Preserve the full shot consumer for the existing facade subject. */
export const performFilmFacade = (model: IAutoMovieModel, FOV_Y: number): IAutoMovieClip | null => {
  const script = makeScriptWrite({
    cast: [
      { node: "west-facade", character: "the west facade", modelRef: model.id },
    ],
    beats: [
      {
        id: "beat-1",
        name: "the approach",
        summary: "the facade holds the frame",
        durationHint: 2,
      },
    ],
  });
  const staged = stageScene(
    script,
    makeStagingWrite({
      actors: [
        { node: "west-facade", position: { x: 0, y: 0, z: 0 }, facingDeg: 0 },
      ],
      cameras: [
        {
          node: "cam",
          position: { x: 0, y: 2, z: 200 },
          lookAt: { kind: "node", node: "west-facade" },
          fovDeg: FOV_Y,
          near: 0.1,
          far: 1000,
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
        },
      ],
    }),
  );
  if (staged.success !== true) throw new Error("staging fixture must succeed");
  const result = performShot({
    script,
    staged,
    performance: makePerformanceWrite({
      beat: "beat-1",
      draft: [
        {
          verb: "frame",
          actor: "cam",
          start: 0,
          duration: "auto",
          framing: "full",
          move: "static",
          on: { kind: "node", node: "west-facade" },
        },
      ],
      revise: { review: "the facade reads.", final: null },
      duration: 2,
    }),
    synthesize: validSynthesizer,
    // A set piece carries no rig, which is why its height had to be measured
    // from geometry in the first place.
    skeleton: () => null,
    models: [model],
    frameFormat: { width: 1920, height: 1080 },
  });
  return result.success === true ? result.shot.cameraMotion : null;
};
