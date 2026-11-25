import type { IAutoMovieMotionHumanRun } from "../actions/IAutoMovieMotionHumanRun";
import type { IAutoMovieMotionHumanKickBall } from "../ballStrike/IAutoMovieMotionHumanKickBall";
import type { IAutoMovieMotionHumanJump } from "../next/IAutoMovieMotionHumanJump";
import type { IAutoMovieMotionHumanBowlingSlide } from "../sport/IAutoMovieMotionHumanBowlingSlide";
import type { IAutoMovieMotionHumanCartwheel } from "../sport/IAutoMovieMotionHumanCartwheel";
import type { IAutoMovieMotionHumanSalto } from "../sport/IAutoMovieMotionHumanSalto";
import type { IAutoMovieMotionHumanCatchObject } from "../throwing/IAutoMovieMotionHumanCatchObject";
import type { IAutoMovieMotionHumanThrowObjectParams } from "../throwing/IAutoMovieMotionHumanThrowObjectParams";

/**
 * Open parameters of the sportThrow lexicon family, keyed by each runtime
 * export name.
 */
export interface IAutoMovieMotionHumanLexiconSportThrowParams {
  /**
   * A baseball pitch, a crow-hop throw or a javelin throw: overarm. The windup
   * is not planned.
   */
  pitch: Omit<IAutoMovieMotionHumanThrowObjectParams, "style">;

  /**
   * A softball pitch or a bowling delivery: underarm. The windmill is not
   * planned.
   */
  underarmPitch: Omit<IAutoMovieMotionHumanThrowObjectParams, "style">;

  /** A continuous fastpitch softball arm circle and below-hip delivery. */
  softballWindmill: Omit<IAutoMovieMotionHumanThrowObjectParams, "style">;

  /**
   * A high-arm cricket delivery toward the bounce point after the composed
   * run-up.
   */
  cricketBowl: Omit<IAutoMovieMotionHumanThrowObjectParams, "style">;

  /** The supported final glide and recovery of a one-handed bowling approach. */
  bowlingSlide: IAutoMovieMotionHumanBowlingSlide.IParams;

  /**
   * A low underhand bowling delivery toward the lane after the composed
   * approach.
   */
  bowlingDelivery: Omit<IAutoMovieMotionHumanThrowObjectParams, "style">;

  /**
   * A one-hand push pass, a free throw or a shot put (the two-hand chest and
   * bounce passes are `ballSport` kinds `chestPass` and `bouncePass`): a push
   * from before the chest. The leap of a jump shot and the glide of a shot put
   * are not planned.
   */
  pushPass: Omit<IAutoMovieMotionHumanThrowObjectParams, "style">;

  /** Release a staged rugby pass to the side or rear. */
  rugbyPass: Omit<IAutoMovieMotionHumanThrowObjectParams, "style">;

  /** Release a staged overarm gridiron pass. */
  gridironPass: Omit<IAutoMovieMotionHumanThrowObjectParams, "style">;

  /** Send a staged gridiron snap to the receiver. */
  gridironSnap: Omit<IAutoMovieMotionHumanThrowObjectParams, "style">;

  /** A catch of a fly ball or a thrown ball in one hand. */
  gloveCatch: Omit<IAutoMovieMotionHumanCatchObject.IParams, "hands">;

  /** A goalkeeper's or a receiver's catch in both hands. */
  twoHandCatch: Omit<IAutoMovieMotionHumanCatchObject.IParams, "hands">;

  /**
   * A football pass, shot, cross or punt with the right foot; the composition
   * gives the ball and where it goes.
   */
  kickRight: Omit<IAutoMovieMotionHumanKickBall.IParams, "foot">;

  /** The same with the left foot. */
  kickLeft: Omit<IAutoMovieMotionHumanKickBall.IParams, "foot">;

  /**
   * A rebound, a block, a long jump or a hurdle clearance: a jump to the place
   * the composition gives. The run-up is a run before it; a hurdle's trail leg
   * is not planned, and a high jump's arch over the bar is
   * `HumanGymnastics.fosburyFlop`.
   */
  leap: IAutoMovieMotionHumanJump.IParams;

  /**
   * A box jump: a jump onto a box, landing on its top. The composition gives
   * `to` as the top's place with its height as `y`, `on` as the box's prop, and
   * an `apex` above the climb.
   */
  boxJump: IAutoMovieMotionHumanJump.IParams;

  /**
   * A forward salto to the place the composition gives: one turn in the flight,
   * the body not tucked.
   */
  frontSalto: Omit<IAutoMovieMotionHumanSalto.IParams, "way">;

  /** A backward salto to the place the composition gives. */
  backSalto: Omit<IAutoMovieMotionHumanSalto.IParams, "way">;

  /**
   * A cartwheel to the performer's left: one sideways turn over a foot, the two
   * hands and the other foot.
   */
  cartwheelLeft: Omit<IAutoMovieMotionHumanCartwheel.IParams, "to">;

  /**
   * Capoeira's aú: a cartwheel to the left through both hands, low and kept
   * facing the partner.
   */
  au: Omit<IAutoMovieMotionHumanCartwheel.IParams, "to">;

  /** A cartwheel to the performer's right. */
  cartwheelRight: Omit<IAutoMovieMotionHumanCartwheel.IParams, "to">;

  /**
   * A sprint: the acceleration out of the start, a base run or a run-up, at
   * sprint pace.
   */
  dash: Omit<IAutoMovieMotionHumanRun.IParams, "pace">;

  /** Catch a staged prop under the specified trajectory. */
  stageCatch: IAutoMovieMotionHumanCatchObject.IStageParams;

  /**
   * Deflect a staged prop at the specified interception, sending it back by its
   * restitution.
   */
  stageDeflect: IAutoMovieMotionHumanCatchObject.IStageParams;
}
