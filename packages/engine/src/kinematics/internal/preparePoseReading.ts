import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { composePoseFrames } from "./composePoseFrames";
import { preparePoseBoneDemand } from "./preparePoseBoneDemand";

/*
 * One admitted pose as a value its producer can hand to every reader: each
 * rooted bone's articulation and the root it stands under, as they were when
 * the pose was admitted, with the frames composed from them on the first read.
 *
 * The prepared FK state admits the pose once and calls this with what the
 * admission selected. Reading bones from the result admits nothing again and
 * composes the rig once, however many readers ask; a later edit of the pose's
 * records does not reach it, since it holds the admitted values and not the
 * records.
 * Parameter tables: The rig's rows.
 * Parameter indices: The rig's name lookup.
 * Parameter admitted: The admission's values: each rooted bone's selected
 * articulation (the identity for a bone no record names) as the reading's own
 * copy, and the root, private immutable values kept by reference.
 * Returns: The reading: the demanded bones in parent-first order as a fresh
 * map, all reachable bones when no names are given; bound indices replace the
 * names.
 */
export function preparePoseReading(
  tables: composePoseFrames.ITables,
  indices: ReadonlyMap<AutoMovieHumanoidBone, number>,
  admitted: preparePoseReading.IAdmitted,
): preparePoseReading.IReading {
  const composed: composePoseFrames.IFrames = composePoseFrames.frames(
    tables.count,
  );
  composePoseFrames(
    tables,
    admitted.articulations,
    admitted.rootRotation,
    admitted.rootTranslation,
    composed,
  );
  const frames: () => composePoseFrames.IFrames =
    (): composePoseFrames.IFrames => composed;
  const read: (
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    demand?: readonly number[],
  ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    demand?: readonly number[],
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
    const rows: composePoseFrames.IFrames = frames();
    const demanded: readonly number[] | undefined =
      demand ??
      (requested === undefined
        ? undefined
        : preparePoseBoneDemand(indices, tables.count, requested));
    const count: number = demanded?.length ?? tables.count;
    const result: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      new Map();
    for (let ordinal: number = 0; ordinal < count; ++ordinal) {
      const frame: IAutoMovieResolvedBone = composePoseFrames.bone(
        tables.names,
        rows,
        demanded === undefined ? ordinal : demanded[ordinal]!,
      );
      result.set(frame.bone, frame);
    }
    return result;
  };
  return Object.assign(read, { frames, names: tables.names, indices });
}

/*
 * The reading's type.
 */
export namespace preparePoseReading {
  /*
   * What a reading takes of an operation's state after a complete admission.
   */
  export interface IAdmitted {
    /*
     * The selected articulation of each rooted bone, four numbers a row: the
     * reading's own copy.
     */
    readonly articulations: Float64Array;

    /*
     * The root's rotation, owned by the state and never mutated.
     */
    readonly rootRotation: IAutoMovieQuaternion;

    /*
     * The root's translation, model metres, likewise.
     */
    readonly rootTranslation: IAutoMovieVector3;
  }

  /*
   * The bones of one admitted pose: the demanded ones as a fresh map in
   * parent-first order, all reachable bones when neither argument is given;
   * `demand`, the rig's own bound indices, replaces `requested`.
   */
  export interface IReading {
    (
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
      demand?: readonly number[],
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /*
     * The reading's own frames, composed at the first read and never again.
     */
    frames(): composePoseFrames.IFrames;

    /*
     * The rig's rooted bone names by row.
     */
    names: readonly AutoMovieHumanoidBone[];

    /*
     * The rig's rows by name.
     */
    indices: ReadonlyMap<AutoMovieHumanoidBone, number>;
  }
}
