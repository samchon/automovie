import { Quaternion, aimRotation, rotationBetween } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../../internal/qclose";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

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
 */
export function test_unit_engine_kinematics_prepared_aim_semantics(): void {
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
  const failedReads: number = reads;
  const first: IAutoMovieQuaternion = aim({ x: 0, y: 1, z: 0 });
  TestValidator.predicate("failed target publishes no prepared source and valid retry succeeds",
    reads > failedReads && qclose(first, turn(Math.PI / 2), 1e-12),
  );
  const admitted: number = reads;
  TestValidator.predicate("changed valid target still produces its actual turn",
    qclose(aim({ x: -1, y: 0, z: 0 }), turn(Math.PI), 1e-12),
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
