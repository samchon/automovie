import type {
  IAutoMovieAxisFrame,
  IAutoMovieJointAxes,
  IAutoMovieJointRotationFrame,
  IAutoMovieRestFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { SwingTwistFramePreparation } from "./SwingTwistFramePreparation";
import { normalizeJointAxes } from "./normalizeJointAxes";

/**
 * Whether a caller's basis and rest frame are a swing-twist range's own, so
 * that the clinical angles the caller decomposes a rotation into compose
 * back, in the range's frame, to that rotation (`scanJointRom` composes them
 * on the range's axes and rest frame before reading the range): the
 * rotation itself may then be read in their place, up to the rounding of the
 * round trip.
 *
 * @param basis The basis the caller decomposes on, admitted and normalized (`normalizeJointAxes`).
 * @param frame The rest frame the caller lifts its angles by; omitted, they are rest-relative.
 * @param joint The frame the range reads the joint in.
 * @returns True when the normalized axes, the twist placement and every axis's sign and neutral agree exactly.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the equivalence the test establishes, its inputs and the exact agreement it checks.
 * @evidence contracts/development/implementation.md#principled-implementation Decomposition and composition are inverse readings on one basis and rest frame, so agreeing axes, placement, signs and neutrals make the composed rotation the decomposed one.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One normalization of the range's axes and three exact comparisons of vectors and of axis frames.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact equality only; any difference reads as not the same, so a caller keeps the composed reading.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work; a prepared range frame lends its admitted axes (`SwingTwistFramePreparation.normalized`).
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by `swingTwistExcludedSwivels` and the hinged fit's legality reading, so the condition is stated once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure test that retains nothing.
 */
export function readsSwingTwistFrame(
  basis: IAutoMovieJointAxes,
  frame: IAutoMovieRestFrame | undefined,
  joint: IAutoMovieJointRotationFrame,
): boolean {
  const own: IAutoMovieJointAxes =
    SwingTwistFramePreparation.normalized(joint, "swingTwistExcludedSwivels axes") ??
    normalizeJointAxes(joint.axes, "swingTwistExcludedSwivels axes");
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
    axis(frame?.flexion, joint.frame?.flexion) &&
    axis(frame?.abduction, joint.frame?.abduction) &&
    axis(frame?.twist, joint.frame?.twist)
  );
}
