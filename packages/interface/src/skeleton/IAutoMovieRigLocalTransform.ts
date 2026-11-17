import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple.js";
import type { AutoMovieQuaternionTuple } from "../geometry/AutoMovieQuaternionTuple.js";


/**
 * An absolute rig transform in the parent frame, without scale. Deterministic
 * rig evaluators supply this borrowed tuple view to applyAutoMovieRigLocals.
 * The transform replaces the previous local pose; it is not a rest-pose delta.
 * The adapter requires exact tuple lengths, finite components and squared
 * quaternion norm within 1e-6 of one before mutating any bone, and writes unit scale.
 *
 * IAutoMoviePhysicalProfile.ITransform instead uses mutable object components
 * named position/rotation and a frame selected by each physical-profile field.
 * IAutoMovieTransform adds authored scale to object-valued translation/rotation.
 * This read-only evaluator view preserves its tuple representation and fixed
 * parent-frame, unit-scale premise; conversion between these records is explicit.
 * Read-only access does not freeze the producer's arrays, so the producer must
 * keep them stable for the duration of an adapter call.
 *
 * @evidence contracts/development/design.md#principled-representation Uses metric translation and an x-y-z-w unit quaternion, the same translation/rotation rig convention as the engine; it carries no semantic joint angles or scaling.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One structural value describes both a bone local and a model root, without depending on a particular rig generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No model, consumer or anatomical identity selects the representation.
 * @evidence contracts/development/common.md#meaningful-documentation States absolute parent-relative coordinates, units, quaternion order and the absence of scale.
 */
export interface IAutoMovieRigLocalTransform {
  /** Translation in metres, expressed in the parent frame. */
  readonly translation: Readonly<AutoMovieVector3Tuple>;

  /** Unit quaternion in x-y-z-w order, expressed in the parent frame. */
  readonly rotation: Readonly<AutoMovieQuaternionTuple>;
}
