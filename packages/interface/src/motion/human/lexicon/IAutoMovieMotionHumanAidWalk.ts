import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanActionLaw } from "../law/IAutoMovieMotionHumanActionLaw";

/**
 * A held prop's support order and a sequence of authored floor stations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the single-grip or paired-grip prop and the staged floor stations. The law admits the held grip and placement.
 * @evidence contracts/development/design.md#principled-representation The aid's two grip counts are distinct alternatives discriminated by `kind`. Floor stations use world metres and signed yaw relative to entry in degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The action uses one prop, its selected support order, and the requested stations and timing.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A walker needs both hands and has no hand selection to combine meaninglessly. Geometry comes from the staged prop, not the request.
 */
export type IAutoMovieMotionHumanAidWalk =
  | IAutoMovieMotionHumanAidWalk.IHeld
  | IAutoMovieMotionHumanAidWalk.IWalker;

/** The aid alternatives and floor stations of the aided walk. */
export namespace IAutoMovieMotionHumanAidWalk {
  /**
   * A single-grip aid's kind.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two single-grip aids.
   * @evidence contracts/development/design.md#principled-representation A closed literal set; the staged prop supplies the geometry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The cane and crutch share one support order, so one alternative serves both.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No geometry is encoded in the kind.
   */
  export type HeldKind = "cane" | "crutch";

  /**
   * What every aided walk names: the prop and the floor stations.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the staged prop's affordances and the station sequence.
   * @evidence contracts/development/design.md#principled-representation The prop is a scene id; stations carry world metres, degrees and seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members both alternatives share, written once.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The runtime owner admits the prop's affordances and the stations' reach.
   */
  export interface ICommon {
    /**
     * The staged prop with its floor track. A cane or crutch declares a grip and a tip.
     * A walker declares two grips and a common floor tip.
     */
    prop: string;

    /** Consecutive floor stations of the body, from the held standing pose. */
    stations: readonly IStation[];
  }

  /**
   * A single-grip aid that swings with the opposite step.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the kind and the gripping hand's default.
   * @evidence contracts/development/design.md#principled-representation `kind` discriminates it from the walker.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only a single-grip aid chooses a hand.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The hand is the only per-aid choice; reach is admitted at runtime.
   */
  export interface IHeld extends ICommon {
    /** The single-grip aid. */
    kind: HeldKind;

    /** The hand that closes on the aid. Defaults to right. */
    hand?: AutoMovieHumanSide;
  }

  /**
   * A walker that advances during both-foot support.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the kind; both hands always grip.
   * @evidence contracts/development/design.md#principled-representation `kind` discriminates it from the single-grip aids.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A walker adds nothing to the shared members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts There is no hand to choose, so none can be given.
   */
  export interface IWalker extends ICommon {
    /** The two-handed walker. */
    kind: "walker";
  }

  /**
   * The aided-walk law and the prop track that moves its aid on the same clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the law and the track reader's inputs, frame and timebase.
   * @evidence contracts/development/design.md#principled-representation The track maps a film second to the aid's world rigid frame, in metres, from its start frame and the walk's stations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The law is what the vocabulary registers; the track is what the scene's prop reads, so both share one course.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The track derives every frame from the same stations the law plans, with no separately authored prop path.
   */
  export interface ILaw extends IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanAidWalk> {
    /**
     * From the aid's staged floor frame, the walk's parameters and the walk's first film second (zero when absent), the aid's world frame in metres at each film second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the start's default, the reader's timebase and the result's frame and unit.
     * @evidence contracts/development/implementation.md#principled-implementation HumanAidWalk builds the aid's moves between stations from the same `course` its plan uses, and each read holds the aid still between moves and blends one move by minimum jerk with a lift.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The law owns the aid's course; the scene's prop only reads frames from the returned reader.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every frame derives from the stations the law plans, with no separately authored prop path.
     * @evidence contracts/development/implementation.md#efficient-algorithms The course is built once per call, linear in the stations; each read scans the moves up to the current one, linear in the station count.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The returned reader reuses its one course for every film second; the plan builds its own course from the same function and inputs.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader retains the start frame and one move per station for as long as the scene holds it.
     */
    track: (
      start: IAutoMovieRigidTransform,
      props: IAutoMovieMotionHumanAidWalk,
      startsAt?: number,
    ) => (filmSecond: number) => IAutoMovieRigidTransform;
  }

  /**
   * A floor endpoint and the film time available to reach it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world position, relative turn and phase duration.
   * @evidence contracts/development/design.md#principled-representation A floor point uses only horizontal coordinates while heading and seconds are separate.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A station supplies the endpoint and timing for the rigid aid and both soles.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The runtime owner admits timing and rejects unreachable placements. The record has no joint or prop keyframes.
   */
  export interface IStation {
    /** World X displacement from the entry station, in metres. */
    x: number;

    /** World Z displacement from the entry station, in metres. */
    z: number;

    /** Heading change relative to the action entry, in degrees. Defaults to zero. */
    turn?: number;

    /** Positive film seconds to advance the aid and both feet once. */
    seconds: number;
  }
}
