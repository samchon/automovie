import { HumanPrecisionSport as HumanPrecisionSportSource } from "../lexicon/internal/HumanPrecisionSport";
import { HumanSportSwing as HumanSportSwingSource } from "../lexicon/internal/HumanSportSwing";
import { PrecisionStrokeForms as PrecisionStrokeFormsSource } from "../lexicon/internal/PrecisionStrokeForms";
import { AutoMovieMotionHumanBaseball as baseballLaw } from "../sport/internal/AutoMovieMotionHumanBaseball";
import { AutoMovieMotionHumanRacket as racketLaw } from "../sport/internal/AutoMovieMotionHumanRacket";
import { HUMAN_SWING_BACKHAND_DRIVE } from "./presets/HUMAN_SWING_BACKHAND_DRIVE";
import { HUMAN_SWING_BAT } from "./presets/HUMAN_SWING_BAT";
import { HUMAN_SWING_BUNT } from "./presets/HUMAN_SWING_BUNT";
import { HUMAN_SWING_CHECK } from "./presets/HUMAN_SWING_CHECK";
import { HUMAN_SWING_FOREHAND } from "./presets/HUMAN_SWING_FOREHAND";
import { HUMAN_SWING_GOLF_SWING } from "./presets/HUMAN_SWING_GOLF_SWING";
import { HUMAN_SWING_OVERHEAD_SMASH } from "./presets/HUMAN_SWING_OVERHEAD_SMASH";
import { HUMAN_SWING_PUTT } from "./presets/HUMAN_SWING_PUTT";
import { HUMAN_SWING_SPIKE } from "./presets/HUMAN_SWING_SPIKE";
import { HUMAN_SWING_TOPSPIN } from "./presets/HUMAN_SWING_TOPSPIN";
import { HUMAN_SWING_TWO_HAND_BACKHAND } from "./presets/HUMAN_SWING_TWO_HAND_BACKHAND";
import { HUMAN_SWING_VOLLEY } from "./presets/HUMAN_SWING_VOLLEY";

