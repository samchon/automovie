import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { composePoseFrames } from "./composePoseFrames";
import { preparePoseBoneDemand } from "./preparePoseBoneDemand";

/**
 * One admitted pose as a value its producer can hand to every reader: each
 * rooted bone's articulation and the root it stands under, as they were when
 * the pose was admitted, with the frames composed from them on the first
 * read.
 *
 * The prepared FK state admits the pose once and calls this with what the
 * admission selected. Reading bones from the result admits nothing again and
 * composes the rig once, however many readers ask; a later edit of the
 * pose's records does not reach it, since it holds the admitted values and
 * not the records.
 *
 * @param tables The rig's rows.
 * @param indices The rig's name lookup.
 * @param admitted The admission's values: each rooted bone's selected articulation (the identity for a bone no record names) as the reading's own copy, and the root, private immutable values kept by reference.
 * @returns The reading: the demanded bones in parent-first order as a fresh map, all reachable bones when no names are given; bound indices replace the names.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the reading holds, that it is a value of the admission and not of the records, the demand rules and the fresh ownership of what it returns.
 * @evidence contracts/development/implementation.md#principled-implementation The frames are `composePoseFrames`' of the admitted articulations and root, the pass the operation's own reads take, so a bone read here has the components a read of the same admission through the operation has.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One lazy composition and one demand selection; admission, conversion and the frame arithmetic stay with their owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every returned bone is a fresh record; an unreachable name stays absent as in the operation's reader; nothing is compared or looked up to decide validity, because the reading is made only by a completed admission.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the rig at the first read, then K fresh records a read; live names sort as in the operation's reader and bound indices do not.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The composed frames are shared among the readers of this one reading, whose articulations and root never change.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the articulation row, the root's two values and one workspace of frames until its holder releases it; no pose, record or operation is retained.
 */
export function preparePoseReading(
  tables: composePoseFrames.ITables,
  indices: ReadonlyMap<AutoMovieHumanoidBone, number>,
  admitted: preparePoseReading.IAdmitted,
): preparePoseReading.IReading {
  let composed: composePoseFrames.IFrames | undefined;
  const frames: () => composePoseFrames.IFrames = (): composePoseFrames.IFrames => {
    if (composed === undefined) {
      composed = composePoseFrames.frames(tables.count);
      composePoseFrames(tables, admitted.articulations, admitted.rootRotation, admitted.rootTranslation, composed);
    }
    return composed;
  };
  const read: (
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    demand?: readonly number[],
  ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    demand?: readonly number[],
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
    const rows: composePoseFrames.IFrames = frames();
    const demanded: readonly number[] | undefined = demand ?? (requested === undefined
      ? undefined : preparePoseBoneDemand(indices, tables.count, requested));
    const count: number = demanded?.length ?? tables.count;
    const result: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
    for (let ordinal: number = 0; ordinal < count; ++ordinal) {
      const frame: IAutoMovieResolvedBone = composePoseFrames.bone(
        tables.names, rows, demanded === undefined ? ordinal : demanded[ordinal]!,
      );
      result.set(frame.bone, frame);
    }
    return result;
  };
  return Object.assign(read, { frames, names: tables.names, indices });
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
    /** The selected articulation of each rooted bone, four numbers a row: the reading's own copy. */
    readonly articulations: Float64Array;

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
  export interface IReading {
    (
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
      demand?: readonly number[],
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /** The reading's own frames, composed at the first read and never again. */
    frames(): composePoseFrames.IFrames;

    /** The rig's rooted bone names by row. */
    names: readonly AutoMovieHumanoidBone[];

    /** The rig's rows by name. */
    indices: ReadonlyMap<AutoMovieHumanoidBone, number>;
  }
}
