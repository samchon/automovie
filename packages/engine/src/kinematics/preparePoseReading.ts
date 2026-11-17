import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import { PoseResolutionSnapshot } from "./PoseResolutionSnapshot";
import { preparePoseBoneDemand } from "./preparePoseBoneDemand";
import type { preparePoseResolutionChanges } from "./preparePoseResolutionChanges";
import type { preparePoseResolutionState } from "./preparePoseResolutionState";
import { resolvePreparedPoseFrame } from "./resolvePreparedPoseFrame";

/** The articulation that leaves a bone at its rest; no frame a caller receives aliases it. */
const IDENTITY: IAutoMovieQuaternion = Object.freeze(Quaternion.identity());

/**
 * One admitted pose as a value its producer can hand to every reader: each
 * rooted bone's articulation and the root it stands under, as they were when
 * the pose was admitted, with the frames composed from them kept as they are
 * first asked for.
 *
 * The prepared FK state admits the pose once and calls this with what the
 * admission selected. Reading bones from the result admits nothing again and
 * composes each bone at most once, however many readers ask; a later edit of
 * the pose's records does not reach it, since it holds the admitted values
 * and not the records.
 *
 * @param nodes The rig's rooted nodes, parent first.
 * @param indices The rig's name lookup.
 * @param admitted The operation state just after the pose's complete admission: each rooted bone's selected articulation (the identity for a bone no record names) and the root, private immutable values read here once and kept by reference.
 * @returns The reading: the demanded bones in parent-first order as a fresh map, all reachable bones when no names are given; bound indices replace the names.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the reading holds, that it is a value of the admission and not of the records, the demand rules and the fresh ownership of what it returns.
 * @evidence contracts/development/implementation.md#principled-implementation A frame is its parent's rotation times the bone's local rotation, at the parent's position plus the parent-rotated rest offset, the local rotation being the rest rotation times the articulation: the products, operands and frame owner of the operation's own rows, so a bone read here has the components a read of the same admission through the operation has.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One memoized parent-first recurrence and one demand selection; admission, conversion and the frame arithmetic stay with their owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every returned bone is a copy; an unreachable name stays absent as in the operation's reader; nothing is compared or looked up to decide validity, because the reading is made only by a completed admission.
 * @evidence contracts/development/implementation.md#efficient-algorithms K demanded bones compute their uncomputed ancestors once a reading and copy K frames; live names sort as in the operation's reader and bound indices do not.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Frames are shared among the readers of this one reading, whose articulations and root never change.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds B articulation references, the root's two values and at most B private frames until its holder releases it; no pose, record or operation is retained.
 */
export function preparePoseReading(
  nodes: readonly preparePoseResolutionState.INode[],
  indices: ReadonlyMap<AutoMovieHumanoidBone, number>,
  admitted: preparePoseReading.IAdmitted,
): preparePoseReading.IReading {
  // The admission's values are taken now: the state they come from goes on
  // to other poses, and its private quaternions and root are never mutated.
  const rotations: IAutoMovieQuaternion[] = [];
  for (let index: number = 0; index < nodes.length; ++index) rotations.push(admitted.changes.read(index));
  const rootRotation: IAutoMovieQuaternion = admitted.rootRotation;
  const rootTranslation: IAutoMovieVector3 = admitted.rootTranslation;
  const frames: (IAutoMovieResolvedBone | undefined)[] = [];

  /** One bone's private frame, its ancestors first. */
  function frameOf(index: number): IAutoMovieResolvedBone {
    const known: IAutoMovieResolvedBone | undefined = frames[index];
    if (known !== undefined) return known;
    const node: preparePoseResolutionState.INode = nodes[index]!;
    const parent: IAutoMovieResolvedBone | undefined = node.parent < 0 ? undefined : frameOf(node.parent);
    const articulation: IAutoMovieQuaternion = rotations[index]!;
    const local: IAutoMovieQuaternion = PoseResolutionSnapshot.sameQuaternion(articulation, IDENTITY)
      ? (node.identityLocalRotation ??= Quaternion.multiply(node.rotation, IDENTITY))
      : Quaternion.multiply(node.rotation, articulation);
    const frame: IAutoMovieResolvedBone = resolvePreparedPoseFrame(
      node.name, node.translation, local,
      parent?.worldRotation ?? rootRotation, parent?.worldPosition ?? rootTranslation,
    ).frame;
    frames[index] = frame;
    return frame;
  }
  return (
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    demand?: readonly number[],
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
    const demanded: readonly number[] | undefined = demand ?? (requested === undefined
      ? undefined : preparePoseBoneDemand(indices, nodes.length, requested));
    const count: number = demanded?.length ?? nodes.length;
    const result: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
    for (let ordinal: number = 0; ordinal < count; ++ordinal) {
      const frame: IAutoMovieResolvedBone = resolvePreparedPoseFrame.copy(
        frameOf(demanded === undefined ? ordinal : demanded[ordinal]!),
      );
      result.set(frame.bone, frame);
    }
    return result;
  };
}

/**
 * The reading's type.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the one type and its two demand forms.
 * @evidence contracts/development/design.md#principled-representation A reading is a function from a bone demand to fresh world frames in model metres, closed over one admission's values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The prepared FK state makes it and the rig lends it to pose producers; live names serve ordinary readers and bound indices the rig's own fixed demands.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts It carries no pose, time or validity flag.
 */
export namespace preparePoseReading {
  /**
   * What a reading takes of an operation's state after a complete admission.
   */
  export interface IAdmitted {
    /** The selected articulation of each rooted bone. */
    readonly changes: Pick<preparePoseResolutionChanges.ITracker, "read">;

    /** The root's rotation, owned by the state and never mutated. */
    readonly rootRotation: IAutoMovieQuaternion;

    /** The root's translation, model metres, likewise. */
    readonly rootTranslation: IAutoMovieVector3;
  }

  /**
   * The bones of one admitted pose: the demanded ones as a fresh map in
   * parent-first order, all reachable bones when neither argument is given;
   * `demand`, the rig's own bound indices, replaces `requested`.
   */
  export type IReading = (
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    demand?: readonly number[],
  ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
}
