import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import type { ICompilePursuitFilm } from "../../../../packages/playground/src/film/ICompilePursuitFilm";
import { makeBlockingWrite, makePerformanceWrite, makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { loadSourceModule } from "../internal/loadSourceModule";
import { nclose } from "../internal/predicates";

const { compilePursuitFilm } = loadSourceModule<{ compilePursuitFilm: ICompilePursuitFilm }>(
  path.resolve(__dirname, "../../../../packages/playground/src/film/compilePursuitFilm.ts"),
);

/**
 * The example's compile boundary delegates typed minimal inputs to the same
 * staged, blocked, performed and cut owners without starting a browser or
 * compiling the full pursuit. Short static holds keep this a small CPU unit.
 *
 * Scenarios:
 * 1. Two short holds preserve ordered shots, separate rigs and unit set content;
 *    edit runtime equals played spans less the declared overlap.
 * 2. Missing staging, unknown blocked beat, invalid performance timing and an
 *    empty cut each refuse at the original compilation boundary.
 * 3. Missing rig identity refuses instead of inventing a model or skeleton.
 */
export const test_playground_film_compilation = (): void => {
  const inputs: Parameters<typeof compilePursuitFilm>[0] = {
    script: makeScriptWrite({
      cast: [{ node: "walker", character: "subject", modelRef: "stickman" }],
      beats: ["first", "second"].map((id) => ({ id, name: id, summary: "hold", durationHint: 0.7 })),
    }),
    staging: makeStagingWrite({
      actors: [{ node: "walker", position: { x: 0, y: 0, z: 0 }, facingDeg: 0 }],
      set: [{ node: "support", model: "block", position: { x: 0, y: -0.5, z: 0 } }],
      cameras: [{ node: "cam-main", position: { x: 2, y: 1, z: 2 },
        lookAt: { kind: "node", node: "walker" }, fovDeg: 40, near: 0.1, far: 100,
        depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 1 } }],
    }),
    blockings: ["first", "second"].map((beat) => makeBlockingWrite({ beat, duration: 0.7,
      actors: [{ node: "walker", beats: "holds" }],
      camera: { framing: "full", move: "static", on: { kind: "node", node: "walker" } },
    })),
    performances: ["first", "second"].map((beat) => makePerformanceWrite({ beat, duration: 0.7,
      draft: [{ verb: "hold", actor: "walker", start: 0, duration: 0.7 },
        { verb: "frame", actor: "cam-main", start: 0, duration: "auto",
          framing: "full", move: "static", on: { kind: "node", node: "walker" } }],
    })),
  };
  const compiled = compilePursuitFilm(inputs);
  TestValidator.equals("one shot per authored performance", compiled.shots.length, inputs.performances.length);
  TestValidator.equals("edit preserves performed order", compiled.cut.sequence.shots.map((entry) => entry.shot),
    compiled.shots.map((shot) => shot.id));
  const played = compiled.shots.reduce((total, shot) => total + shot.duration, 0);
  const overlap = compiled.cut.sequence.shots.reduce((total, entry) => total + (entry.transition?.duration ?? 0), 0);
  TestValidator.predicate("edit closes played spans minus overlap", nclose(compiled.cut.runtime, played - overlap));
  TestValidator.predicate("actors own distinct rigs", compiled.rigFor("walker") !== compiled.rigFor("waiter"));
  TestValidator.predicate("actor uses its resident model", compiled.modelForNode({ id: "walker", model: "stickman" }) === compiled.rigFor("walker").model);
  TestValidator.equals("set registry remains skeletonless", compiled.modelForNode({ id: "support", model: "block" }).skeleton, null);
  const refusals: Array<[string, () => unknown]> = [
    ["staging", () => compilePursuitFilm({ ...inputs, staging: { ...inputs.staging, actors: [] } })],
    ["blocking", () => compilePursuitFilm({ ...inputs, blockings: [{ ...inputs.blockings[0]!, beat: "missing" }] })],
    ["perform", () => compilePursuitFilm({ ...inputs, performances: [{ ...inputs.performances[0]!, duration: 0 }] })],
    ["cut", () => compilePursuitFilm({ ...inputs, performances: [], blockings: [] })],
    ["rig", () => compiled.rigFor("missing")],
    ["model", () => compiled.modelForNode({ id: "missing", model: "stickman" })],
  ];
  for (const [name, call] of refusals) {
    let cause: unknown;
    try { call(); } catch (error) { cause = error; }
    TestValidator.predicate(name + " refuses", cause instanceof Error);
    if (name === "staging" || name === "blocking" || name === "perform" || name === "cut")
      TestValidator.predicate(name + " keeps its original boundary", cause instanceof Error && cause.message.startsWith(name));
  }
};
