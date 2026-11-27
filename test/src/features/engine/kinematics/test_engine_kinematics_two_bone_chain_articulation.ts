import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
  AutoMovieEngineKinematicsChains,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieTwoBoneArticulation,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieEngineKinematicsChains.twoBoneChainArticulation(props)` returns the bone-local deltas of a resolved
 * two-segment chain that land its end on the target, bending toward world-down
 * by default; `.prepare` shares the source and target geometry.
 *
 * Fixture: unit segments hanging from the origin, (0,0,0) to (0,-1,0) to
 * (0,-2,0), every rest rotation the identity. Forward kinematics with identity
 * rests: mid = du (0,-1,0), end = mid + du dl (0,-1,0), du and dl the deltas.
 *
 * Scenarios:
 *
 * 1. Target (0, -2, 0), fully extended: both deltas are the identity within 1e-12.
 * 2. Target (1, -1, 0), at distance sqrt 2 (a 45 degree lift): the end lands on it
 *    within 1e-12, with and without an explicit bend normal (0, 0, 1); by
 *    default the mid joint bends toward world-down, to (0, -1, 0).
 * 3. Target (0, -5, 0) beyond reach: the end stops at (0, -2, 0).
 * 4. The prepared solve equals the direct one exactly.
 * 5. A target at the root and a zero-length upper or fore segment give null.
 */
export function test_engine_kinematics_two_bone_chain_articulation(): void {
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const bone = (y: number) => ({
    worldPosition: { x: 0, y, z: 0 },
    worldRotation: identity,
  });
  const chain = { upper: bone(0), lower: bone(-1), end: { x: 0, y: -2, z: 0 } };
  const down: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };
  const end = (a: IAutoMovieTwoBoneArticulation): IAutoMovieVector3 => {
    const mid: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(a.upper, down);
    return AutoMovieEngineVector3.add(
      mid,
      AutoMovieEngineQuaternion.rotateVector(AutoMovieEngineQuaternion.multiply(a.upper, a.lower), down),
    );
  };
  const close = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean =>
    AutoMovieEngineVector3.distance(a, b) <= 1e-12;
  const solve = (
    target: IAutoMovieVector3,
    bendNormal?: IAutoMovieVector3,
  ): IAutoMovieTwoBoneArticulation =>
    AutoMovieEngineKinematicsChains.twoBoneChainArticulation({ ...chain, target, bendNormal })!;

  // 1.
  const straight: IAutoMovieTwoBoneArticulation = solve({ x: 0, y: -2, z: 0 });
  TestValidator.predicate(
    "identity",
    [straight.upper, straight.lower].every(
      (q: IAutoMovieQuaternion): boolean =>
        Math.abs(Math.abs(q.w) - 1) <= 1e-12,
    ),
  );

  // 2.
  const target: IAutoMovieVector3 = { x: 1, y: -1, z: 0 };
  TestValidator.predicate("lands", close(end(solve(target)), target));
  TestValidator.predicate(
    "bends down",
    close(AutoMovieEngineQuaternion.rotateVector(solve(target).upper, down), {
      x: 0,
      y: -1,
      z: 0,
    }),
  );
  TestValidator.predicate(
    "lands with normal",
    close(end(solve(target, { x: 0, y: 0, z: 1 })), target),
  );

  // 3.
  TestValidator.predicate(
    "shell",
    close(end(solve({ x: 0, y: -5, z: 0 })), { x: 0, y: -2, z: 0 }),
  );

  // 4.
  TestValidator.equals(
    "prepared",
    AutoMovieEngineKinematicsChains.prepareTwoBoneChainArticulation(chain)!.target(target)!.solve(),
    solve(target),
  );

  // 5.
  TestValidator.equals(
    "degenerate",
    [
      AutoMovieEngineKinematicsChains.twoBoneChainArticulation({ ...chain, target: { x: 0, y: 0, z: 0 } }),
      AutoMovieEngineKinematicsChains.twoBoneChainArticulation({ ...chain, lower: bone(0), target }),
      AutoMovieEngineKinematicsChains.twoBoneChainArticulation({
        ...chain,
        end: { x: 0, y: -1, z: 0 },
        target,
      }),
    ],
    [null, null, null],
  );
}
