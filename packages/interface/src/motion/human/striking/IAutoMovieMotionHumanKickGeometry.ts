import type { IAutoMovieMotionHumanActionContext } from "../law/IAutoMovieMotionHumanActionContext";
import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieMotionHumanKick } from "./IAutoMovieMotionHumanKick";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanStrikingRecord } from "./IAutoMovieMotionHumanStrikingRecord";
import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A built kick: the body's carriage, the kicking leg's goal (the ankle, the
 * knee's bend hint and the foot's rotation) and the feet's contact windows,
 * each a pure function of the seconds since the kick's own start, plus what
 * the kick decided. A redirect reads its source's geometry to continue it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation origin: The kicking ankle at the launch, world metres. back: The kicking ankle at the replant, world metres. contacts: The feet's contact windows, as shares of the kick's full duration.
 * @evidence contracts/development/design.md#principled-representation origin: The kicking ankle at the launch, world metres. back: The kicking ankle at the replant, world metres. contacts: The feet's contact windows, as shares of the kick's full duration.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/kick.ts (kick.plan.geometry, return); striking/KickGeometry.ts (KickGeometry.build, return); striking/KickGeometry.ts (KickGeometry.compose, parts); striking/KickGeometry.ts (KickGeometry.compose, return); striking/KickRedirect.ts (KickRedirect.build, return); striking/kick.ts (kick.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanPosture, IAutoMovieVector3, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanStrikingRecord.IRecord identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export interface IAutoMovieMotionHumanKickGeometry {
  /**
   * The whole posture.
   *
   * @param seconds Seconds since the kick's start.
   * @returns The posture, the guard and the kicking leg's goal included.
   */
  posture(seconds: number): IAutoMovieMotionHumanPosture;

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
   * @returns The posture, both leg goals being the stance's.
   */
  base(
    seconds: number,
    carriage: IAutoMovieMotionHumanKickGeometry.ICarriage,
    turning?: number,
  ): IAutoMovieMotionHumanPosture;

  /**
   * The carriage this kick shows in full at a second: the launch plan's,
   * moved by every correction of the aim that has started by then.
   *
   * @param turning Seconds since the start at which the turn is read.
   * @returns The carriage.
   */
  shown(turning: number): IAutoMovieMotionHumanKickGeometry.ICarriage;

  /**
   * The kicking leg's goal on its free path, as if the leg met nothing,
   * under a given body.
   *
   * @param clock Seconds since the start on the leg's own clock, which a withdrawal runs backwards.
   * @param base The body's posture the leg hangs from.
   * @param shift How far the launch plant has moved, world metres: zero on the approach, the replant's share on a withdrawal.
   * @returns The leg's goal.
   */
  leg(
    clock: number,
    base: IAutoMovieMotionHumanPosture,
    shift: IAutoMovieVector3,
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
 * @evidence contracts/development/common.md#meaningful-documentation start: Film second of its time zero. turn: The pelvis's turn about the vertical from the entry heading, degrees. lean: The whole body's tilt away from the target about the support hip, degrees.
 * @evidence contracts/development/design.md#principled-representation start: Film second of its time zero. turn: The pelvis's turn about the vertical from the entry heading, degrees. lean: The whole body's tilt away from the target about the support hip, degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/kick.ts (kick.plan.geometry, return); striking/KickGeometry.ts (KickGeometry.build, return); striking/KickGeometry.ts (KickGeometry.compose, parts); striking/KickGeometry.ts (KickGeometry.compose, return); striking/KickRedirect.ts (KickRedirect.build, return); striking/kick.ts (kick.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanKick.IParams, IAutoMovieMotionHumanActionContext, IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
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
    hint: IAutoMovieVector3;

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
