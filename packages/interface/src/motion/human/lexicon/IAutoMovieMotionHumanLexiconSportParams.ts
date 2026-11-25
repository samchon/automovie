import type { IAutoMovieMotionHumanBend } from "../everyday/IAutoMovieMotionHumanBend";
import type { IAutoMovieMotionHumanCrouch } from "../everyday/IAutoMovieMotionHumanCrouch";
import type { IAutoMovieMotionHumanKneel } from "../everyday/IAutoMovieMotionHumanKneel";
import type { IAutoMovieMotionHumanBallet } from "../exercise/IAutoMovieMotionHumanBallet";
import type { IAutoMovieMotionHumanExercise } from "../exercise/IAutoMovieMotionHumanExercise";
import type { IAutoMovieMotionHumanGroupDance } from "../exercise/IAutoMovieMotionHumanGroupDance";
import type { IAutoMovieMotionHumanStreetDance } from "../exercise/IAutoMovieMotionHumanStreetDance";
import type { IAutoMovieMotionHumanStretch } from "../exercise/IAutoMovieMotionHumanStretch";
import type { IAutoMovieMotionHumanTapDance } from "../exercise/IAutoMovieMotionHumanTapDance";
import type { IAutoMovieMotionHumanLieDown } from "../floor/IAutoMovieMotionHumanLieDown";
import type { IAutoMovieMotionHumanDance } from "../next/IAutoMovieMotionHumanDance";
import type { IAutoMovieMotionHumanSittingVolley } from "../next/IAutoMovieMotionHumanSittingVolley";
import type { IAutoMovieMotionHumanSwim } from "../next/IAutoMovieMotionHumanSwim";
import type { IAutoMovieMotionHumanAquatic } from "../sport/IAutoMovieMotionHumanAquatic";
import type { IAutoMovieMotionHumanAthletics } from "../sport/IAutoMovieMotionHumanAthletics";
import type { IAutoMovieMotionHumanBallSport } from "../sport/IAutoMovieMotionHumanBallSport";
import type { IAutoMovieMotionHumanBaseball } from "../sport/IAutoMovieMotionHumanBaseball";
import type { IAutoMovieMotionHumanGymnastics } from "../sport/IAutoMovieMotionHumanGymnastics";
import type { IAutoMovieMotionHumanMartialArt } from "../sport/IAutoMovieMotionHumanMartialArt";
import type { IAutoMovieMotionHumanRacket } from "../sport/IAutoMovieMotionHumanRacket";
import type { IAutoMovieMotionHumanStickBall } from "../sport/IAutoMovieMotionHumanStickBall";
import type { IAutoMovieMotionHumanSwimImmersed } from "../sport/IAutoMovieMotionHumanSwimImmersed";
import type { IAutoMovieMotionHumanStep } from "../striking/IAutoMovieMotionHumanStep";
import type { IAutoMovieMotionHumanLexiconSurfaceParams } from "./IAutoMovieMotionHumanLexiconSurfaceParams";

/**
 * Open parameters of the sport lexicon family, keyed by each runtime export
 * name.
 */
export interface IAutoMovieMotionHumanLexiconSportParams extends IAutoMovieMotionHumanLexiconSurfaceParams {
  /** A phase of a water sport with its named support or prop. */
  aquatic: IAutoMovieMotionHumanAquatic.IParams;

  /** Play a ball or puck with the named field, ice or lacrosse stick. */
  stickBall: IAutoMovieMotionHumanStickBall.IParams;

  /** Move into a floor-seated volleyball receive. */
  HumanSittingVolley: IAutoMovieMotionHumanSittingVolley.ISittingVolley;

  /** Walking-free lunges in place. */
  lunges: Omit<IAutoMovieMotionHumanExercise.IParams, "kind">;

  /** High knees, running in place. */
  highKnees: Omit<IAutoMovieMotionHumanExercise.IParams, "kind">;

  /** A neck stretch to the side. */
  neckStretch: Omit<IAutoMovieMotionHumanStretch.IParams, "kind">;

  /** A shoulder stretch, the arm drawn across the chest. */
  shoulderStretch: Omit<IAutoMovieMotionHumanStretch.IParams, "kind">;

  /** A side stretch, the arm overhead. */
  sideStretch: Omit<IAutoMovieMotionHumanStretch.IParams, "kind">;

  /** A standing quadriceps stretch, the heel drawn to the seat. */
  quadStretch: Omit<IAutoMovieMotionHumanStretch.IParams, "kind">;

  /** The tree pose of yoga. */
  treePose: Omit<IAutoMovieMotionHumanStretch.IParams, "kind">;

  /** A bounce to the beat. */
  bounce: Omit<IAutoMovieMotionHumanDance.IParams, "kind">;

  /** A step-touch to the beat. */
  stepTouch: Omit<IAutoMovieMotionHumanDance.IParams, "kind">;

