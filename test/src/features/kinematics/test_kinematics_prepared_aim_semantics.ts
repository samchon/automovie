import { Quaternion, aimRotation, rotationBetween } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../internal/qclose";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

/**
 * Prepared aiming preserves every changing target and named refusal while
 * separating an explicit source snapshot from borrowed fixed-source scope.
 *
 * Scenarios:
 * 1. A normalized source snapshot of plus X keeps that direction after the
 *    original vector changes. Targets plus Y, minus X, plus X and a1e-6
 *    radian correction give the independently known Z rotations.
 * 2. Borrowed fixed-source aim preparation is lazy. An initial nonfinite
 *    target refuses by its named coordinate, then a valid target succeeds;
 *    later targets receive fresh validation without rereading source admission.
 * 3. Parallel/antiparallel/zero target conventions and A/B/A requests retain
 *    current geometric results. Mutating one returned quaternion cannot
 *    poison another result or replay.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States snapshot versus unchanged borrowed source ownership, dimensionless directions/radian oracle, named validation, lazy lifetime and fresh output across three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls existing public rotationBetween.prepare and aimRotation.prepare, checks literal cardinal/tiny rotations and actually rotated directions, observes a test-owned source getter through failed first admission/retry, and checks later target refusal and output isolation.
 * @evidence contracts/development/testing.md#independent-expectations A plus-X source turns onto plus Y by Z90, onto minus X by a perpendicular half-turn and onto (cos(e),sin(e),0) by Ze. Zero and parallel inputs follow their explicit identity convention. Direct half-angle components provide the expected rotations, without cold prepared parity as an oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers source mutation under explicit snapshot, separate unchanged borrowed scope, magnitude-independent targets, opposite/parallel/zero directions, a tiny nonzero correction, failed-first-target recovery, later nonfinite target, changing query order and old output mutation. Arbitrary two-bone scoring remains separately specified.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable unit owns all directions, immutable borrowed source and getter observations. It starts no host/compiler, replaces no foreign method and exports no internal numerical helper for testing.
 */
export function test_kinematics_prepared_aim_semantics(): void {
  const source: IAutoMovieVector3 = { x: 2, y: 0, z: 0 };
  const snapshot: ReturnType<typeof rotationBetween.prepare> = rotationBetween.prepare(source);
  source.x = 0;
  source.y = 2;
  const tiny: number = 1e-6;
  const targets: readonly (readonly [IAutoMovieVector3, IAutoMovieQuaternion])[] = [
    [{ x: 0, y: 3, z: 0 }, turn(Math.PI / 2)],
    [{ x: -1, y: 0, z: 0 }, turn(Math.PI)],
    [{ x: 7, y: 0, z: 0 }, turn(0)],
    [{ x: Math.cos(tiny), y: Math.sin(tiny), z: 0 }, turn(tiny)],
    [{ x: 0, y: 3, z: 0 }, turn(Math.PI / 2)],
  ];
  for (const [target, expected] of targets) {
    const actual: IAutoMovieQuaternion = snapshot(target);
    TestValidator.predicate("explicit source snapshot retains each actual shortest turn",
      qclose(actual, expected, 1e-12),
    );
    const magnitude: number = Math.hypot(target.x, target.y, target.z);
    TestValidator.predicate("prepared rotation reaches the independent target direction",
      vclose(Quaternion.rotateVector(actual, { x: 1, y: 0, z: 0 }),
        { x: target.x / magnitude, y: target.y / magnitude, z: target.z / magnitude }, 1e-12),
    );
  }
  let reads: number = 0;
  const fixed: IAutoMovieVector3 = {
    /** Count only the owned unchanged source coordinate's actual admission work. */
    get x(): number { reads++; return 2; }, y: 0, z: 0,
  };
  const aim: ReturnType<typeof aimRotation.prepare> = aimRotation.prepare(fixed);
  TestValidator.equals("aim construction performs no source admission", reads, 0);
  TestValidator.predicate("first malformed target keeps its named refusal",
    throwsError((): IAutoMovieQuaternion => aim({ x: Infinity, y: 0, z: 0 }), "to.x"),
  );
  const failedReads: number = reads;
  const first: IAutoMovieQuaternion = aim({ x: 0, y: 1, z: 0 });
  TestValidator.predicate("failed target publishes no prepared source and valid retry succeeds",
    reads > failedReads && qclose(first, turn(Math.PI / 2), 1e-12),
  );
  const admitted: number = reads;
  TestValidator.predicate("changed valid target still produces its actual turn",
    qclose(aim({ x: -1, y: 0, z: 0 }), turn(Math.PI), 1e-12),
  );
  TestValidator.predicate("warmed target validation still refuses nonfinite coordinates",
    throwsError((): IAutoMovieQuaternion => aim({ x: 0, y: NaN, z: 0 }), "to.y"),
  );
  TestValidator.equals("successful unchanged source admission is not repeated", reads, admitted);
  TestValidator.predicate("zero target retains its explicit identity convention",
    qclose(aim({ x: 0, y: 0, z: 0 }), turn(0), 0),
  );
  first.z = 123;
  const again: IAutoMovieQuaternion = aim({ x: 0, y: 1, z: 0 });
  TestValidator.predicate("returned aim quaternions are independently owned",
    again !== first && first.z === 123 && qclose(again, turn(Math.PI / 2), 1e-12),
  );
}

/** Construct a cardinal Z rotation from its independent radian half-angle. */
function turn(radians: number): IAutoMovieQuaternion {
  return { x: 0, y: 0, z: Math.sin(radians / 2), w: Math.cos(radians / 2) };
}
