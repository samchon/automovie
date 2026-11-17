import type { IAutoMovieHumanPoseChannels } from "./IAutoMovieHumanPoseChannels";
import type { IAutoMovieHumanRigControls } from "./IAutoMovieHumanRigControls";

/** Exact Human FK joint identities, including original custom finger/foot joints.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Exact Human FK joint identities, including original custom finger/foot joints.
 * @evidence contracts/development/design.md#principled-representation Exact Human FK joint identities, including original custom finger/foot joints. Expand< (readonly IAutoMovieHumanPoseChannels.Channel[])[number][1] > retains the referenced owner's constraints and mutability.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanRigControls.joint, AutoMovieHumanRigControls.isJoint.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanRigControls.joint, AutoMovieHumanRigControls.isJoint for exact Human FK joint identities, including original custom finger/foot joints.
 */
export type AutoMovieHumanJointName = IAutoMovieHumanRigControls.Expand<
  (readonly IAutoMovieHumanPoseChannels.Channel[])[number][1]
>;
