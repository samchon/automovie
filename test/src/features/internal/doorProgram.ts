import type { IAutoMovieBlocking, IAutoMoviePerformance, IAutoMovieShotProgram, IAutoMovieStage } from "@automovie/interface";

import { makeBlockingWrite, makePerformanceWrite, makeScriptWrite, makeStagingWrite } from "./filmFixtures";

/**
 * The duel fixture, plus everything an authored object clip is measured against: a door prop whose hinge is lowered, a wall panel standing on its own as a building element would, and a torch the engine bakes a follow clip for.
 *
 * `extraSet` adds one more staged piece, so a scenario can put a scene node exactly where a prop joint lowers and watch the collision be named.
 */
export function doorProgram (
  extraSet: IAutoMovieStage["set"] = [],
): IAutoMovieShotProgram {
  const blocking: IAutoMovieBlocking = makeBlockingWrite();
  const performance: IAutoMoviePerformance = makePerformanceWrite();
  blocking.camera.framing = "full";
  blocking.rationale =
    "full static keeps both required actor roots readable throughout the duel.";
  for (const action of performance.draft)
    if (action.verb === "frame") action.framing = "full";
  performance.draft.push({
    verb: "attachTo",
    actor: "torch",
    parent: "knightA",
    bone: "leftHand",
    start: 0,
    duration: "auto",
  });
  return {
    actors: [
      { node: "knightA", model: "knightA", speed: 1, eyeHeight: 1.6 },
      { node: "knightB", model: "knightB", speed: 1, eyeHeight: 1.6 },
    ],
    script: makeScriptWrite({
      cast: [
        { node: "knightA", character: "the challenger", modelRef: "stickman" },
        { node: "knightB", character: "the champion", modelRef: null },
        { node: "torch", character: "the torch", modelRef: null },
      ],
    }),
    stage: makeStagingWrite({
      actors: [
        { node: "knightA", position: { x: 0, y: 0, z: 0 }, facingDeg: 0 },
        { node: "knightB", position: { x: 0, y: 0, z: 0.7 }, facingDeg: 180 },
        { node: "torch", position: { x: 0.3, y: 1.2, z: 0 }, facingDeg: 0 },
      ],
      set: [
        { node: "frontDoor", model: "door", position: { x: 2, y: 0, z: 0 } },
        { node: "hall/panel", model: "slab", position: { x: 3, y: 0, z: 0 } },
        ...(extraSet ?? []),
      ],
    }),
    blocking,
    performance,
    eventSamples: [],
  };
}