/**
 * Swinging an implement at a ball: the bat and the racket share one cut timing
 * model (edge peak 6 to 10 m/s by skill).
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `baseball`: Baseball and softball positions without the bat's swing or the
 *   pitch: the catcher's crouch, fielding a ground ball, and the batting stance
 *   with its load.
 * - `racket`: Racket stroke dispatch and the original solo racket or golf
 *   positions.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `BAT`: A baseball swing: both hands, level from the bat hand's side.
 * - `CHECK`: A checked swing: the bat started and held back at half its path.
 * - `BUNT`: A bunt: the bat held level before the body in both hands.
 * - `FOREHAND`: A forehand drive of tennis, squash or table tennis.
 * - `BACKHAND_DRIVE`: A one-handed backhand drive.
 * - `TWO_HAND_BACKHAND`: A two-handed backhand drive.
 * - `TOPSPIN`: A topspin stroke: the racket brushed up from below the ball.
 * - `OVERHEAD_SMASH`: A serve, a smash or a badminton clear: the racket brought
 *   down from overhead.
 * - `VOLLEY`: A volley: a short punch of the racket from high on its own side.
 * - `GOLF_SWING`: A full golf swing: both hands, down from above the rear
 *   shoulder.
 * - `PUTT`: A golf putt or chip: both hands, a level stroke along the ground
 *   line.
 * - `SPIKE`: A volleyball spike or serve: the open hand brought down from
 *   overhead.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanSportSwing`: Swings of a held implement under sport names, each a row
 *   of the cut that blade work plans: the implement's striking part is carried
 *   through the target on one of the eight lines, the edge leading, by the
 *   stroke planner.
 * - `HumanPrecisionSport`: Bound sporting strokes for baseball, cricket, tennis,
 *   golf, pool and volleyball.
 * - `PrecisionStrokeForms`: The precision stroke families: each row's fixed
 *   geometry, registered as the row is made (`createPrecisionSportStroke`), and
 *   the address each one is played from.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanSwing} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanSwing {
  /**
   * Baseball and softball positions without the bat's swing or the pitch : the
   * catcher's crouch, fielding a ground ball, and the batting stance with its
   * load. The glove hand is the left; no glove or bat is held.
   *
   * - Catcher's crouch: the hips sink to a half squat (`exercise.drop`,
   *   provisional for a catcher) with the trunk pitched 20 degrees, the glove
   *   presented palm forward 0.6 of the arm ahead of the crouched chest and the
   *   protected throwing fist behind the right leg (Baseball Canada, Playing
   *   Catcher, part 1,
   *   https://baseball.ca/?alias=playing-catcher-part-1&lang=english).
   * - Ground ball: a squat to parallel thighs with the trunk inclined, the spine
   *   taking what the folded hips leave the pelvis
   *   (`AutoMovieMotionHumanTrunk.sunk`), until the shoulders stand where the
   *   reaching arm takes the glove, which stands on its fingertips on the floor
   *   0.3 of the arm ahead of them, open forward and up, the throwing hand
   *   above it to cover the ball (provisional places).
   * - Batting stance: the left foot steps out to two shoulder widths, the knees
   *   give 3 % of the stature, both fists stacked on the implied bat's handle
   *   `HANDS` of the arm ahead of the right shoulder; the load at the stroke
   *   draws the hands a tenth of the arm back (provisional; the load precedes
   *   the stride, Welch et al. 1995).
   *
   * Each is a phrase: into the position in 0.8 s, held, and back to standing in
   * 0.8 s (provisional).
   *
   * Not drafted: the swing, the bunt and the check swing (the implement strike
   * owner's, whose file does not exist yet), the pitch (a row of the throw
   * law), the windmill pitch, the catcher's throw and base running slides.
   */
  export import baseball = baseballLaw;

  /**
   * Racket stroke dispatch and the original solo racket or golf positions. The
   * following positions use an implied handle.
   *
   * - Ready position: the feet step in sequence to two shoulder widths, the
   *   pelvis lowers by 4 % of stature and the trunk leans 15 degrees, the
   *   racket hand on the handle at waist height before the body and the other
   *   hand a hand ahead on the throat (provisional places).
   * - Split step: from the ready position's width, a small hop of 3 % of the
   *   stature (provisional) in 0.3 s, landing a quarter shoulder width wider on
   *   each side, the step that precedes every stroke (Elliott et al. 1986 place
   *   it before the serve's backswing; here before any stroke).
   * - Golf address: the trunk hinges 35 degrees at the hips over slightly flexed
   *   knees (provisional), the two hands together on the grip hanging `HANG` of
   *   the arm below the shoulders, and the waggle moves them a twentieth of the
   *   arm forward and back twice.
   *
   * Each is a phrase: into the position in 0.6 s, the stroke (the hop or the
   * waggle), held, and back in 0.6 s.
   *
   * Court strokes delegate to `courtStroke`, which can read a previously held
   * racket's frame and targets a timed contact.
   */
  export import racket = racketLaw;

  /**
   * A baseball swing: both hands, level from the bat hand's side. Spread into
   * the cut's parameters; the row adds the implement's measured speed.
   */
  export const BAT: typeof HUMAN_SWING_BAT = HUMAN_SWING_BAT;

  /**
   * A checked swing: the bat started and held back at half its path. Spread
   * into the cut's parameters; the row adds the implement's measured speed.
   */
  export const CHECK: typeof HUMAN_SWING_CHECK = HUMAN_SWING_CHECK;

  /**
   * A bunt: the bat held level before the body in both hands. Spread into the
   * cut's parameters; the row adds the implement's measured speed.
   */
  export const BUNT: typeof HUMAN_SWING_BUNT = HUMAN_SWING_BUNT;

  /**
   * A forehand drive of tennis, squash or table tennis. Spread into the cut's
   * parameters; the row adds the implement's measured speed.
   */
  export const FOREHAND: typeof HUMAN_SWING_FOREHAND = HUMAN_SWING_FOREHAND;

  /**
   * A one-handed backhand drive. Spread into the cut's parameters; the row adds
   * the implement's measured speed.
   */
  export const BACKHAND_DRIVE: typeof HUMAN_SWING_BACKHAND_DRIVE =
    HUMAN_SWING_BACKHAND_DRIVE;

  /**
   * A two-handed backhand drive. Spread into the cut's parameters; the row adds
   * the implement's measured speed.
   */
  export const TWO_HAND_BACKHAND: typeof HUMAN_SWING_TWO_HAND_BACKHAND =
    HUMAN_SWING_TWO_HAND_BACKHAND;

  /**
   * A topspin stroke: the racket brushed up from below the ball. Spread into
   * the cut's parameters; the row adds the implement's measured speed.
   */
  export const TOPSPIN: typeof HUMAN_SWING_TOPSPIN = HUMAN_SWING_TOPSPIN;

  /**
   * A serve, a smash or a badminton clear: the racket brought down from
   * overhead. Spread into the cut's parameters; the row adds the implement's
   * measured speed.
   */
  export const OVERHEAD_SMASH: typeof HUMAN_SWING_OVERHEAD_SMASH =
    HUMAN_SWING_OVERHEAD_SMASH;

  /**
   * A volley: a short punch of the racket from high on its own side. Spread
   * into the cut's parameters; the row adds the implement's measured speed.
   */
  export const VOLLEY: typeof HUMAN_SWING_VOLLEY = HUMAN_SWING_VOLLEY;

  /**
   * A full golf swing: both hands, down from above the rear shoulder. Spread
   * into the cut's parameters; the row adds the implement's measured speed.
   */
  export const GOLF_SWING: typeof HUMAN_SWING_GOLF_SWING =
    HUMAN_SWING_GOLF_SWING;

  /**
   * A golf putt or chip: both hands, a level stroke along the ground line.
   * Spread into the cut's parameters; the row adds the implement's measured
   * speed.
   */
  export const PUTT: typeof HUMAN_SWING_PUTT = HUMAN_SWING_PUTT;

  /**
   * A volleyball spike or serve: the open hand brought down from overhead.
   * Spread into the cut's parameters; the row adds the implement's measured
   * speed.
   */
  export const SPIKE: typeof HUMAN_SWING_SPIKE = HUMAN_SWING_SPIKE;

  /**
   * Swings of a held implement under sport names, each a row of the cut that
   * blade work plans: the implement's striking part is carried through the
   * target on one of the eight lines, the edge leading, by the stroke planner.
   *
   * The composition gives the implement the hand holds (`blade`, with `tip`
   * naming its striking contact, such as a bat's `strike`), and the target (the
   * ball's place at contact); with neither, the row is a shadow swing of the
   * empty hand. First pass: the body's law is the arm's stroke with the step or
   * lunge the cut offers; the hips' and the trunk's turn of a real swing are
   * not planned, and the ball is not moved. A ball that flies is a prop with a
   * motion of its own, released by the scene at the row's `stroke`.
   *
   * Every row has the cut's timing at its own peak speed of the striking part
   * (the implement's `tip`, or the hand with no implement), read on the
   * performer's `speed` skill (`HumanSword.cutAt`): the attack is one
   * minimum-jerk unit whose peak, at contact, is that speed, so it lasts 1.875
   * times the striking part's velocity per unit of the stroke's progress at
   * contact over the speed. A rate of 1 m takes 0.0625 s for a bat at 30 m/s
   * and 0.19 s at the cut's 10 m/s. The measured bands are `RACKET_SPEED`,
   * `BAT_SPEED`, `CLUB_SPEED` and `HAND_SPEED`; their lower-skill group stands
   * at the novice end and their higher-skill group at the elite end, a
   * provisional reading, since no study measured untrained players. The rows
   * with no measured speed (the backhands, the topspin, the overhead smash, the
   * volley and the putt) keep the cut's provisional 6 m/s at novice to 10 m/s
   * at elite (`HumanSword.SPEED`, under the 9.89 m/s of a knife slash, Bleetman
   * et al. 2003). The setting and the return are slower by 1.4 at novice to 1.0
   * at elite, and `manner.pace` stretches the whole clock
   * ({@link IAutoMovieMotionHumanSword}).
   */
  export import HumanSportSwing = HumanSportSwingSource;

  /**
   * Bound sporting strokes for baseball, cricket, tennis, golf, pool and
   * volleyball. A row uses the implement's named contact, or the bare palm for
   * volleyball, with the ball participating in the shared prop timeline.
   * Studies inform the distinction between full swings and short smooth
   * strokes: Welch et al. 1995 (PMID 8580946), Stuelcken et al. 2005 (PMID
   * 15807374), Walsh et al. 2024 (ISBS 42.265), Robbins et al. 2025
   * (doi:10.3390/bioengineering12010069) and Haar et al. 2020
   * (doi:10.1038/s41598-020-76805-9). Neutral lengths, angles and timing in
   * this first pass are provisional. Stance and approach are composed
   * separately.
   */
  export import HumanPrecisionSport = HumanPrecisionSportSource;

  /**
   * The precision stroke families: each row's fixed geometry, registered as the
   * row is made (`createPrecisionSportStroke`), and the address each one is
   * played from.
   *
   * The address is where the striker stands for a stroke to meet its ball: the
   * grip lies where the implement, as the hand holds it, puts its working point
   * on the contact with its face toward the shot (the bare hand's palm on the
   * contact itself), and the striking shoulder (both shoulders' middle for a
   * two-handed grip) lies within the arm's reach of the grip, on the line the
   * implement continues, so the arm and the implement meet the ball as one
   * lever, the arm-and-club model of the swing (Cochran and Stobbs 1968, The
   * Search for the Perfect Swing). From there the stance moves to the nearest
   * place where the arm planner finds the stroke's contact pose clear of the
   * body (`fitClearArmPose`). The family's stance is the facing the caller
   * stands the striker at. A take or a staging places its striker there; a
   * scene that needs an approach walks to it first. The stroke itself never
   * steps.
   */
  export import PrecisionStrokeForms = PrecisionStrokeFormsSource;
}
