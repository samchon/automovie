import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { aimRotation, Quaternion } from "@automovie/engine";

import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

const X: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
const Y: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
const nX: IAutoMovieVector3 = { x: -1, y: 0, z: 0 };
const nY: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };

/** 0.05° in radians: inside the OLD quatFromTo identity deadzone. */
const TINY: number = (0.05 * Math.PI) / 180;

/**
 * Shortest-arc aiming retains representable direction changes without snapping.
 *
 * Scenarios:
 *
 * 1. General case: +X → +Y rotates +X onto +Y.
 * 2. Already aligned (+X → +X) is the identity.
 * 3. Antiparallel where the first perpendicular axis is degenerate (+X → −X:
 *    `|a.x| >= 0.9` ⇒ the +Y-axis branch) still flips +X to −X.
 * 4. Antiparallel with the `|a.x| < 0.9` branch (+Y → −Y) flips +Y to −Y.
 * 5. Non-unit finite inputs normalize, zero direction gives identity, and NaN
 *    or infinite components refuse with their argument and component named.
 * 6. A 0.05 degree turn and signed slopes below 1e-12 remain active, including
 *    a 1e-200 slope whose unscaled squared axis length would underflow.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs aimRotation and rotates the input direction, asserting general, collinear and microscopic turns so a hidden sine deadzone or axis-norm underflow cannot return identity.
 * @evidence contracts/testing.md#independent-expectations Right-handed cardinal-axis turns define general and antiparallel expectations; authored signed slopes define microscopic Y components with tolerance relative to their nonzero magnitude. Quaternion.rotateVector is the actual numerical consumer, so a coordinated defect in both engine operations could evade this replay oracle.
 * @evidence contracts/testing.md#distinguishing-cases Covers both antiparallel axis branches, aligned/zero/nonunit directions, NaN/infinite refusals and signed/subnormal-scale turns; quaternion tests own generic rotation normalization.
 * @evidence contracts/testing.md#execution-ownership The exported kinematics entry directly reaches CPU vector/quaternion source and owns all cases without a Human basis, probe, renderer or native driver.
 */
export function test_kinematics_aim_rotation(): void {
  TestValidator.predicate(
    "a zero direction has no turn to recover",
    qclose(aimRotation({ x: 0, y: 0, z: 0 }, Y), { x: 0, y: 0, z: 0, w: 1 }),
  );
  // 1. general
  TestValidator.predicate(
    "+X → +Y aims onto +Y",
    vclose(Quaternion.rotateVector(aimRotation(X, Y), X), Y),
  );

  // 2. aligned → identity
  TestValidator.predicate(
    "aligned is identity",
    qclose(aimRotation(X, X), { x: 0, y: 0, z: 0, w: 1 }),
  );

  // 3. antiparallel, degenerate first axis (+X → −X)
  TestValidator.predicate(
    "+X → −X flips",
    vclose(Quaternion.rotateVector(aimRotation(X, nX), X), nX),
  );

  // 4. antiparallel, valid first axis (+Y → −Y)
  TestValidator.predicate(
    "+Y → −Y flips",
    vclose(Quaternion.rotateVector(aimRotation(Y, nY), Y), nY),
  );

  // 5. non-unit inputs normalized
  TestValidator.predicate(
    "non-unit inputs normalized",
    vclose(
      Quaternion.rotateVector(
        aimRotation({ x: 2, y: 0, z: 0 }, { x: 0, y: 3, z: 0 }),
        X,
      ),
      Y,
    ),
  );
  TestValidator.predicate(
    "NaN from vector rejects",
    throwsError(
      (): IAutoMovieQuaternion => aimRotation({ x: Number.NaN, y: 0, z: 0 }, Y),
      ["aimRotation from.x", "finite", "NaN"],
    ),
  );
  TestValidator.predicate(
    "infinite to vector rejects",
    throwsError(
      (): IAutoMovieQuaternion => aimRotation(X, { x: 0, y: Infinity, z: 0 }),
      ["aimRotation to.y", "finite", "Infinity"],
    ),
  );

  // 6. deadzone-free: a 0.05° off-axis target (inside the old identity deadzone)
  //    is aimed within the vector predicate's tolerance. from = −Z, to = 0.05° rotated toward +X: rotating
  //    `from` by the result must land on `to` (x = sin 0.05° ≈ 8.7e-4 ≠ 0, which
  //    the old cos > 0.999999 snap would have left at 0).
  const from: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };
  const to: IAutoMovieVector3 = { x: Math.sin(TINY), y: 0, z: -Math.cos(TINY) };
  const aimed: IAutoMovieVector3 = Quaternion.rotateVector(
    aimRotation(from, to),
    from,
  );
  TestValidator.predicate(
    "0.05° off-axis is aimed exactly (no deadzone snap)",
    vclose(aimed, to),
  );
  TestValidator.predicate(
    "the rotation is real, not the old identity (x ≈ sin 0.05° ≠ 0)",
    aimed.x > 1e-4,
  );
  for (const slope of [1e-14, -1e-14, 1e-200]) {
    const turned: IAutoMovieVector3 = Quaternion.rotateVector(
      aimRotation(X, { x: 1, y: slope, z: 0 }),
      X,
    );
    TestValidator.predicate(
      "every representable nonzero turn remains active below former sine thresholds",
      nclose(turned.y, slope, Math.abs(slope) * 1e-14),
    );
  }
}
