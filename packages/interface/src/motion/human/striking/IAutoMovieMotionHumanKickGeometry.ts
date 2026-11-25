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
 * each a pure function of the seconds since the kick's own start, plus what the
 * kick decided. A redirect reads its source's geometry to continue it.
 */
export interface IAutoMovieMotionHumanKickGeometry {
  /**
   * The whole posture.
   *
   * @param seconds Seconds since the kick's start.
   * @param channels Optional observational demand; limb-only contact reads may
   *   omit unused guard goals while preserving the complete kicking leg/base.
   * @param resolution Optional exact FK supplier borrowed only by this
   *   synchronous course evaluation.
   * @param projection Optional genuine same-body ROM metadata borrowed only
   *   within this synchronous unchanged-table operation.
   * @returns The demanded posture, with guard and kicking leg included when
   *   demand is omitted.
   */
  posture(
    seconds: number,
    channels?: readonly AutoMovieMotionHumanChannel[],
    resolution?: IAutoMoviePoseResolution.ISource,
    projection?: (pose: IAutoMoviePose) => IAutoMoviePose,
  ): IAutoMovieMotionHumanPosture;

  /**
   * The horizontal unit line from the kicker toward the target the body's
   * carriage was committed on.
   */
  line: IAutoMovieVector3;

  /** The carriage the kick's contact solve settled on at the launch. */
  carriage: IAutoMovieMotionHumanKickGeometry.ICarriage;

  /**
   * The body's posture without the kicking leg's goal, under a given carriage.
   *
   * @param seconds Seconds since the start: the clock of the support foot's
   *   step.
   * @param carriage The carriage shown in full at contact.
   * @param turning The second the pelvis's turn, lean and travel over the
   *   support foot are read at; `seconds` when absent, so a withdrawal can play
   *   the turn back while the step keeps its own clock.
   * @param resolution Optional exact reader borrowed only within this
   *   synchronous person's evaluation.
   * @param projection Optional genuine same-body ROM metadata borrowed only
   *   within this synchronous unchanged-table operation.
   * @returns The posture, both leg goals being the stance's.
   */
  base(
    seconds: number,
    carriage: IAutoMovieMotionHumanKickGeometry.ICarriage,
    turning?: number,
    resolution?: IAutoMoviePoseResolution.ISource,
    projection?: (pose: IAutoMoviePose) => IAutoMoviePose,
  ): IAutoMovieMotionHumanPosture;

  /**
   * The carriage this kick shows in full at a second: the launch plan's, moved
   * by every correction of the aim that has started by then.
   *
   * @param turning Seconds since the start at which the turn is read.
   * @returns The carriage.
   */
  shown(turning: number): IAutoMovieMotionHumanKickGeometry.ICarriage;

  /**
   * The kicking leg's goal on its free path, as if the leg met nothing, under a
   * given body.
   *
   * @param clock Seconds since the start on the leg's own clock, which a
   *   withdrawal runs backwards.
   * @param base The body's posture the leg hangs from.
   * @param shift How far the launch plant has moved, world metres: zero on the
   *   approach, the replant's share on a withdrawal.
   * @param hip Optional kicking hip already read from this exact body/base
   *   within the current synchronous evaluation.
   * @returns The leg's goal.
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
 * Contracts used by kick.plan.geometry, KickGeometry.build,
 * KickGeometry.compose.
 */
export namespace IAutoMovieMotionHumanKickGeometry {
  /** A planned kick another kick may continue from. */
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

  /**
   * How the body carries a kick at its contact; every member is zero in the
   * stance.
   */
  export interface ICarriage {
    /** The pelvis's turn about the vertical from the entry heading, degrees. */
    turn: number;

    /**
     * The whole body's tilt away from the target about the support hip,
     * degrees.
     */
    lean: number;

    /** The body's forward tip added to the entry's, degrees. */
    pitch: number;

    /** The support foot's step-up along the line, metres. */
    step: number;

    /**
     * How far the pelvis drives along the line from the chamber key to the
     * contact, metres: a push kick's thrust of the hips behind the foot, zero
     * for a round kick.
     */
    drive: number;
  }

  /** The kicking leg's goal at one instant. */
  export interface ILeg {
    /** The ankle joint, world metres. */
    ankle: IAutoMovieVector3;

    /** The knee's bend hint, world metres. */
    hint: IAutoMovieVector3;

    /** The foot's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;

    /**
     * The toes' extension from the foot, degrees, while the foot rocks on its
     * forefoot; none when flat.
     */
    toes?: number;
  }

  /**
   * What a redirect keeps of its source: the committed line, the support foot's
   * step and the pelvis's drive.
   */
  export interface IKept {
    /** The source's line. */
    line: IAutoMovieVector3;

    /** The source's step-up, metres. */
    step: number;

    /** The source's pelvis drive, metres. */
    drive: number;
  }
}
