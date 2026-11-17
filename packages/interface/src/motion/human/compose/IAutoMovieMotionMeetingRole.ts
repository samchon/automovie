import type { IAutoMovieResolvedBone } from "../../../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/**
 * A participating performer's named role and resolved body frame for meeting negotiation. The borrowed bones expose world placement without allowing the meeting to replace the rig.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A participating performer's named role and resolved body frame for meeting negotiation. The borrowed bones expose world placement without allowing the meeting to replace the rig.
 * @evidence contracts/development/design.md#principled-representation What a kind needs to place contacts and time a role: who it is, its body, where it stands and where its bones are at the start.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Meeting providers receive the participant body, root/yaw and borrowed resolved bone placement needed for contact negotiation; authored performer configuration remains separate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The readonly bone view exposes world position/rotation without granting rig mutation. AutoMovieMotionMeeting and its caller own participant lookup and preparation.
 */
export interface IAutoMovieMotionMeetingRole {
  /** The role's name within the kind (`giver`, `attacker`). */
  name: string;

  /** The performer's subject id. */
  subject: string;

  /** The performer's body. */
  body: IAutoMovieMotionHumanBody;

  /** Where the performer stands. */
  posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">;

  /** The performer's world bones there. */
  bones: ReadonlyMap<
    AutoMovieHumanoidBone,
    Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">
  >;

  /** Whether a seat bears the performer then, so a reach may lean the trunk over the seat; standing when absent. */
  seated?: boolean;
}
