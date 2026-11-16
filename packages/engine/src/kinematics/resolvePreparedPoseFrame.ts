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
 * @evidence contracts/development/common.md#meaningful-documentation Defines immutable private operands, internal row mutation, the public cloning boundary and IReading's frame, parent operand and rotated metre-offset roles below.
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
 * @evidence contracts/development/design.md#principled-representation IReading couples one private resolved frame to its actual immutable parent quaternion/position and parent-rotated fixed rest offset in model metres. Its frame holds the local quaternion and completed world values; the prepared producer supplies unit/fixed-input premises instead of the type claiming runtime admission.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only prepared root-relative/placed FK reads or updates IReading. Existing interface quaternion/vector and resolved-bone types own numerical data; exactly these four fields distinguish local, rotation and translation changes without a raw-input admission option.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Operand references are actual private immutable producer values, never shape-based trust, raw caller identity or a special rig. No time, target, chosen solution, admission flag or unbounded result history is represented.
 */
export namespace resolvePreparedPoseFrame {
  /**
   * Mutable private storage whose referenced numerical operands remain immutable.
   *
   * The row holds one composed frame and the actual immutable operands that
   * produced it. Positions/offsets are model metres; only cloned frames leave
   * the prepared owner, and one row lives per demanded operation bone.
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
