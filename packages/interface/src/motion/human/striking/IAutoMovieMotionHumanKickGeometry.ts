import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMoviePose } from "../../../pose/IAutoMoviePose";
import type { IAutoMoviePoseResolution } from "../../../pose/IAutoMoviePoseResolution";
import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import type { IAutoMovieMotionHumanActionContext } from "../law/IAutoMovieMotionHumanActionContext";
import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanKick } from "./IAutoMovieMotionHumanKick";
import type { IAutoMovieMotionHumanStrikingRecord } from "./IAutoMovieMotionHumanStrikingRecord";

/**
 * A built kick: the body's carriage, the kicking leg's goal (the ankle, the
 * knee's bend hint and the foot's rotation) and the feet's contact windows,
 * each a pure function of the seconds since the kick's own start, plus what
 * the kick decided. A redirect reads its source's geometry to continue it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation origin: The kicking ankle at the launch, world metres. back: The kicking ankle at the replant, world metres. contacts: The feet's contact windows, as shares of the kick's full duration. start: Film second of its time zero. turn: The pelvis's turn about the vertical from the entry heading, degrees. lean: The whole body's tilt away from the target about the support hip, degrees.
 * @evidence contracts/development/design.md#principled-representation origin: The kicking ankle at the launch, world metres. back: The kicking ankle at the replant, world metres. contacts: The feet's contact windows, as shares of the kick's full duration. start: Film second of its time zero. turn: The pelvis's turn about the vertical from the entry heading, degrees. lean: The whole body's tilt away from the target about the support hip, degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/kick.ts (kick.plan.geometry, return); striking/KickGeometry.ts (KickGeometry.build, return); striking/KickGeometry.ts (KickGeometry.compose, parts); striking/KickGeometry.ts (KickGeometry.compose, return); striking/KickRedirect.ts (KickRedirect.build, return); striking/kick.ts (kick.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanPosture, IAutoMovieVector3, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanStrikingRecord.IRecord identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers. Shares the canonical IAutoMovieMotionHumanKick.IParams, IAutoMovieMotionHumanActionContext, IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export interface IAutoMovieMotionHumanKickGeometry {
  /**
   * The whole posture.
   *
   * @param seconds Seconds since the kick's start.
   * @param channels Optional observational demand; limb-only contact reads may omit unused guard goals while preserving the complete kicking leg/base.
   * @param resolution Optional exact FK supplier borrowed only by this synchronous course evaluation.
   * @param projection Optional genuine same-body ROM metadata borrowed only within this synchronous unchanged-table operation.
   * @returns The demanded posture, with guard and kicking leg included when demand is omitted.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines local seconds, supported observation demand and same-body unchanged-table loan lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation KickGeometry composes the original carriage, actual hip-based leg and guard under the same stop/dwell/withdrawal clocks.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One current chain evaluation feeds actual leg goals and, when observed, original guard geometry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All physical goals, support contacts, ROM admission and unsupported-coupling fallback remain; metadata is not a solved pose.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed body/ROM indexing may be shared within one actual observation; every requested pose/math/FK operation still runs, with no measured speedup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Native hip/guard/final reads borrow only the caller's exact current-body metadata while different observations keep their own scope.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Current frames and borrowed suppliers end on return or throw; returned postures retain only authored goals and original geometry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanKickGeometry.posture: The whole posture.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanKickGeometry.posture is used through packages/motions/src/striking/kick.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanKickGeometry.posture is used through packages/motions/src/striking/kick.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanKickGeometry.posture is used through packages/motions/src/striking/kick.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanKickGeometry.posture is used through packages/motions/src/striking/kick.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanKickGeometry.posture is used through packages/motions/src/striking/kick.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanKickGeometry.posture is used through packages/motions/src/striking/kick.ts.
   */
  posture(seconds: number, channels?: readonly AutoMovieMotionHumanChannel[], resolution?: IAutoMoviePoseResolution.ISource, projection?: (pose: IAutoMoviePose) => IAutoMoviePose): IAutoMovieMotionHumanPosture;

  /** The horizontal unit line from the kicker toward the target the body's carriage was committed on. */
  line: IAutoMovieVector3;

  /** The carriage the kick's contact solve settled on at the launch. */
  carriage: IAutoMovieMotionHumanKickGeometry.ICarriage;

  /**
   * The body's posture without the kicking leg's goal, under a given
   * carriage.
   *
   * @param seconds Seconds since the start: the clock of the support foot's step.
   * @param carriage The carriage shown in full at contact.
   * @param turning The second the pelvis's turn, lean and travel over the support foot are read at; `seconds` when absent, so a withdrawal can play the turn back while the step keeps its own clock.
   * @param resolution Optional exact reader borrowed only within this synchronous person's evaluation.
   * @param projection Optional genuine same-body ROM metadata borrowed only within this synchronous unchanged-table operation.
   * @returns The posture, both leg goals being the stance's.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanKickGeometry.base: The body's posture without the kicking leg's goal, under a given carriage.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanKickGeometry.base is used through packages/motions/src/striking/kick.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanKickGeometry.base is used through packages/motions/src/striking/kick.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanKickGeometry.base is used through packages/motions/src/striking/kick.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanKickGeometry.base is used through packages/motions/src/striking/kick.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanKickGeometry.base is used through packages/motions/src/striking/kick.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanKickGeometry.base is used through packages/motions/src/striking/kick.ts.
   */
  base(
    seconds: number,
    carriage: IAutoMovieMotionHumanKickGeometry.ICarriage,
    turning?: number,
    resolution?: IAutoMoviePoseResolution.ISource,
    projection?: (pose: IAutoMoviePose) => IAutoMoviePose,
  ): IAutoMovieMotionHumanPosture;

  /**
   * The carriage this kick shows in full at a second: the launch plan's,
   * moved by every correction of the aim that has started by then.
   *
   * @param turning Seconds since the start at which the turn is read.
   * @returns The carriage.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanKickGeometry.shown: The carriage this kick shows in full at a second: the launch plan's, moved by every correction of the aim that has started by then.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanKickGeometry.shown is used through packages/motions/src/striking/kick.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanKickGeometry.shown is used through packages/motions/src/striking/kick.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanKickGeometry.shown is used through packages/motions/src/striking/kick.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanKickGeometry.shown is used through packages/motions/src/striking/kick.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanKickGeometry.shown is used through packages/motions/src/striking/kick.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanKickGeometry.shown is used through packages/motions/src/striking/kick.ts.
   */
  shown(turning: number): IAutoMovieMotionHumanKickGeometry.ICarriage;

  /**
   * The kicking leg's goal on its free path, as if the leg met nothing,
   * under a given body.
   *
   * @param clock Seconds since the start on the leg's own clock, which a withdrawal runs backwards.
   * @param base The body's posture the leg hangs from.
   * @param shift How far the launch plant has moved, world metres: zero on the approach, the replant's share on a withdrawal.
   * @param hip Optional kicking hip already read from this exact body/base within the current synchronous evaluation.
   * @returns The leg's goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanKickGeometry.leg: The kicking leg's goal on its free path, as if the leg met nothing, under a given body.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanKickGeometry.leg is used through packages/motions/src/striking/kick.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanKickGeometry.leg is used through packages/motions/src/striking/kick.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanKickGeometry.leg is used through packages/motions/src/striking/kick.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanKickGeometry.leg is used through packages/motions/src/striking/kick.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanKickGeometry.leg is used through packages/motions/src/striking/kick.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanKickGeometry.leg is used through packages/motions/src/striking/kick.ts.
   */
  leg(
    clock: number,
    base: IAutoMovieMotionHumanPosture,
    shift: IAutoMovieVector3,
    hip?: IAutoMovieVector3,
  ): IAutoMovieMotionHumanKickGeometry.ILeg;

  /** The kicking ankle at the launch, world metres. */
  origin: IAutoMovieVector3;

  /** The kicking ankle at the replant, world metres. */
  back: IAutoMovieVector3;

  /** The feet's contact windows, as shares of the kick's full duration. */
  contacts: IAutoMovieMotionHumanContactWindow[];

  /** What the kick decided. */
  record: IAutoMovieMotionHumanStrikingRecord.IRecord;
}