  /** A box step to the beat: forward, side, close, back, side, close. */
  boxStep: Omit<IAutoMovieMotionHumanDance.IParams, "kind">;

  /** The set position of a sprint start. */
  sprintStart: IAutoMovieMotionHumanAthletics.IParams;

  /** A handstand. */
  handstand: IAutoMovieMotionHumanGymnastics.IParams;

  /** The horse stance of karate and kung fu. */
  horseStance: Omit<IAutoMovieMotionHumanMartialArt.IParams, "kind">;

  /** Straight punches from the horse stance (choku-zuki). */
  karatePunches: Omit<IAutoMovieMotionHumanMartialArt.IParams, "kind">;

  /** The push of tai chi. */
  taiChiPush: Omit<IAutoMovieMotionHumanMartialArt.IParams, "kind">;

  /** Dribbling a basketball. */
  dribble: Omit<IAutoMovieMotionHumanBallSport.IParams, "kind">;

  /** A volleyball dig on the forearms. */
  volleyDig: Omit<IAutoMovieMotionHumanBallSport.IParams, "kind">;

  /** A volleyball set overhead. */
  volleySet: Omit<IAutoMovieMotionHumanBallSport.IParams, "kind">;

  /** A football throw-in. */
  throwIn: Omit<IAutoMovieMotionHumanBallSport.IParams, "kind">;

  /** A catcher's crouch behind the plate. */
  catcherCrouch: Omit<IAutoMovieMotionHumanBaseball.IParams, "kind">;

  /** Fielding a ground ball. */
  fieldGrounder: Omit<IAutoMovieMotionHumanBaseball.IParams, "kind">;

  /** A batter's stance. */
  battingStance: Omit<IAutoMovieMotionHumanBaseball.IParams, "kind">;

  /** The ready position of tennis and badminton. */
  readyPosition: Omit<IAutoMovieMotionHumanRacket.IParams, "kind">;

  /** The split step before a return. */
  splitStep: Omit<IAutoMovieMotionHumanRacket.IParams, "kind">;

  /** Addressing the ball in golf. */
  golfAddress: Omit<IAutoMovieMotionHumanRacket.IParams, "kind">;

  /**
   * A two-step shuffle to the left in the fighting stance: the `step` law
   * carrying a boxing or kickboxing guard, a boxer's footwork and not a low
   * basketball stance. It is a row of the lexicon (`HUMAN_LEXICON.sport`) and
   * belongs to no family namespace.
   */
  defensiveSlide: Omit<
    IAutoMovieMotionHumanStep.IParams,
    "direction" | "steps"
  >;

  /** The chair pose of yoga: a partial squat held five seconds (provisional). */
  chairPose: Omit<IAutoMovieMotionHumanCrouch.IParams, "depth" | "hold">;

  /**
   * The child's pose of yoga: kneeling, sat back on the heels, ten seconds
   * (provisional).
   */
  childsPose: Omit<IAutoMovieMotionHumanKneel.IParams, "kind" | "hold">;

  /** A hip flexor stretch in the half kneel, twenty seconds (provisional). */
  hipFlexorStretch: Omit<IAutoMovieMotionHumanKneel.IParams, "kind" | "hold">;

  /** The corpse pose of yoga: lying on the back, ten seconds (provisional). */
  corpsePose: Omit<IAutoMovieMotionHumanLieDown.IParams, "kind" | "hold">;

  /**
   * A standing hamstring stretch: a bend down to the right foot, held twenty
   * seconds (provisional).
   */
  toeTouch: Omit<IAutoMovieMotionHumanBend.IParams, "target" | "hold">;

  /** Treading water. */
  treadWater: Omit<IAutoMovieMotionHumanSwim.IParams, "kind">;

  /** Swimming the front crawl. */
  frontCrawl: Omit<IAutoMovieMotionHumanSwim.IParams, "kind">;

  /** Swimming the breaststroke. */
  breaststroke: Omit<IAutoMovieMotionHumanSwim.IParams, "kind">;

  /** Swimming the backstroke, head first the way the back faced. */
  backstroke: Omit<IAutoMovieMotionHumanSwim.IParams, "kind">;

  /** Floating on the back. */
  floating: Omit<IAutoMovieMotionHumanSwim.IParams, "kind">;

  /** Swim immersed in a staged water volume. */
  swimImmersed: IAutoMovieMotionHumanSwimImmersed;

  /** Tap steps whose strikes sound on the beat's subdivisions. */
  tap: IAutoMovieMotionHumanTapDance.IParams;

  /** A ballet position, pirouette or grand jete. */
  ballet: IAutoMovieMotionHumanBallet.IParams;

  /** A street groove: the rock with its hits, or the moonwalk. */
  streetGroove: IAutoMovieMotionHumanStreetDance.IParams;

  /** A social group dance: a line, a circle or a conga. */
  socialDance: IAutoMovieMotionHumanGroupDance.IParams;
}
