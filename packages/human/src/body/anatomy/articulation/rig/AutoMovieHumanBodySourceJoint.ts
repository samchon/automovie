import type { IAutoMovieHumanBodySourceAxesJoint } from "./IAutoMovieHumanBodySourceAxesJoint";
import type { IAutoMovieHumanBodySourceFixedJoint } from "./IAutoMovieHumanBodySourceFixedJoint";
import type { IAutoMovieHumanBodySourceHumerothoracicJoint } from "./IAutoMovieHumanBodySourceHumerothoracicJoint";
import type { IAutoMovieHumanBodySourcePublicPoseJoint } from "./IAutoMovieHumanBodySourcePublicPoseJoint";
import type { IAutoMovieHumanBodySourceToeRayJoint } from "./IAutoMovieHumanBodySourceToeRayJoint";

/**
 * Anatomical source kinematics; an axial/sliding axis remains independent of a fixed carrier.
 *
 * @evidence contracts/common.md#principled-implementation The joint kind union distinguishes fixed carry, clinical public pose, toe-ray motion, ordered axes and thorax-relative arm resolution.
 * @evidence contracts/common.md#clear-and-simple-design Each kinematic representation lives in its own record, allowing the graph resolver to dispatch on a closed kind discriminator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Axial and sliding source coordinates remain distinct alternatives instead of being compensated by a fixed carrier transform.
 * @evidence contracts/common.md#meaningful-documentation The description identifies source kinematics and preserves the distinction between fixed carry and independently authored motion.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This joint-kind sum type dispatches no transforms until a graph resolver consumes its variant.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Joint variant definitions own no evaluated frame cache or concurrent solve work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The union declaration retains no bone graph instance or numerical workspace.
 * @author Samchon
 */
export type AutoMovieHumanBodySourceJoint =
  | IAutoMovieHumanBodySourceFixedJoint
  | IAutoMovieHumanBodySourcePublicPoseJoint
  | IAutoMovieHumanBodySourceToeRayJoint
  | IAutoMovieHumanBodySourceAxesJoint
  | IAutoMovieHumanBodySourceHumerothoracicJoint;