/**
 * Contracts used by kick.plan.geometry, KickGeometry.build, KickGeometry.compose.
 *
 */
export namespace IAutoMovieMotionHumanKickGeometry {
  /**
   * A planned kick another kick may continue from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation start: Film second of its time zero.
   * @evidence contracts/development/design.md#principled-representation start: Film second of its time zero.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/kick.ts (kick.redirected, return); striking/KickRedirect.ts (KickRedirect.build, source); striking/kick.ts (kick.plan); striking/kick.ts (kick.redirected).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanKickGeometry.ITiming, IAutoMovieMotionHumanKickGeometry, IAutoMovieMotionHumanKick.IParams, IAutoMovieMotionHumanActionContext identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ISource {
    /** Its timing. */
    timing: IAutoMovieMotionHumanKickGeometry.ITiming;

    /**
     * Its geometry, built on demand.
     *
     * @returns The geometry.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanKickGeometry.ISource.geometry: Its geometry, built on demand.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanKickGeometry.ISource.geometry is used through packages/motions/src/striking/kick.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanKickGeometry.ISource.geometry is used through packages/motions/src/striking/kick.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanKickGeometry.ISource.geometry is used through packages/motions/src/striking/kick.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanKickGeometry.ISource.geometry is used through packages/motions/src/striking/kick.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanKickGeometry.ISource.geometry is used through packages/motions/src/striking/kick.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanKickGeometry.ISource.geometry is used through packages/motions/src/striking/kick.ts.
     */
    geometry(): IAutoMovieMotionHumanKickGeometry;

