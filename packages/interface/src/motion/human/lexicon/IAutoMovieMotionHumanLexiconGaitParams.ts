import type { IAutoMovieMotionHumanRun } from "../actions/IAutoMovieMotionHumanRun";
import type { IAutoMovieMotionHumanWalkParams } from "../actions/IAutoMovieMotionHumanWalkParams";
import type { IAutoMovieMotionHumanGait } from "./IAutoMovieMotionHumanGait";
import type { IAutoMovieMotionHumanTravelCar } from "./IAutoMovieMotionHumanTravelCar";
import type { IAutoMovieMotionHumanTravelDoor } from "./IAutoMovieMotionHumanTravelDoor";
import type { IAutoMovieMotionHumanTravelLeaf } from "./IAutoMovieMotionHumanTravelLeaf";

/**
 * Open parameters of the gait lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The gait family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the gait row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconGaitParams {
  /** A stroll: slow, the stride a little short, the arms easy. */
  stroll: Omit<IAutoMovieMotionHumanWalkParams, "pace" | "stride" | "armSwing">;

  /** A hurry: fast, the stride long, the arms driving. */
  hurry: Omit<IAutoMovieMotionHumanWalkParams, "pace" | "stride" | "armSwing">;

  /** A weary trudge: slow, short, the arms barely swinging. */
  trudge: Omit<IAutoMovieMotionHumanWalkParams, "pace" | "stride" | "armSwing">;

  /** A swagger: the elbows out and the arms swung wide. */
  swagger: Omit<
    IAutoMovieMotionHumanWalkParams,
    "pace" | "armSwing" | "elbows"
  >;

  /** A jog. */
  jog: Omit<IAutoMovieMotionHumanRun.IParams, "pace">;

  /** A sprint. */
  sprint: Omit<IAutoMovieMotionHumanRun.IParams, "pace">;

  /** A march: the drill step at the drill cadence, the arms swung straight. */
  march: IAutoMovieMotionHumanGait.IMarch;

  /** Double time: the drill step at 180 a minute, run as a jog that keeps the count. */
  doubleTime: IAutoMovieMotionHumanGait.IParams;

  /** A sneak: slow short steps on bent knees, the arms held still and close. */
  sneak: IAutoMovieMotionHumanGait.IParams;

  /** A prowl: the sneak on deeply bent knees. */
  prowl: IAutoMovieMotionHumanGait.IParams;

  /** A sad walk: slow, the arms barely swinging, the trunk slumped. */
  sad: IAutoMovieMotionHumanGait.IParams;

  /** A proud walk: upright, the arms swung freely. */
  proud: IAutoMovieMotionHumanGait.IParams;

  /** A stiff-knee limp: the spared leg also swings straight, barely clearing the floor. */
  stiffLimp: IAutoMovieMotionHumanGait.ILimp;

  /** A tiptoe: the sneak's slow short steps on the balls of the feet, the heels never set down. */
  tiptoe: IAutoMovieMotionHumanGait.IParams;

  /** A limp: an antalgic gait, the spared leg stood on briefly. */
  limp: IAutoMovieMotionHumanGait.ILimp;

  /** An intoxicated walk: slow, unsteady in time, wandering off its line and back. */
  drunk: IAutoMovieMotionHumanGait.IParams;

  /** Walk through a named opening. */
  passThrough: IAutoMovieMotionHumanTravelDoor.IParams;

  /** Get into a car seat through its door. */
  getIn: IAutoMovieMotionHumanTravelCar.IParams;

  /** Open a door by its handle, standing. */
  openDoor: IAutoMovieMotionHumanTravelLeaf.IParams;
}
