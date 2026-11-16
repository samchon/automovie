import type { IAutoMovieQuaternion } from "@automovie/interface";

import { readNormalizedQuaternion } from "./readNormalizedQuaternion";

/**
 * Read inverse(a) * b's geodesic angle through the original scalar arithmetic.
 * afterNormalization first performs the separate normalize(a) boundary used
 * by actual chain errors. Both entries retain inverse's conjugate normalization
 * and the Hamilton/atan2 formula; neither constructs an intermediate quaternion.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines relative operand order, radians in [0, pi], the separate first-normalization entry and unchanged inverse/Hamilton/atan2 boundaries, including zero and nonfinite arithmetic.
 * @evidence contracts/development/implementation.md#principled-implementation The conjugate is normalized exactly as Quaternion.inverse before the original four Hamilton expressions and 2*atan2(hypot(vector),abs(scalar)). afterNormalization first receives normalize(a)'s exact completed X/Y/Z/W and then negates and normalizes that conjugate, preserving both distinct normalization roundings.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One internal relative-angle visitor serves Quaternion.angle and its actual normalize-then-angle consumers. The optional first boundary has one static forwarding visitor, while the shared normalization owner alone determines magnitude scaling and zero identity.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither normalization is skipped or collapsed. Every conjugate expression, Hamilton sum/subtraction order, hypot, absolute scalar and atan2 remains unchanged; no angle tolerance, unit shortcut, dot/acos replacement or nonfinite repair is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms Both entries keep their original constant scalar work. Direct angle omits inverse/relative records; the normalize-then-angle entry additionally omits the first normalized output record while retaining its original extreme scaled temporary. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both actual Quaternion entries reuse static visitors and the same scalar normalization/Hamilton owner. Every incoming operand still supplies its actual required normalization and angle; no quaternion, angle, target or prior result is cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only local scalars and borrowed synchronous arguments live during the call; an extreme first record normalization may allocate its original scaled temporary. No visitor closure, normalized-output record, operand, result, handle or task is allocated or retained by either angle entry.
 */
export function readQuaternionAngle(
  a: IAutoMovieQuaternion,
  b: IAutoMovieQuaternion,
): number {
  return readNormalizedQuaternion.fromScalars(
    -a.x, -a.y, -a.z, a.w, relativeAngle, b,
  );
}

/**
 * A separate first normalization followed by the same relative-angle reading.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States that the extra boundary normalizes only the first operand before the usual inverse normalization, with no retained normalized record.
 * @evidence contracts/development/design.md#principled-representation Actual chain errors request angle(normalize(shown), wanted); the first normalized components are an intermediate representation consumed only by the inverse's conjugate normalization, so synchronous scalar transfer preserves both boundaries.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One internal entry serves Quaternion.angleAfterNormalize and the actual distal/final chain errors without exposing normalized components or adding a second angle formula.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No caller-declared unit premise permits skipping a boundary, and no target identity, history or global result table represents equivalence.
 */
export namespace readQuaternionAngle {
  /** Normalize a first, then read the same angle; b is read only afterward. */
  export function afterNormalization(
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ): number {
    return readNormalizedQuaternion(a, normalizedFirst, b);
  }
}

/** Transfer the completed first normalization into the original inverse boundary. */
function normalizedFirst(
  x: number, y: number, z: number, w: number,
  _raw: IAutoMovieQuaternion, b: IAutoMovieQuaternion,
): number {
  return readNormalizedQuaternion.fromScalars(-x, -y, -z, w, relativeAngle, b);
}

/** Original Hamilton component association and stable relative-angle formula. */
function relativeAngle(
  ax: number, ay: number, az: number, aw: number,
  b: IAutoMovieQuaternion,
): number {
  const x: number = aw * b.x + ax * b.w + ay * b.z - az * b.y;
  const y: number = aw * b.y - ax * b.z + ay * b.w + az * b.x;
  const z: number = aw * b.z + ax * b.y - ay * b.x + az * b.w;
  const w: number = aw * b.w - ax * b.x - ay * b.y - az * b.z;
  return 2 * Math.atan2(Math.hypot(x, y, z), Math.abs(w));
}
