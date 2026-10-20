import type {
  IAutoMovieBeat,
  IAutoMovieBlocking,
  IAutoMoviePerformance,
  IAutoMovieSequenceEntry,
  IAutoMovieShot,
} from "@automovie/interface";
import type { ICompilePursuitFilm } from "@automovie/playground/film/ICompilePursuitFilm";
import { compilePursuitFilm } from "@automovie/playground/film/compilePursuitFilm";
import { TestValidator } from "@nestia/e2e";

import {
  makeBlockingWrite,
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../internal/filmFixtures";
import { nclose } from "../internal/predicates";

/**
 * Exercise the example's portable compilation boundary with two short static holds, not a rendered pursuit or a Human anatomical/geometry observation. Original engine refusals retain their named compilation boundary; own rig keys and exact blocking/performance pairing prevent inherited object names or incomplete arrays from becoming usable input.
 *
 * Scenarios:
 * 1. Two 0.7-second holds retain separate rig/model ownership and a skeletonless set; their authored 0.6-second overlap leaves 0.8 seconds.
 * 2. Missing staging, a count-preserving unknown blocked beat, count-preserving invalid performance timing and an empty cut refuse their named boundary.
 * 3. Missing rig/model identities and inherited toString/constructor/__proto__ names refuse; known walker/waiter keys still work.
 * 4. Missing and extra blockings refuse before index access instead of silently accepting unused input or throwing an unrelated TypeError.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual compilePursuitFilm export and returned rig/model lookup seams, asserting literal authored spans/runtime, ownership and refusals; inherited-key cases fail if an Object prototype member is returned as a rig, while valid known keys remain allowed.
 * @evidence contracts/testing.md#independent-expectations Two 0.7-second input holds and the documented 0.6-second second-entry overlap independently imply 0.8 seconds, checked with nclose; own-key membership and one blocking per performance are the source contract. Existing output-order/runtime-correspondence assertions add consistency checks without serving as the sole numerical oracle.
 * @evidence contracts/testing.md#distinguishing-cases Covers known/unknown/inherited rig keys, missing/extra pair counts, preserved valid pairs, distinct actor ownership, skeletonless set and staging/blocking/perform/cut failures. It does not judge appearance, anatomy, contact, GPU retirement or all engine-stage validation cases, which have separate owners.
 * @evidence contracts/testing.md#execution-ownership The discoverable named test invokes maintained source through its supported package subpath using in-memory typed authoring data. It starts no process, browser, native render or new validation driver; the configured test runner owns discovery and execution.
 */
export function test_playground_film_compilation(): void {
  const inputs: Parameters<typeof compilePursuitFilm>[0] = {
    script: makeScriptWrite({
      cast: [{ node: "walker", character: "subject", modelRef: "stickman" }],
      beats: ["first", "second"].map(
        (id: string): IAutoMovieBeat => ({
          id,
          name: id,
          summary: "hold",
          durationHint: 0.7,
        }),
      ),
    }),
    staging: makeStagingWrite({
      actors: [
        { node: "walker", position: { x: 0, y: 0, z: 0 }, facingDeg: 0 },
      ],
      set: [
        { node: "support", model: "block", position: { x: 0, y: -0.5, z: 0 } },
      ],
      cameras: [
        {
          node: "cam-main",
          position: { x: 2, y: 1, z: 2 },
          lookAt: { kind: "node", node: "walker" },
          fovDeg: 40,
          near: 0.1,
          far: 100,
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 1 },
        },
      ],
    }),
    blockings: ["first", "second"].map(
      (beat: string): IAutoMovieBlocking =>
        makeBlockingWrite({
          beat,
          duration: 0.7,
          actors: [{ node: "walker", beats: "holds" }],
          camera: {
            framing: "full",
            move: "static",
            on: { kind: "node", node: "walker" },
          },
        }),
    ),
    performances: ["first", "second"].map(
      (beat: string): IAutoMoviePerformance =>
        makePerformanceWrite({
          beat,
          duration: 0.7,
          draft: [
            { verb: "hold", actor: "walker", start: 0, duration: 0.7 },
            {
              verb: "frame",
              actor: "cam-main",
              start: 0,
              duration: "auto",
              framing: "full",
              move: "static",
              on: { kind: "node", node: "walker" },
            },
          ],
        }),
    ),
  };
  const compiled: ICompilePursuitFilm.IResult = compilePursuitFilm(inputs);
  TestValidator.equals(
    "one shot per authored performance",
    compiled.shots.length,
    inputs.performances.length,
  );
  TestValidator.equals(
    "edit preserves performed order",
    compiled.cut.sequence.shots.map(
      (entry: IAutoMovieSequenceEntry): string => entry.shot,
    ),
    compiled.shots.map((shot: IAutoMovieShot): string => shot.id),
  );
  TestValidator.predicate(
    "authored hold spans",
    compiled.shots.every((shot: IAutoMovieShot): boolean =>
      nclose(shot.duration, 0.7),
    ),
  );
  TestValidator.predicate(
    "authored cut runtime",
    nclose(compiled.cut.runtime, 0.8),
  );
  const played: number = compiled.shots.reduce(
    (total: number, shot: IAutoMovieShot): number => total + shot.duration,
    0,
  );
  const overlap: number = compiled.cut.sequence.shots.reduce(
    (total: number, entry: IAutoMovieSequenceEntry): number =>
      total + (entry.transition?.duration ?? 0),
    0,
  );
  TestValidator.predicate(
    "edit closes played spans minus overlap",
    nclose(compiled.cut.runtime, played - overlap),
  );
  TestValidator.predicate(
    "actors own distinct rigs",
    compiled.rigFor("walker") !== compiled.rigFor("waiter"),
  );
  TestValidator.predicate(
    "actor uses its resident model",
    compiled.modelForNode({ id: "walker", model: "stickman" }) ===
      compiled.rigFor("walker").model,
  );
  TestValidator.equals(
    "set registry remains skeletonless",
    compiled.modelForNode({ id: "support", model: "block" }).skeleton,
    null,
  );
  const refusals: Array<[string, () => unknown]> = [
    [
      "staging",
      (): unknown =>
        compilePursuitFilm({
          ...inputs,
          staging: { ...inputs.staging, actors: [] },
        }),
    ],
    [
      "blocking",
      (): unknown =>
        compilePursuitFilm({
          ...inputs,
          blockings: [
            { ...inputs.blockings[0]!, beat: "missing" },
            inputs.blockings[1]!,
          ],
        }),
    ],
    [
      "perform",
      (): unknown =>
        compilePursuitFilm({
          ...inputs,
          performances: [
            { ...inputs.performances[0]!, duration: 0 },
            inputs.performances[1]!,
          ],
        }),
    ],
    [
      "cut",
      (): unknown =>
        compilePursuitFilm({ ...inputs, performances: [], blockings: [] }),
    ],
    ["rig", (): unknown => compiled.rigFor("missing")],
    [
      "model",
      (): unknown =>
        compiled.modelForNode({ id: "missing", model: "stickman" }),
    ],
    [
      "blocking missing pair",
      (): unknown =>
        compilePursuitFilm({
          ...inputs,
          blockings: inputs.blockings.slice(0, 1),
        }),
    ],
    [
      "blocking extra pair",
      (): unknown =>
        compilePursuitFilm({
          ...inputs,
          blockings: [...inputs.blockings, inputs.blockings[0]!],
        }),
    ],
    ...["toString", "constructor", "__proto__"].flatMap(
      (node: string): Array<[string, () => unknown]> => [
        ["rig inherited " + node, (): unknown => compiled.rigFor(node)],
        [
          "model inherited " + node,
          (): unknown => compiled.modelForNode({ id: node, model: "stickman" }),
        ],
      ],
    ),
  ];
  for (const [name, call] of refusals) {
    let cause: unknown;
    try {
      call();
    } catch (error) {
      cause = error;
    }
    TestValidator.predicate(name + " refuses", cause instanceof Error);
    if (
      name === "staging" ||
      name === "blocking" ||
      name === "perform" ||
      name === "cut"
    )
      TestValidator.predicate(
        name + " keeps its original boundary",
        cause instanceof Error && cause.message.startsWith(name),
      );
    if (name.startsWith("blocking "))
      TestValidator.predicate(
        name + " explains pairing",
        cause instanceof Error &&
          !(cause instanceof TypeError) &&
          cause.message.startsWith("blocking failed:") &&
          cause.message.includes("paired by index"),
      );
  }
}
