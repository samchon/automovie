import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import type { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import type { StrikingRecord } from "./StrikingRecord";
import type { kick } from "./kick";

/**
 * A built kick: the body's carriage, the kicking leg's goal (the ankle, the
 * knee's bend hint and the foot's rotation) and the feet's contact windows,
 * each a pure function of the seconds since the kick's own start, plus what
 * the kick decided. A redirect reads its source's geometry to continue it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Members state local/film clocks, carriage, exact leg geometry, support windows, record and borrowed synchronous FK/ROM ownership.
 * @evidence contracts/development/design.md#principled-representation Existing canonical posture/vector/contact/record types carry real geometric decisions; optional metadata arguments carry no pose or success result.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Actual kick/redirect/weapon consumers need posture, base, carriage/leg readings and original recorded contact data.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unsupported demands retain the complete path; genuine ROM loans alter only unchanged-table setup while all actual clamps, fits, goals and limits remain.
 */
export interface IKickGeometry {
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
   */
  posture(seconds: number, channels?: readonly AutoMovieMotionHumanChannel[], resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: ReturnType<typeof prepareHumanPostureProjection>): IHumanPosture;

  /** The horizontal unit line from the kicker toward the target the body's carriage was committed on. */
  line: IAutoMovieVector3;

  /** The carriage the kick's contact solve settled on at the launch. */
  carriage: IKickGeometry.ICarriage;

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
   * @evidence contracts/development/common.md#meaningful-documentation Defines support/turn clocks, carriage and current synchronous same-body metadata.
   * @evidence contracts/development/implementation.md#principled-implementation KickGeometry's actual producer delegates the original root travel, support pivot, support-hip tilt and leg lowering to KickCarriage.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The actual base callback forwards unchanged scalar inputs and borrowed loans to their numerical owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No turn, step, foot plant, MTP contact, hip clamp or lowering operation is skipped or changed.
   * @evidence contracts/development/implementation.md#efficient-algorithms The original constant kinematics and demanded hip FK remain; only repeated fixed ROM setup can be shared, with speedup unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A genuine projector is consumed only by existing native trunk/hip clamps; lowering retains its original raw-FK mathematics and accepts no new clamp.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each callback borrows operation metadata only until return or failure and returns original fresh authored posture data.
   */
  base(
    seconds: number,
    carriage: IKickGeometry.ICarriage,
    turning?: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IHumanPosture;

  /**
   * The carriage this kick shows in full at a second: the launch plan's,
   * moved by every correction of the aim that has started by then.
   *
   * @param turning Seconds since the start at which the turn is read.
   * @returns The carriage.
   */
  shown(turning: number): IKickGeometry.ICarriage;

  /**
   * The kicking leg's goal on its free path, as if the leg met nothing,
   * under a given body.
   *
   * @param clock Seconds since the start on the leg's own clock, which a withdrawal runs backwards.
   * @param base The body's posture the leg hangs from.
   * @param shift How far the launch plant has moved, world metres: zero on the approach, the replant's share on a withdrawal.
   * @param hip Optional kicking hip already read from this exact body/base within the current synchronous evaluation.
   * @returns The leg's goal.
   */
  leg(
    clock: number,
    base: IHumanPosture,
    shift: IAutoMovieVector3,
    hip?: IAutoMovieVector3,
  ): IKickGeometry.ILeg;

  /** The kicking ankle at the launch, world metres. */
  origin: IAutoMovieVector3;

  /** The kicking ankle at the replant, world metres. */
  back: IAutoMovieVector3;

  /** The feet's contact windows, as shares of the kick's full duration. */
  contacts: IHumanContactWindow[];

  /** What the kick decided. */
  record: StrikingRecord.IRecord;
}
export namespace IKickGeometry {
  /** A kick's timing, seconds from its start. */
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

  /** The kicking leg's goal at one instant. */
  export interface ILeg {
    /** The ankle joint, world metres. */
    ankle: IAutoMovieVector3;

    /** The knee's bend hint, world metres. */
    hint: IAutoMovieVector3;

    /** The foot's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;
  }

  /** How the body carries a kick at its contact; every member is zero in the stance. */
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

  /** What a redirect keeps of its source: the committed line and the support foot's step. */
  export interface IKept {
    /** The source's line. */
    line: IAutoMovieVector3;

    /** The source's step-up, metres. */
    step: number;
  }

  /** A planned kick another kick may continue from. */
  export interface ISource {
    /** Its timing. */
    timing: ITiming;

    /**
     * Its geometry, built on demand.
     *
     * @returns The geometry.
     */
    geometry(): IKickGeometry;

    /** Its parameters. */
    params: kick.IParams;

    /** Film second of its time zero. */
    start: number;

    /** The context it was planned from, its entry being the kick's own start. */
    context: IHumanActionContext<kick.IParams>;
  }
}
