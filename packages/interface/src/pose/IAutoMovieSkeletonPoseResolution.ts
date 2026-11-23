import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieJointPose } from "./IAutoMovieJointPose";
import type { IAutoMoviePose } from "./IAutoMoviePose";
import type { IAutoMoviePoseResolution } from "./IAutoMoviePoseResolution";
import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";

/**
 * Contracts of an immutable prepared rig, as `prepareSkeletonPoseResolution`
 * returns it: forward kinematics of one fixed skeleton and clinical mapping,
 * independent of later edits of the source rig or tables.
 *
 * Every query admits the current complete pose it is given; only fixed rig
 * structure, demanded bone sets and the exact dependency rows of a lent
 * operation (`IAutoMoviePoseResolution`) are shared. The engine admits only
 * rigs it produced itself, by private provenance, so a structural copy of
 * these shapes is refused at run time.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states what it admits, what it returns fresh and what it may share under a lent operation, in model metres, clinical degrees and canonical bone names.
 * @evidence contracts/development/design.md#principled-representation A fixed rig (IRig) with its fixed-demand snapshot (IBoneDemand), one admitted pose's reading (IReading), a fixed-source overlay (IOverlayReader) and a staged tuple reader (ITupleReader, ITupleRead over IJoints) are the five shapes the engine's prepared forward kinematics hands out.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The engine's shot staging, attachment, foot planting and digit fits, and the motions body, borrow these readers; no member serves a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No state row, admission flag or cached answer is exposed: a reading's bone rows are its own immutable frames, read into caller storage; provenance stays the engine's runtime check, not a field of these shapes.
 */
export namespace IAutoMovieSkeletonPoseResolution {
  /**
   * Clinical flexion, abduction and twist per bone, degrees or null, in their tuple order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieSkeletonPoseResolution.IJoints: Clinical flexion, abduction and twist per bone, degrees or null, in their tuple order.
   * @evidence contracts/development/design.md#principled-representation One named type over the canonical AutoMovieHumanoidBone, IAutoMovieJointPose contracts, so its readers share one spelling of it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Its producer fills it and the enclosing IAutoMovieSkeletonPoseResolution contract's readers use it; nothing else is declared.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with its producer.
   */
  export type IJoints = Partial<
    Record<
      AutoMovieHumanoidBone,
      readonly [
        IAutoMovieJointPose["flexion"],
        IAutoMovieJointPose["abduction"],
        IAutoMovieJointPose["twist"],
      ]
    >
  >;