    /** Its parameters. */
    params: IAutoMovieMotionHumanKick.IParams;

    /** Film second of its time zero. */
    start: number;

    /** The context it was planned from, its entry being the kick's own start. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKick.IParams>;
  }

  /**
   * A kick's timing, seconds from its start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation side: The kicking side. lead: The stance's lead side. prep: The preparation's end: the launch of the knee.
   * @evidence contracts/development/design.md#principled-representation side: The kicking side. lead: The stance's lead side. prep: The preparation's end: the launch of the knee.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/kick.ts (kick.measure, return); striking/KickGeometry.ts (KickGeometry.build, timing); striking/KickGeometry.ts (KickGeometry.compose, timing); striking/KickGeometry.ts (KickGeometry.windows, timing); striking/kick.ts (kick.plan); striking/KickCarriage.ts (KickCarriage).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in kick.measure.
   */
  export interface ITiming {
    /** The kicking side. */
    side: "left" | "right";

    /** The stance's lead side. */
    lead: "left" | "right";

    /** The preparation's end: the launch of the knee. */
    prep: number;

    /** The chamber key. */
    chamber: number;

    /** The contact, or a feint's return start. */
    impact: number;

    /** The replant. */
    duration: number;
  }

  /**
   * How the body carries a kick at its contact; every member is zero in the stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation turn: The pelvis's turn about the vertical from the entry heading, degrees. lean: The whole body's tilt away from the target about the support hip, degrees. pitch: The body's forward tip added to the entry's, degrees.
   * @evidence contracts/development/design.md#principled-representation turn: The pelvis's turn about the vertical from the entry heading, degrees. lean: The whole body's tilt away from the target about the support hip, degrees. pitch: The body's forward tip added to the entry's, degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/KickCarriage.ts (KickCarriage.posture, carriage); striking/KickContact.ts (KickContact.choose, set); striking/KickContact.ts (KickContact.choose.under, carriage); striking/KickGeometry.ts (KickGeometry.build, shown); striking/KickPlans.ts (KickPlans.create, return); striking/KickPlans.ts (KickPlans.create, c).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in KickCarriage.posture.
   */
  export interface ICarriage {
    /** The pelvis's turn about the vertical from the entry heading, degrees. */
    turn: number;

    /** The whole body's tilt away from the target about the support hip, degrees. */
    lean: number;

    /** The body's forward tip added to the entry's, degrees. */
    pitch: number;

    /** The support foot's step-up along the line, metres. */
    step: number;

    /** How far the pelvis drives along the line from the chamber key to the contact, metres: a push kick's thrust of the hips behind the foot, zero for a round kick. */
    drive: number;
  }

  /**
   * The kicking leg's goal at one instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation ankle: The ankle joint, world metres. hint: The knee's bend hint, world metres.
   * @evidence contracts/development/design.md#principled-representation ankle: The ankle joint, world metres. hint: The knee's bend hint, world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/KickPlans.ts (KickPlans.create, return); striking/KickRedirect.ts (KickRedirect.build, return); striking/KickSwing.ts (KickSwing.create, return); striking/KickGeometry.ts (KickGeometry); striking/KickPlans.ts (KickPlans); striking/KickPlans.ts (KickPlans.create).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ILeg {
    /** The ankle joint, world metres. */
    ankle: IAutoMovieVector3;

    /** The knee's bend hint, world metres. */
    hint: number;

    /** The source's pelvis drive, metres. */
    drive: IAutoMovieVector3;

    /** The foot's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * What a redirect keeps of its source: the committed line and the support foot's step.
   *
   * @evidence contracts/development/common.md#meaningful-documentation step: The source's step-up, metres.
   * @evidence contracts/development/design.md#principled-representation step: The source's step-up, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/KickGeometry.ts (KickGeometry.build, kept).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IKept {
    /** The source's line. */
    line: IAutoMovieVector3;

    /** The source's step-up, metres. */
    step: number;
  }
}
