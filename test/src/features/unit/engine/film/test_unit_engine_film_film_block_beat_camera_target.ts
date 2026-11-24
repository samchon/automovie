import { blockBeat, stageScene } from "@automovie/engine";
import {
  type IAutoMovieBlockedBeat,
  IAutoMovieBlockingCamera,
  IAutoMovieBlockingCoverage,
  IAutoMovieConstraintViolation,
  IAutoMovieScript,
  type IAutoMovieStagedSet,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makeBlockingWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../../../internal/filmFixtures";

/**
 * Blocking accepts every staged placement as a camera subject and refuses plans
 * whose camera references resolve to nothing.
 *
 * Scenarios:
 *
 * 1. Hero and coverage intents accept cameras, actors and set pieces as subjects.
 * 2. An absent subject is refused at the hero or coverage target path, with the
 *    accepted placement kinds stated in the message.
 * 3. An unstaged coverage camera is refused even when its subject is placed.
 */
export function test_unit_engine_film_film_block_beat_camera_target(): void {
  const script: IAutoMovieScript = makeScriptWrite();
  const staged: IAutoMovieStagedSet = stageScene(
    script,
    makeStagingWrite({
      set: [{ node: "altar", model: "box", position: { x: 1, y: 0, z: 1 } }],
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
          node: "cam-alt",
          position: { x: -2, y: 1.5, z: 0.35 },
          lookAt: { kind: "node", node: "knightB" },
          fovDeg: 40,
          near: 0.1,
          far: 1000,
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
        },
      ],
    }),
  );
  if (!staged.success) throw new Error("staging fixture must succeed");
  const placed: IAutoMovieStagedSet.ISuccess = staged;
  function block(
    camera: Partial<IAutoMovieBlockingCamera> = {},
    coverage?: IAutoMovieBlockingCoverage[],
  ): IAutoMovieBlockedBeat {
    return blockBeat(
      script,
      placed,
      makeBlockingWrite({
        camera: {
          framing: "medium",
          move: "static",
          on: { kind: "node", node: "knightA" },
          ...camera,
        },
        ...(coverage === undefined ? {} : { coverage }),
      }),
    );
  }
  function cover(
    on: IAutoMovieBlockingCoverage["on"],
  ): IAutoMovieBlockingCoverage[] {
    return [{ camera: "cam-alt", framing: "medium", move: "static", on }];
  }
  for (const subject of ["cam-alt", "knightB", "altar"])
    TestValidator.equals(
      `hero may favour ${subject}`,
      block({ on: { kind: "node", node: subject } }).success,
      true,
    );
  for (const subject of ["cam-main", "knightB", "altar"])
    TestValidator.equals(
      `coverage may favour ${subject}`,
      block({}, cover({ kind: "node", node: subject })).success,
      true,
    );
  assertRefusal(
    block({ on: { kind: "node", node: "nobody" } }),
    "$input.camera.on.node",
    "an actor, a set piece, or another camera",
  );
  assertRefusal(
    block({}, cover({ kind: "node", node: "nobody" })),
    "$input.coverage[0].on.node",
    "an actor, a set piece, or another camera",
  );
  assertRefusal(
    block({}, [
      { ...cover({ kind: "node", node: "knightB" })[0]!, camera: "cam-ghost" },
    ]),
    "$input.coverage[0].camera",
    "staged camera",
  );
}

/** Require a located type refusal, including the reason the author can act on. */
function assertRefusal(
  result: IAutoMovieBlockedBeat,
  path: string,
  reason: string,
): void {
  TestValidator.predicate(
    `refuses ${path}: ${reason}`,
    result.success === false &&
      result.violations.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.kind === "type" &&
          item.path === path &&
          item.expected.includes(reason),
      ),
  );
}
