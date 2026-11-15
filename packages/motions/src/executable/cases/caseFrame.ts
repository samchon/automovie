import type {
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A capture case's fixture contact frame: a place and a turn, at the identity scale every `IAutoMovieTransform` carries.
 *
 * @param translation The frame's origin in the prop's space, metres.
 * @param rotation The frame's turn in the prop's space.
 * @returns The frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the frame is and why it carries a scale.
 * @evidence contracts/development/implementation.md#principled-implementation The transform the interface defines, unscaled, as a contact frame is.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The one place the cases' fixture props build a contact frame.
 * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Plain data, nothing to shortcut.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One record.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function caseFrame(
  translation: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
): IAutoMovieTransform {
  return { translation, rotation, scale: { x: 1, y: 1, z: 1 } };
}