  /**
   * Root construction after tuple staging, before the ordered numerical admission; returns fresh resolved bones by name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieSkeletonPoseResolution.ITupleRead: Root construction after tuple staging, before the ordered numerical admission.
   * @evidence contracts/development/design.md#principled-representation One named type over the canonical IAutoMoviePose, IAutoMoviePoseResolution, AutoMovieHumanoidBone, IAutoMovieResolvedBone contracts, so its readers share one spelling of it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Its producer fills it and the enclosing IAutoMovieSkeletonPoseResolution contract's readers use it; nothing else is declared.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with its producer.
   */
  export type ITupleRead = (
    pose: Omit<IAutoMoviePose, "joints">,
    operation?: IAutoMoviePoseResolution,
  ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

  /**
   * Snapshot all current authored entries and scalars, without constructing intermediate joint records.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieSkeletonPoseResolution.ITupleReader: Snapshot all current authored entries and scalars, without constructing intermediate joint records.
   * @evidence contracts/development/design.md#principled-representation One named type, so its readers share one spelling of it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Its producer fills it and the enclosing IAutoMovieSkeletonPoseResolution contract's readers use it; nothing else is declared.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with its producer.
   */
  export type ITupleReader = (
    joints: IAutoMovieSkeletonPoseResolution.IJoints,
  ) => IAutoMovieSkeletonPoseResolution.ITupleRead;

  /**
   * A fixed source pose with its demanded bones, answering edits of it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that each read applies complete joint edits to the fixed admitted source and returns fresh frames.
   * @evidence contracts/development/design.md#principled-representation Two reads of one fixed source: a name map and a parent-first list.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IRig.preparePose` returns it for baseline-plus-edit queries.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No source record or resolved flag is presumed valid; a source edit needs a new overlay.
   */
  export interface IOverlayReader {
    /**
     * Apply complete edits to the fixed source and return fresh requested frames by name.
     */
    resolveMap(
      edits: readonly IAutoMovieJointPose[],
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /**
     * Apply complete edits to the fixed source and return fresh requested frames parent-first.
     */
    resolve(
      edits: readonly IAutoMovieJointPose[],
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): IAutoMovieResolvedBone[];
  }

  /**
   * One pose as a rig admitted it, handed by the pose's producer to the readers of its bones.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that reading admits nothing again and returns fresh frames.
   * @evidence contracts/development/design.md#principled-representation One read of the admitted articulations and root, not of the records.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IRig.read` produces it and `IBoneDemand.read` consumes it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A later edit of the pose needs a new reading; none is inferred.
   */
  export interface IReading {
    /**
     * The requested reachable bones parent-first, all of them when no names are given, as a fresh map of fresh frames.
     */
    map(
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /**
     * A bone's row in the reading (the rig's rooted parent-first order), or -1 for a bone the rig does not reach: the index the frame reads take.
     */
    index(bone: AutoMovieHumanoidBone): number;

    /**
     * The world position of the bone at a row, model metres, written into the caller's vector: the record `map` returns for it would hold the same numbers.
     */
    position(index: number, into: IAutoMovieVector3): IAutoMovieVector3;

    /**
     * The world rotation of the bone at a row, written into the caller's quaternion.
     */
    rotation(index: number, into: IAutoMovieQuaternion): IAutoMovieQuaternion;

    /**
     * The bone at a row as a fresh record, for a caller that keeps it.
     */
    bone(index: number): IAutoMovieResolvedBone;
  }

  /**
   * A rig's fixed requested-bone snapshot; queries supply complete current poses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three reads of the captured bones and what each admits.
   * @evidence contracts/development/design.md#principled-representation The demand fixes reachable output membership and order once; every read admits its own pose or reading.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IRig.prepareBones` produces it for attachment, foot planting and re-keying.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Numeric indices and state stay private; a reading of another rig is refused.
   */
  export interface IBoneDemand {
    /**
     * The captured bones of a pose this rig already admitted (`IRig.read`), fresh, without admitting again; a reading of another rig or a copied one throws.
     */
    read(
      reading: IAutoMovieSkeletonPoseResolution.IReading,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /**
     * Admit the current complete pose and return the captured bones as a fresh map.
     */
    map(
      pose: IAutoMoviePose,
      operation?: IAutoMoviePoseResolution,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /**
     * Admit the current complete pose and return the captured bones' fresh model-metre frames in capture order.
     */
    resolve(
      pose: IAutoMoviePose,
      operation?: IAutoMoviePoseResolution,
    ): IAutoMovieResolvedBone[];
  }

  /**
   * Immutable prepared forward kinematics of one fixed rig and clinical mapping.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its admission, its optional demand or lent operation and its fresh result.
   * @evidence contracts/development/design.md#principled-representation One rig answers complete poses, fixed-source edits, staged tuples, demanded bones and single joints, plus the merged raw axes its inverse kinematics reuses.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `prepareSkeletonPoseResolution` produces it; staging, attachment, planting, digit fits and the motions body read it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No numeric index or state row is accepted or exposed; source and table edits need a new rig.
   */
  export interface IRig {
    /**
     * Bind fixed output names, then stage each current tuple map before root construction.
     */
    prepareTuples(
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): IAutoMovieSkeletonPoseResolution.ITupleReader;

    /**
     * Admit one current clinical joint against the rig's fixed axes and frame and return a fresh quaternion.
     * Every coordinate of a record the rig has not admitted before is checked;
     * a record it already admitted is a value, read again as the value it was
     * admitted as, since a joint record is not edited after admission.
     */
    joint(
      joint: IAutoMovieJointPose,
      operation?: IAutoMoviePoseResolution,
    ): IAutoMovieQuaternion;

    /**
     * Admit and snapshot a fixed source pose, optionally binding names, for baseline-plus-edit queries.
     */
    preparePose(
      source: IAutoMoviePose,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
      operation?: IAutoMoviePoseResolution,
    ): IAutoMovieSkeletonPoseResolution.IOverlayReader;

    /**
     * Snapshot reachable requested names and their order once for repeated queries.
     */
    prepareBones(
      requested: ReadonlySet<AutoMovieHumanoidBone>,
    ): IAutoMovieSkeletonPoseResolution.IBoneDemand;

    /**
     * Admit a complete pose once and return it as a reading for every consumer of that pose's bones.
     */
    read(
      pose: IAutoMoviePose,
      operation?: IAutoMoviePoseResolution,
    ): IAutoMovieSkeletonPoseResolution.IReading;

    /** Immutable merged raw-axis snapshot for the same rig's inverse kinematics; normalization stays lazy at each use. */
    readonly jointAxes: Readonly<
      Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
    >;

    /**
     * Admit the current pose in order and return fresh requested frames directly into a name map.
     */
    resolveMap(
      pose: IAutoMoviePose,
      operation?: IAutoMoviePoseResolution,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /**
     * Admit the current pose in order and return fresh requested model-metre frames, all when names are absent.
     */
    resolve(
      pose: IAutoMoviePose,
      operation?: IAutoMoviePoseResolution,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): IAutoMovieResolvedBone[];
  }
}
