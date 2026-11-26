import { Matrix4, AutoMovieEngineResolve } from "@automovie/engine";
import type {
  IAutoMovieChannelLimit,
  IAutoMovieClip,
  IAutoMovieDriver,
  IAutoMovieResolveOutput,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { resolveScene } from "../../internal/resolveScene";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** Rounding of a few rotations of unit offsets and one interpolation. */
const ROUNDING: number = 1e-9;

/** The ball slides 4 m along X in one second, 3 m back along Z. */
const SLIDE: IAutoMovieClip = {
  id: "slide",
  name: null,
  duration: 1,
  loop: false,
  tracks: [
    {
      channel: { kind: "node", node: "ball", path: "translation" },
      times: [0, 1],
      values: [0, 0, 3, 4, 0, 3],
      interpolation: "linear",
    },
  ],
};

/** The ball's X may not pass 1 m. */
const CAP: IAutoMovieChannelLimit = {
  channel: { kind: "node", node: "ball", path: "translation" },
  min: null,
  max: [1, null, null],
};

/** The world place of a node of a result. */
const at: (result: IAutoMovieResolveOutput, id: string) => IAutoMovieVector3 = (
  result: IAutoMovieResolveOutput,
  id: string,
): IAutoMovieVector3 => Matrix4.position(result.world.get(id)!);

/**
 * `resolveFrame` resolves one frame of a scene: it samples the clip, applies
 * the value drivers and the limits, composes the node hierarchy into world
 * matrices, applies the world drivers and defers the springs.
 *
 * Scenarios, on the arm scene (root -> mid -> tip along +X, goal at (0, 2, 0),
 * ball at (0, 0, 3)):
 *
 * 1. With no clip the world is the scene's own: tip (2, 0, 0), ball (0, 0, 3).
 * 2. The slide clip at 0.5 s puts the ball at (2, 0, 3).
 * 3. With a cap of 1 on the ball's X the ball is at (1, 0, 3) and one violation
 *    names the channel, component 0, the max bound, limit 1 and actual 2.
 * 4. An aim driver turning the root's +X at the goal moves mid to (0, 1, 0) and
 *    tip to (0, 2, 0).
 * 5. A spring driver is deferred when no spring state is threaded.
 * 6. A clip addressing a node that is not in the scene is refused.
 */
export function test_engine_resolve_resolve_frame(): void {
  const still: IAutoMovieResolveOutput = AutoMovieEngineResolve.resolveFrame({
    nodes: resolveScene(),
    clip: null,
    limits: [],
    seconds: 0,
  });
  TestValidator.predicate(
    "the scene's own world",
    vclose(at(still, "tip"), { x: 2, y: 0, z: 0 }, ROUNDING) &&
      vclose(at(still, "ball"), { x: 0, y: 0, z: 3 }, ROUNDING) &&
      still.violations.length === 0,
  );
  const slid: IAutoMovieResolveOutput = AutoMovieEngineResolve.resolveFrame({
    nodes: resolveScene(),
    clip: SLIDE,
    limits: [],
    seconds: 0.5,
  });
  TestValidator.predicate(
    "a sampled slide",
    vclose(at(slid, "ball"), { x: 2, y: 0, z: 3 }, ROUNDING),
  );
  const capped: IAutoMovieResolveOutput = AutoMovieEngineResolve.resolveFrame({
    nodes: resolveScene(),
    clip: SLIDE,
    limits: [CAP],
    seconds: 0.5,
  });
  TestValidator.predicate(
    "a limit clamps the ball",
    vclose(at(capped, "ball"), { x: 1, y: 0, z: 3 }, ROUNDING),
  );
  TestValidator.equals("and reports the violation", capped.violations, [
    {
      channel: "node:ball:translation",
      component: 0,
      bound: "max",
      limit: 1,
      actual: 2,
    },
  ]);
  const aim: IAutoMovieDriver = {
    type: "aim",
    owner: "root",
    target: "goal",
    aimAxis: { x: 1, y: 0, z: 0 },
    upAxis: { x: 0, y: 0, z: 1 },
    worldUp: { x: 0, y: 0, z: 1 },
    influence: 1,
  };
  const aimed: IAutoMovieResolveOutput = AutoMovieEngineResolve.resolveFrame({
    nodes: resolveScene(),
    clip: null,
    limits: [],
    drivers: [aim],
    seconds: 0,
  });
  TestValidator.predicate(
    "an aim driver",
    vclose(at(aimed, "mid"), { x: 0, y: 1, z: 0 }, ROUNDING) &&
      vclose(at(aimed, "tip"), { x: 0, y: 2, z: 0 }, ROUNDING) &&
      aimed.deferredDrivers.length === 0,
  );
  const spring: IAutoMovieDriver = {
    type: "spring",
    chain: ["mid", "tip"],
    stiffness: 0,
    drag: 0,
    gravityPower: 0,
    gravityDir: { x: 0, y: -1, z: 0 },
    hitRadius: 0.1,
    center: null,
  };
  TestValidator.predicate(
    "a deferred spring",
    AutoMovieEngineResolve.resolveFrame({
      nodes: resolveScene(),
      clip: null,
      limits: [],
      drivers: [spring],
      seconds: 0,
    }).deferredDrivers[0] === spring,
  );
  TestValidator.predicate(
    "a clip for a node that is not there",
    throwsError(
      (): unknown =>
        AutoMovieEngineResolve.resolveFrame({
          nodes: resolveScene().filter(
            (node: { id: string }): boolean => node.id !== "ball",
          ),
          clip: SLIDE,
          limits: [],
          seconds: 0.5,
        }),
      'missing node "ball"',
    ),
  );
}
