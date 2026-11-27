import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanOperate } from "./IAutoMovieMotionHumanOperate";

/**
 * The part an operation moves on a prop that articulates, and the drive the
 * operation publishes for it: the hand and the part follow one function of the
 * stroke's progress, the prop posed at the articulation's travel there.
 *
 * The operated contact is the prop's articulation itself (a trigger, a button,
 * a knob) or a contact that rides one of the mechanism's kinds, however far up
 * its chain (a door's lever on its latch on its hinge, a drawer's pull on its
 * slider, `IAutoMovieAffordance.rides`). The stroke moves that articulation
 * from where the performance has it at the operation's start by the mechanism's
 * amount, converting a prior writer's coordinate of that degree through the
 * engine's articulation map, in the articulation's own unit and sign: degrees
 * for a hinge's swing or a knob's turn, metres for a slider's or a button's
 * travel. The hand's goal at a progress is the contact of the prop posed at
 * that travel, so the hand cannot drift from the part; the drive writes the
 * same travel at the same progress.
 */
export namespace IAutoMovieMotionHumanOperateDrive {
  /**
   * A leaf's hinge line: a point of it and its unit axis, the vertical when
   * absent (a door's line given by a point).
   */
  export interface IHinge {
    /** A point of the line, world metres. */
    point: IAutoMovieVector3;

    /** Its unit axis; the vertical when absent. */
    axis?: IAutoMovieVector3;
  }

  /** A contact's world point and outward unit normal. */
  export interface IPlace {
    /** World metres. */
    point: IAutoMovieVector3;

    /** Outward unit normal. */
    normal: IAutoMovieVector3;
  }

  /** An operated part of an articulated prop. */
  export interface IPart {
    /** The prop's subject. */
    prop: string;

    /** The contact the hand takes. */
    contact: string;

    /** The articulation the contact moves with. */
    articulation: string;

    /** The articulation's travel at the operation's start. */
    base: number;

    /** The signed amount the operation moves it by. */
    amount: number;

    /**
     * The contact's world place at a progress of the stroke, on the prop as it
     * is shown at a film second: a held prop that moves meanwhile (a bow raised
     * while it is drawn) carries its part with it.
     *
     * @param progress 0 at the stroke's start, 1 at its end.
     * @param seconds The film second the prop is read at; the operation's start
     *   when absent.
     * @returns The point and outward normal.
     */
    place(
      progress: number,
      seconds?: number,
    ): IAutoMovieMotionHumanOperateDrive.IPlace;

    /**
     * A hinge articulation's own line at the stroke's start, world: a point of
     * it and its unit axis, the affordance frame's `+Y`, about which a positive
     * travel turns by the right-hand rule (a door's upright hinge, a gun cock's
     * cross pin). Absent for any other articulation.
     */
    line?: IAutoMovieMotionHumanOperateDrive.ILine;
  }

  /** A turning line, world. */
  export interface ILine {
    /** A point of the line, metres. */
    point: IAutoMovieVector3;

    /** Its unit axis. */
    axis: IAutoMovieVector3;
  }

  /**
   * A mechanism's signed amount in its articulation's unit: a button's press
   * and a slider's travel in metres (a button's 0.005 when absent, as `operate`
   * presses it), a knob's turn and a hinge's swing in degrees. Input mechanism
   * of operateDrive.amount. The mechanism, not an insertion.
   */
  export type IAmountMechanism = Exclude<
    IAutoMovieMotionHumanOperate.Mechanism,
    {
      /**
       * Exclusion pattern removing insertion from the amount calculation;
       * socket insertion is handled by its separate law.
       */
      kind: "insert";
    }
  >;

  /**
   * A hinged leaf's line: the vertical through the point the mechanism names (a
   * door's), or else the operated prop's own hinge articulation (`IPart.line`),
   * however it lies: a gun cock's cross pin. Input mechanism of
   * operateDrive.hinge. The hinge mechanism.
   */
  export type IHingeMechanism = Extract<
    IAutoMovieMotionHumanOperate.Mechanism,
    {
      /** Selects rotation of the operated object about its hinge. */
      kind: "hinge";
    }
  >;
}
