import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";

/**
 * Update one private frame of an immutable prepared rig. Every quaternion,
 * parent position and rest offset must be an own-data value held unchanged
 * by prepareSkeletonPoseResolution. Public outputs are cloned by that owner;
 * this function may update the prior private row and its frame in place.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the immutable private-input premise, internal row mutation and the producer's public cloning boundary.
 * @evidence contracts/development/implementation.md#principled-implementation Preserves ordinary FK's parent-times-local quaternion product and parent position plus the parent-rotated rest offset. A local rotation cannot move its own origin; a parent translation changes only the sum, so unchanged private operand identities justify reusing that pure rotation/offset work.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One owner composes both root-relative and placed prepared frames; dependency revisions and demanded hierarchy remain in prepareSkeletonPoseResolution.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Identity equivalence is limited to actual private immutable values supplied by the prepared producer, never raw caller objects or a user-set admission flag. No rotation normalization, tolerance, scale convention or arithmetic reassociation is added.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per changed frame. Unchanged parent rotation shares its rotated rest offset; unchanged local and parent rotations share the world quaternion; unchanged parent placement shares world position. First demand allocates one row/frame, later updates reuse them. Runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller owns fixed rest data and private immutable local/parent records. Exact identity proves equal scalars only under that producer's premise. This row stores the actual private operands and rotated offset, so translation-only root or ancestor changes require only the original vector addition.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One row holds one frame, two private parent operand references and one rotated offset, bounded per demanded rig bone by the operation's owner. No public result, raw pose, source rig, history, task or handle is retained.
 */
export function resolvePreparedPoseFrame(
  bone: AutoMovieHumanoidBone,
  translation: IAutoMovieVector3,
  localRotation: IAutoMovieQuaternion,
  parentRotation: IAutoMovieQuaternion,
  parentPosition: IAutoMovieVector3,
  known?: resolvePreparedPoseFrame.IReading,
): resolvePreparedPoseFrame.IReading {
  const sameRotation: boolean = known?.parentRotation === parentRotation;
  const samePosition: boolean = known?.parentPosition === parentPosition;
  const worldRotation: IAutoMovieQuaternion = sameRotation &&
    known!.frame.localRotation === localRotation
    ? known!.frame.worldRotation : Quaternion.multiply(parentRotation, localRotation);
  const offset: IAutoMovieVector3 = sameRotation ? known!.offset
    : Quaternion.rotateVector(parentRotation, translation);
  const worldPosition: IAutoMovieVector3 = sameRotation && samePosition
    ? known!.frame.worldPosition : Vector3.add(parentPosition, offset);
  if (known === undefined)
    return { frame: { bone, localRotation, worldRotation, worldPosition },
      parentRotation, parentPosition, offset };
  known.frame.localRotation = localRotation;
  known.frame.worldRotation = worldRotation;
  known.frame.worldPosition = worldPosition;
  known.parentRotation = parentRotation;
  known.parentPosition = parentPosition;
  known.offset = offset;
  return known;
}

/**
 * Private own-data operand row used only by prepared FK.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the frame and immutable operand references that justify exact computation reuse.
 * @evidence contracts/development/design.md#principled-representation A frame depends on one local quaternion, parent rotation/position and fixed rest offset in model metres. The row retains the parent operands and their rotated offset; its frame holds the local operand and completed world values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only prepared root-relative/placed FK reads or updates the row. Existing interface quaternion/vector and resolved-bone types own all numerical data, and no raw-input admission option is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts These references mean exact private immutable producer values, not shape-based trust, external object identity or a special rig. The row contains no target, time, solution or unbounded result history.
 */
export namespace resolvePreparedPoseFrame {
  /**
   * Mutable private storage whose referenced numerical operands remain immutable.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States internal mutation and each member's frame/ownership role.
   * @evidence contracts/development/design.md#principled-representation Holds one composed bone frame, its actual immutable parent operands and the rotated fixed rest offset; all positions/offsets are model metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Exactly the values resolvePreparedPoseFrame needs to distinguish rotation, translation and local-articulation changes; callers expose only cloned frames.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No raw-input certificate, cached target answer or global entry is encoded; the enclosing prepared operation owns one row per demanded bone.
   */
  export interface IReading {
    /** Private completed frame, copied before public return. */
    frame: IAutoMovieResolvedBone;

    /** Immutable private parent orientation used by the completed products. */
    parentRotation: IAutoMovieQuaternion;

    /** Immutable private parent position used by the completed sum. */
    parentPosition: IAutoMovieVector3;

    /** Parent-rotated fixed rest translation in model metres. */
    offset: IAutoMovieVector3;
  }
}
