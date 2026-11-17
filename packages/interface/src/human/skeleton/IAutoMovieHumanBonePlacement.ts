import type { AutoMovieQuaternionTuple } from "../../geometry/AutoMovieQuaternionTuple";
import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/** One bone's world placement: geometry at the bind moves rigidly with it.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation One bone's world placement: geometry at the bind moves rigidly with it.
 * @evidence contracts/development/design.md#principled-representation `bone`: Bone id. `position`: Joint position in Human registered body coordinates, metres (+X forward, +Y up, +Z anatomical left); no authored scene transform is applied. `rotation`: Unit quaternion `[x, y, z, w]` rotating the achieved bind geometry into this placement in Human registered coordinates; identity leaves the bind orientation unchanged.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanCanonicalBody.posed, AutoMovieHumanPreparedKinematics.posed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `bone`, `position`, `rotation`; callers supply the complete record.
 */
export interface IAutoMovieHumanBonePlacement {
  /** Bone id. */
  bone: string;

  /** Joint position in Human registered body coordinates, metres (+X forward, +Y up, +Z anatomical left); no authored scene transform is applied. */
  position: AutoMovieVector3Tuple;

  /** Unit quaternion `[x, y, z, w]` rotating the achieved bind geometry into this placement in Human registered coordinates; identity leaves the bind orientation unchanged. */
  rotation: AutoMovieQuaternionTuple;
}
