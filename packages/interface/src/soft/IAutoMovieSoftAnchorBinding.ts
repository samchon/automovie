import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Moving subject-local point driving one soft anchor.
 *
 * @evidence contracts/development/design.md#principled-representation The wearable boundary sampler rotates a node-local or actor bone-local offset by the supplied world rotation and adds the world position at each fixed-step boundary; no node/bone scale is represented or applied before simulateSoftBodyWithBoundaries receives the resolved target.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The discriminator separates node transforms from humanoid bone transforms without storing a competing static world coordinate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The wearable resolver refuses missing subjects or bones rather than replacing them by rest positions. Static simulateSoftBody currently ignores binding metadata, so its output does not establish that an authored moving owner was followed; scene evaluation owns the supplied transform.
 * @evidence contracts/development/common.md#meaningful-documentation Each arm names its stable owner, local coordinate frame and metre offset; this record is authoring input rather than a resolved world pose.
 */
export type IAutoMovieSoftAnchorBinding =
  | {
      /** Bind to a production scene node. */
      kind: "node";

      /** Stable scene-node identity. */
      node: string;

      /** Node-local anchor offset in meters. */
      offset: IAutoMovieVector3;
    }
  | {
      /** Bind to a humanoid bone on an actor. */
      kind: "actor-bone";

      /** Stable actor participant identity. */
      actor: string;

      /** Humanoid bone that owns the local point. */
      bone: AutoMovieHumanoidBone;

      /** Bone-local anchor offset in meters. */
      offset: IAutoMovieVector3;
    };
