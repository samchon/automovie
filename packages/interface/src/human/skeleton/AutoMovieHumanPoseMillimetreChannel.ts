import type { AutoMovieHumanPoseChannel } from "./AutoMovieHumanPoseChannel";

/** Canonical jaw translation/opening paths, whose scalar unit is millimetres.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Canonical jaw translation/opening paths, whose scalar unit is millimetres.
 * @evidence contracts/development/design.md#principled-representation Canonical jaw translation/opening paths, whose scalar unit is millimetres. Extract<Channel, `head.jaw.${string}`> retains the referenced owner's constraints and mutability.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanRigControls.millimetreBounds.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanRigControls.millimetreBounds for canonical jaw translation/opening paths, whose scalar unit is millimetres.
 */
export type AutoMovieHumanPoseMillimetreChannel = Extract<
  AutoMovieHumanPoseChannel,
  `head.jaw.${string}`
>;
