import type { IAutoMovieMotionHumanRun } from "../actions/IAutoMovieMotionHumanRun";
import type { IAutoMovieMotionHumanWalkParams } from "../actions/IAutoMovieMotionHumanWalkParams";
import type { IAutoMovieMotionHumanCrabWalk } from "../floor/IAutoMovieMotionHumanCrabWalk";
import type { IAutoMovieMotionHumanCover } from "../next/IAutoMovieMotionHumanCover";
import type { IAutoMovieMotionHumanCrossing } from "../next/IAutoMovieMotionHumanCrossing";
import type { IAutoMovieMotionHumanGait } from "../next/IAutoMovieMotionHumanGait";
import type { IAutoMovieMotionHumanEdgeRescue } from "./IAutoMovieMotionHumanEdgeRescue";
import type { IAutoMovieMotionHumanEnvironmentRecovery } from "./IAutoMovieMotionHumanEnvironmentRecovery";
import type { IAutoMovieMotionHumanFrailWalk } from "./IAutoMovieMotionHumanFrailWalk";
import type { IAutoMovieMotionHumanRope } from "./IAutoMovieMotionHumanRope";
import type { IAutoMovieMotionHumanSkydive } from "./IAutoMovieMotionHumanSkydive";
import type { IAutoMovieMotionHumanStuntFall } from "./IAutoMovieMotionHumanStuntFall";
import type { IAutoMovieMotionHumanTravelCar } from "./IAutoMovieMotionHumanTravelCar";
import type { IAutoMovieMotionHumanTravelCarExit } from "./IAutoMovieMotionHumanTravelCarExit";
import type { IAutoMovieMotionHumanTravelDoor } from "./IAutoMovieMotionHumanTravelDoor";
import type { IAutoMovieMotionHumanTravelLeaf } from "./IAutoMovieMotionHumanTravelLeaf";
import type { IAutoMovieMotionHumanTreeClimb } from "./IAutoMovieMotionHumanTreeClimb";
import type { IAutoMovieMotionHumanWallRun } from "./IAutoMovieMotionHumanWallRun";

/**
 * Open parameters of the gait lexicon family, keyed by each runtime export
 * name.
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

  /**
   * Double time: the drill step at 180 a minute, run as a jog that keeps the
   * count.
   */
  doubleTime: IAutoMovieMotionHumanGait.IParams;

  /** A sneak: slow short steps on bent knees, the arms held still and close. */
  sneak: IAutoMovieMotionHumanGait.IParams;

  /** A prowl: the sneak on deeply bent knees. */
  prowl: IAutoMovieMotionHumanGait.IParams;

  /** A sad walk: slow, the arms barely swinging, the trunk slumped. */
  sad: IAutoMovieMotionHumanGait.IParams;

  /** A proud walk: upright, the arms swung freely. */
  proud: IAutoMovieMotionHumanGait.IParams;

  /**
   * A stiff-knee limp: the spared leg also swings straight, barely clearing the
   * floor.
   */
  stiffLimp: IAutoMovieMotionHumanGait.ILimp;

  /**
   * A tiptoe: the sneak's slow short steps on the balls of the feet, the heels
   * never set down.
   */
  tiptoe: IAutoMovieMotionHumanGait.IParams;

  /** A limp: an antalgic gait, the spared leg stood on briefly. */
  limp: IAutoMovieMotionHumanGait.ILimp;

  /**
   * An intoxicated walk: slow, unsteady in time, wandering off its line and
   * back.
   */
  drunk: IAutoMovieMotionHumanGait.IParams;

  /** Walk through a named opening. */
  passThrough: IAutoMovieMotionHumanTravelDoor.IParams;

  /** Cross a real stage obstacle or the gap between fixed surfaces. */
  crossObstacle: IAutoMovieMotionHumanCrossing.IParams;

  /** Move in cover along a named wall, window or door. */
  moveInCover: IAutoMovieMotionHumanCover.IParams;

  /** Step on or run up a named wall's face. */
  wallRun: IAutoMovieMotionHumanWallRun.IParams;

  /** Climb, descend, traverse or swing on a named rope. */
  rope: IAutoMovieMotionHumanRope.IParams;

  /** Fall down a staircase or from a ledge onto a pad or the ground. */
  stuntFall: IAutoMovieMotionHumanStuntFall.IParams;

  /** Climb a tree by its branches, sit astride one, or climb down. */
  climbTree: IAutoMovieMotionHumanTreeClimb.IParams;

  /** Jump from an edge under a parachute and land. */
  skydive: IAutoMovieMotionHumanSkydive.IParams;

  /** One role of a rescue at a ledge: the catch and haul, or the hang and fall. */
  edgeRescue: IAutoMovieMotionHumanEdgeRescue.IParams;

  /** Resolve a named walking trip or slip by a recovery or a fall. */
  environmentalRecovery: IAutoMovieMotionHumanEnvironmentRecovery.IParams;

  /** Get into a car seat through its door. */
  getIn: IAutoMovieMotionHumanTravelCar.IParams;

  /** Open a door by its handle, standing. */
  openDoor: IAutoMovieMotionHumanTravelLeaf.IParams;

  /** Swing out of a vehicle seat and stand clear. */
  getOut: IAutoMovieMotionHumanTravelCarExit.IParams;

  /**
   * A shamble: a dragged stiff leg stood on briefly, the trunk leaning and the
   * arms hanging.
   */
  shamble: IAutoMovieMotionHumanGait.ILimp;

  /** A lurch: one knee held stiff at a slow cadence, the arms held still. */
  lurch: IAutoMovieMotionHumanGait.ILimp;

  /** A stalk: a hunched creep on deeply bent knees. */
  stalk: IAutoMovieMotionHumanGait.IParams;

  /**
   * A crab walk: supine on the hands and the feet, the pelvis lifted,
   * travelling feet or head first in the diagonal sequence.
   */
  crabWalk: IAutoMovieMotionHumanCrabWalk.IParams;

  /**
   * A race walk: a walk at a run's pace, one foot always down, the arms
   * pumping.
   */
  raceWalk: IAutoMovieMotionHumanGait.IParams;

  /** A frail older person's walk, graded from the ordinary walk to a shuffle. */
  frailWalk: IAutoMovieMotionHumanFrailWalk;
}
