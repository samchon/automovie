import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { StrikingRecord } from "./StrikingRecord";
import type { kick } from "./kick";

/**
 * A built kick: the body's carriage, the kicking leg's goal (the ankle, the
 * knee's bend hint and the foot's rotation) and the feet's contact windows,
 * each a pure function of the seconds since the kick's own start, plus what
 * the kick decided. A redirect reads its source's geometry to continue it.
 */
export interface IKickGeometry {
  /**
   * The whole posture.
   *
   * @param seconds Seconds since the kick's start.
   * @returns The posture, the guard and the kicking leg's goal included.
   */
  posture(seconds: number): IHumanPosture;

  /** The horizontal unit line from the kicker toward the target the body's carriage was committed on. */
  line: IAutoMovieVector3;

  /** The carriage the kick's contact solve settled on. */
  carriage: IKickGeometry.ICarriage;

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
    carriage: IKickGeometry.ICarriage,
    turning?: number,
  ): IHumanPosture;

  /**
   * The body's posture without the kicking leg's goal, as this kick shows it.
   *
   * @param seconds Seconds since the start.
   * @param turning The second the turn is read at; `seconds` when absent.
   * @returns The posture.
   */
  body(seconds: number, turning?: number): IHumanPosture;

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
    base: IHumanPosture,
    shift: IAutoMovieVector3,
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
