import type {
  IAutoMovieAxisFrame,
  IAutoMovieJointAxes,
  IAutoMovieJointRotationFrame,
  IAutoMovieRestFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { normalizeJointAxes } from "./internal/normalizeJointAxes";

/**
 * Whether a caller's basis and rest frame are a swing-twist range's own, so
 * that the clinical angles the caller decomposes a rotation into compose back,
 * in the range's frame, to that rotation (`scanJointRom` composes them on the
 * range's axes and rest frame before reading the range): the rotation itself
 * may then be read in their place, up to the rounding of the round trip.
 *
 * @param basis The basis the caller decomposes on, admitted and normalized
 *   (`normalizeJointAxes`).
 * @param frame The rest frame the caller lifts its angles by; omitted, they are
 *   rest-relative.
 * @param joint The frame the range reads the joint in.
 * @returns True when the normalized axes, the rotation convention and every
 *   axis's sign and neutral agree exactly.
 */
export function readsSwingTwistFrame(
  basis: IAutoMovieJointAxes,
  frame: IAutoMovieRestFrame | undefined,
  joint: IAutoMovieJointRotationFrame,
): boolean {
  const own: IAutoMovieJointAxes = normalizeJointAxes(
    joint.axes,
    "swingTwistExcludedSwivels axes",
  );
  const vector: (a: IAutoMovieVector3, b: IAutoMovieVector3) => boolean = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): boolean => a.x === b.x && a.y === b.y && a.z === b.z;
  const axis: (
    a: IAutoMovieAxisFrame | undefined,
    b: IAutoMovieAxisFrame | undefined,
  ) => boolean = (
    a: IAutoMovieAxisFrame | undefined,
    b: IAutoMovieAxisFrame | undefined,
  ): boolean =>
    a === b ||
    (a !== undefined &&
      b !== undefined &&
      a.sign === b.sign &&
      a.neutral === b.neutral);
  return (
    vector(basis.flexion, own.flexion) &&
    vector(basis.abduction, own.abduction) &&
    vector(basis.twist, own.twist) &&
    basis.twistPlacement === own.twistPlacement &&
    basis.rotationOrder === own.rotationOrder &&
    axis(frame?.flexion, joint.frame?.flexion) &&
    axis(frame?.abduction, joint.frame?.abduction) &&
    axis(frame?.twist, joint.frame?.twist)
  );
}
