import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * Update one private frame of an immutable prepared rig. Every quaternion,
 * parent position and rest offset must be an own-data value held unchanged
 * by prepareSkeletonPoseResolution. Public outputs are cloned by that owner;
 * this function may update the prior private row and its frame in place.
 * readRest lends an actually computed immutable rig-rest row into independent
 * operation storage after its owner proves the current operands are that rest.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines immutable private operands, internal row mutation, genuine static-rest borrowing, independent operation storage, copy's fresh nested output boundary and IReading's operand/offset roles below.
 * @evidence contracts/development/implementation.md#principled-implementation Preserves ordinary FK's parent-times-local quaternion product and parent position plus the parent-rotated rest offset. A local rotation cannot move its own origin; a parent translation changes only the sum. readRest reuses the actual completed same-operand rest computation only after the owning rig proves current rest/ancestor operands, copying its immutable numerical references into separate mutable operation storage.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One owner composes root-relative/placed frames, borrows genuinely computed static-rest values and copies public output. Array/map/rest readers all use that copier; the prepared rig alone owns rest eligibility, dependency revisions and demanded hierarchy.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Identity equivalence is limited to actual private immutable values supplied by the prepared producer, never raw caller objects or a user-set admission flag. No rotation normalization, tolerance, scale convention or arithmetic reassociation is added.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per changed frame. Equal parent rotation shares its rotated offset; equal local/parent rotations share the world quaternion; equal parent placement shares world position. Actual static-rest borrowing performs only constant field copies across operations. First demand allocates independent row/frame storage, later updates reuse it. Runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed rest data/private operands belong to the producer. Exact private identity proves equal values only under that immutable premise. A genuine rig-rest row contains the actual completed neutral computation, never a claimed resolved flag, and readRest shares only its fixed numerical operands/results without lending its mutable container.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each row owns one frame, parent operand references and rotated offset. Static rest rows end with the immutable rig; independent operation containers end with that reader, sharing no operation row back into the rig. No public result, raw pose, history, task or handle is retained.
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
   * Copy an actual private frame into independent mutable public ownership.
   * The frame plus local/world quaternions and world position are each fresh;
   * no output aliases another bone, earlier output or private operand. This
   * constant-size own-data copy performs no validation or arithmetic and is
   * shared by array/map/rest output writers. Only the caller retains its
   * result; no source, operation row or output history is retained here.
   */
  export function copy(frame: IAutoMovieResolvedBone): IAutoMovieResolvedBone {
    return { bone: frame.bone, localRotation: { ...frame.localRotation },
      worldRotation: { ...frame.worldRotation }, worldPosition: { ...frame.worldPosition } };
  }

  /**
   * Borrow actual immutable rig-rest values after the producer proves current
   * identity articulation and the exact static parent rotation/position.
   * Constant field copies preserve computed arithmetic and signed zeros; no
   * raw pose or caller flag is admitted here. Mutable frame/row containers
   * remain independent of the static row, and public outputs are still cloned
   * by the operation owner. Release this row with that operation.
   */
  export function readRest(rest: IReading, known?: IReading): IReading {
    if (known === undefined) return { ...rest, frame: { ...rest.frame } };
    known.frame.localRotation = rest.frame.localRotation;
    known.frame.worldRotation = rest.frame.worldRotation;
    known.frame.worldPosition = rest.frame.worldPosition;
    known.parentRotation = rest.parentRotation;
    known.parentPosition = rest.parentPosition;
    known.offset = rest.offset;
    return known;
  }

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
