import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Moving subject-local point driving one soft anchor.
 *
 * @evidence contracts/common.md#principled-implementation The wearable boundary sampler transforms a node-local offset or an actor bone-local offset at fixed-step boundaries before simulateSoftBodyWithBoundaries applies the resolved world target.
 * @evidence contracts/common.md#clear-and-simple-design The discriminator separates node transforms from humanoid bone transforms without storing a competing static world coordinate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unresolved owner cannot be replaced by the rest position and claimed as a moving solve; scene evaluation owns the transform.
 * @evidence contracts/common.md#meaningful-documentation Each arm names its stable owner, local coordinate frame and metre offset; this record is authoring input rather than a resolved world pose.
 * @author Samchon
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
