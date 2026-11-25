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
 * rigs it produced itself, by private provenance, so a structural copy of these
 * shapes is refused at run time.
 */
export namespace IAutoMovieSkeletonPoseResolution {
  /**
   * Clinical flexion, abduction and twist per bone, degrees or null, in their
   * tuple order.
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
   * Root construction after tuple staging, before the ordered numerical
   * admission; returns fresh resolved bones by name.
   */
  export type ITupleRead = (
    pose: Omit<IAutoMoviePose, "joints">,
    operation?: IAutoMoviePoseResolution,
  ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

  /**
   * Snapshot all current authored entries and scalars, without constructing
   * intermediate joint records.
   */
  export type ITupleReader = (
    joints: IAutoMovieSkeletonPoseResolution.IJoints,
  ) => IAutoMovieSkeletonPoseResolution.ITupleRead;

  /** A fixed source pose with its demanded bones, answering edits of it. */
  export interface IOverlayReader {
    /**
     * Apply complete edits to the fixed source and return fresh requested
     * frames by name.
     */
    resolveMap(
      edits: readonly IAutoMovieJointPose[],
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /**
     * Apply complete edits to the fixed source and return fresh requested
     * frames parent-first.
     */
    resolve(
      edits: readonly IAutoMovieJointPose[],
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): IAutoMovieResolvedBone[];
  }

  /**
   * One pose as a rig admitted it, handed by the pose's producer to the readers
   * of its bones.
   */
  export interface IReading {
    /**
     * The requested reachable bones parent-first, all of them when no names are
     * given, as a fresh map of fresh frames.
     */
    map(
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /**
     * A bone's row in the reading (the rig's rooted parent-first order), or -1
     * for a bone the rig does not reach: the index the frame reads take.
     */
    index(bone: AutoMovieHumanoidBone): number;

    /**
     * The world position of the bone at a row, model metres, written into the
     * caller's vector: the record `map` returns for it would hold the same
     * numbers.
     */
    position(index: number, into: IAutoMovieVector3): IAutoMovieVector3;

    /**
     * The world rotation of the bone at a row, written into the caller's
     * quaternion.
     */
    rotation(index: number, into: IAutoMovieQuaternion): IAutoMovieQuaternion;

    /** The bone at a row as a fresh record, for a caller that keeps it. */
    bone(index: number): IAutoMovieResolvedBone;
  }

  /**
   * A rig's fixed requested-bone snapshot; queries supply complete current
   * poses.
   */
  export interface IBoneDemand {
    /**
     * The captured bones of a pose this rig already admitted (`IRig.read`),
     * fresh, without admitting again; a reading of another rig or a copied one
     * throws.
     */
    read(
      reading: IAutoMovieSkeletonPoseResolution.IReading,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /**
     * Admit the current complete pose and return the captured bones as a fresh
     * map.
     */
    map(
      pose: IAutoMoviePose,
      operation?: IAutoMoviePoseResolution,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /**
     * Admit the current complete pose and return the captured bones' fresh
     * model-metre frames in capture order.
     */
    resolve(
      pose: IAutoMoviePose,
      operation?: IAutoMoviePoseResolution,
    ): IAutoMovieResolvedBone[];
  }

  /**
   * Immutable prepared forward kinematics of one fixed rig and clinical
   * mapping.
   */
  export interface IRig {
    /**
     * Bind fixed output names, then stage each current tuple map before root
     * construction.
     */
    prepareTuples(
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): IAutoMovieSkeletonPoseResolution.ITupleReader;

    /**
     * Admit one current clinical joint against the rig's fixed axes and frame
     * and return a fresh quaternion. Every coordinate of a record the rig has
     * not admitted before is checked; a record it already admitted is a value,
     * read again as the value it was admitted as, since a joint record is not
     * edited after admission.
     */
    joint(
      joint: IAutoMovieJointPose,
      operation?: IAutoMoviePoseResolution,
    ): IAutoMovieQuaternion;

    /**
     * Admit and snapshot a fixed source pose, optionally binding names, for
     * baseline-plus-edit queries.
     */
    preparePose(
      source: IAutoMoviePose,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
      operation?: IAutoMoviePoseResolution,
    ): IAutoMovieSkeletonPoseResolution.IOverlayReader;

    /**
     * Snapshot reachable requested names and their order once for repeated
     * queries.
     */
    prepareBones(
      requested: ReadonlySet<AutoMovieHumanoidBone>,
    ): IAutoMovieSkeletonPoseResolution.IBoneDemand;

    /**
     * Admit a complete pose once and return it as a reading for every consumer
     * of that pose's bones.
     */
    read(
      pose: IAutoMoviePose,
      operation?: IAutoMoviePoseResolution,
    ): IAutoMovieSkeletonPoseResolution.IReading;

    /**
     * Immutable merged raw-axis snapshot for the same rig's inverse kinematics;
     * normalization stays lazy at each use.
     */
    readonly jointAxes: Readonly<
      Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
    >;

    /**
     * Admit the current pose in order and return fresh requested frames
     * directly into a name map.
     */
    resolveMap(
      pose: IAutoMoviePose,
      operation?: IAutoMoviePoseResolution,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /**
     * Admit the current pose in order and return fresh requested model-metre
     * frames, all when names are absent.
     */
    resolve(
      pose: IAutoMoviePose,
      operation?: IAutoMoviePoseResolution,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): IAutoMovieResolvedBone[];
  }
}
