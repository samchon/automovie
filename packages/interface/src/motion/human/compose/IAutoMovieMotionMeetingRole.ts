import type { IAutoMoviePose } from "../../../pose/IAutoMoviePose";
import type { IAutoMovieResolvedBone } from "../../../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/**
 * A participating performer's named role and resolved body frame for meeting
 * negotiation. The borrowed bones expose world placement without allowing the
 * meeting to replace the rig.
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

  /**
   * Whether a seat bears the performer then, so a reach may lean the trunk over
   * the seat; standing when absent.
   */
  seated?: boolean;

  /**
   * The performer's posture and pose there, which a role's timing reads its
   * arm's own reach on (`touchReach.place`); a timing that needs no arm reads
   * none.
   */
  entry?: { posture: IAutoMovieMotionHumanPosture; pose: IAutoMoviePose };
}
