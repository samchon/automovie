import {
  performShot,
  stageScene,
  type IAutoMoviePerformedShot,
} from "@automovie/engine";

import type { IAutoMovieActionCall, IAutoMovieVector3 } from "@automovie/interface";

import { makeScriptWrite, makeStagingWrite, makePerformanceWrite, validSynthesizer } from "./filmFixtures";
import { createSkeleton } from "./fixtures";

const script = makeScriptWrite();

/**
 * The duel, plus the two things the old lookup could not see: a set piece and a
 * second camera. `cam-main` frames, `cam-side` stands in as a thing to point
 * at.
 */
const staging = makeStagingWrite({
  set: [
    { node: "altar", model: "box", position: { x: 1, y: 0, z: 1 } },
    { node: "pebble", model: "sphere", position: { x: 0, y: 1.2, z: 0 } },
  ],
  cameras: [
    {
      node: "cam-main",
      position: { x: 2, y: 1.5, z: 0.35 },
      lookAt: { kind: "node", node: "knightA" },
      fovDeg: 40,
      near: 0.1,
      far: 1000,
      depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
    },
    {
      node: "cam-side",
      position: { x: -2, y: 1.5, z: 0.35 },
      lookAt: { kind: "node", node: "knightB" },
      fovDeg: 40,
      near: 0.1,
      far: 1000,
      depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
    },
  ],
});

/** Create the existing staged draft consumer with its optional live target and carried beat-end readers. */
export const createFilmPositionalTargetPerformer = (
  targetAt?: Parameters<typeof performShot>[0]["targetAt"],
  previous?: Parameters<typeof performShot>[0]["previous"],
  actorPosition?: IAutoMovieVector3,
): ((draft: IAutoMovieActionCall[]) => IAutoMoviePerformedShot) => {
  const staged = stageScene(
    script,
    actorPosition === undefined
      ? staging
      : {
          ...staging,
          actors: staging.actors.map((actor) =>
            actor.node === "knightA"
              ? { ...actor, position: actorPosition }
              : actor,
          ),
        },
  );
  if (staged.success !== true) throw new Error("staging fixture must succeed");
  return (draft) =>
    performShot({
      script,
      staged,
      performance: makePerformanceWrite({
        draft,
        revise: { review: "unchanged.", final: null },
      }),
      synthesize: validSynthesizer,
      skeleton: () => createSkeleton(),
      targetAt,
      previous,
    });
};
