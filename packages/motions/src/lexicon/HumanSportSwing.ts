import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";
import { HUMAN_SWING_BACKHAND_DRIVE } from "../next/presets/HUMAN_SWING_BACKHAND_DRIVE";
import { HUMAN_SWING_BAT } from "../next/presets/HUMAN_SWING_BAT";
import { HUMAN_SWING_BUNT } from "../next/presets/HUMAN_SWING_BUNT";
import { HUMAN_SWING_CHECK } from "../next/presets/HUMAN_SWING_CHECK";
import { HUMAN_SWING_FOREHAND } from "../next/presets/HUMAN_SWING_FOREHAND";
import { HUMAN_SWING_GOLF_SWING } from "../next/presets/HUMAN_SWING_GOLF_SWING";
import { HUMAN_SWING_OVERHEAD_SMASH } from "../next/presets/HUMAN_SWING_OVERHEAD_SMASH";
import { HUMAN_SWING_PUTT } from "../next/presets/HUMAN_SWING_PUTT";
import { HUMAN_SWING_SPIKE } from "../next/presets/HUMAN_SWING_SPIKE";
import { HUMAN_SWING_TOPSPIN } from "../next/presets/HUMAN_SWING_TOPSPIN";
import { HUMAN_SWING_TWO_HAND_BACKHAND } from "../next/presets/HUMAN_SWING_TWO_HAND_BACKHAND";
import { HUMAN_SWING_VOLLEY } from "../next/presets/HUMAN_SWING_VOLLEY";
import { HumanSword } from "./HumanSword";
import { HumanSwordGuard } from "./HumanSwordGuard";

/**
 * Swings of a held implement under sport names, each a row of the cut that
 * blade work plans: the implement's striking part is carried through the target
 * on one of the eight lines, the edge leading, by the stroke planner.
 *
 * The composition gives the implement the hand holds (`blade`, with `tip`
 * naming its striking contact, such as a bat's `strike`), and the target (the
 * ball's place at contact); with neither, the row is a shadow swing of the
 * empty hand. First pass: the body's law is the arm's stroke with the step or
 * lunge the cut offers; the hips' and the trunk's turn of a real swing are not
 * planned, and the ball is not moved. A ball that flies is a prop with a motion
 * of its own, released by the scene at the row's `stroke`.
 *
 * Every row has the cut's timing at its own peak speed of the striking part
 * (the implement's `tip`, or the hand with no implement), read on the
 * performer's `speed` skill (`HumanSword.cutAt`): the attack is one
 * minimum-jerk unit whose peak, at contact, is that speed, so it lasts 1.875
 * times the striking part's velocity per unit of the stroke's progress at
 * contact over the speed. A rate of 1 m takes 0.0625 s for a bat at 30 m/s and
 * 0.19 s at the cut's 10 m/s. The measured bands are `RACKET_SPEED`,
 * `BAT_SPEED`, `CLUB_SPEED` and `HAND_SPEED`; their lower-skill group stands at
 * the novice end and their higher-skill group at the elite end, a provisional
 * reading, since no study measured untrained players. The rows with no measured
 * speed (the backhands, the topspin, the overhead smash, the volley and the
 * putt) keep the cut's provisional 6 m/s at novice to 10 m/s at elite
 * (`HumanSword.SPEED`, under the 9.89 m/s of a knife slash, Bleetman et al.
 * 2003). The setting and the return are slower by 1.4 at novice to 1.0 at
 * elite, and `manner.pace` stretches the whole clock
 * ({@link IAutoMovieMotionHumanSword}).
 */
export namespace HumanSportSwing {
  /**
   * A tennis forehand's racket head speed at impact, metres a second: 31.1 for
   * high-performance youth and 33.1 for elite players (Landlinger, Lindinger,
   * Stoggl, Wagner and Muller 2010, J Sports Sci Med 9(4):643-651).
   */
  export const RACKET_SPEED: readonly [number, number] = [31.1, 33.1];

  /**
   * A baseball bat's speed at contact, metres a second: 25 for youth and 30 for
   * adult batters (Escamilla et al. 2009, J Appl Biomech 25(3):210-218).
   */
  export const BAT_SPEED: readonly [number, number] = [25, 30];

  /**
   * A golf driver's clubhead speed at impact, metres a second: 45.0 for
   * high-handicap and 48.8 for low-handicap golfers (Xiao, Zhang, Huang, Ma and
   * Zheng 2026, Front Sports Act Living 8:1820927).
   */
  export const CLUB_SPEED: readonly [number, number] = [45.0, 48.8];

  /**
   * A volleyball spike's hand speed at contact, metres a second: 11.9 for elite
   * women (Vint and Hinrichs 2004, ISBS conference proceedings p. 135). No
   * lower-skill group was measured, so both ends take it.
   */
  export const HAND_SPEED: readonly [number, number] = [11.9, 11.9];

  /**
   * A baseball swing: both hands, level from the bat hand's side; the bat at 25
   * to 30 m/s (`BAT_SPEED`).
   */
  export const batSwing: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportSwing"]["batSwing"]
  > = AutoMovieMotionHumanActionRow.of(
    "batSwing",
    HumanSword.cutAt(BAT_SPEED),
    HUMAN_SWING_BAT,
  );

  /**
   * A checked swing: the bat started at the swing's speed (`BAT_SPEED`) and
   * held back at half its path.
   */
  export const checkSwing: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportSwing"]["checkSwing"]
  > = AutoMovieMotionHumanActionRow.of(
    "checkSwing",
    HumanSword.cutAt(BAT_SPEED),
    HUMAN_SWING_CHECK,
  );

  /** A bunt: the bat held level before the body in both hands. */
  export const bunt: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportSwing"]["bunt"]
  > = AutoMovieMotionHumanActionRow.of(
    "bunt",
    HumanSwordGuard.guard,
    HUMAN_SWING_BUNT,
  );

  /**
   * A forehand drive of tennis, squash or table tennis; the racket head at the
   * tennis forehand's 31.1 to 33.1 m/s (`RACKET_SPEED`), which squash and table
   * tennis keep for want of their own.
   */
  export const forehand: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportSwing"]["forehand"]
  > = AutoMovieMotionHumanActionRow.of(
    "forehand",
    HumanSword.cutAt(RACKET_SPEED),
    HUMAN_SWING_FOREHAND,
  );

  /**
   * A one-handed backhand drive; no measured racket speed was read, so the
   * cut's provisional 6 to 10 m/s.
   */
  export const backhandDrive: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportSwing"]["backhandDrive"]
  > = AutoMovieMotionHumanActionRow.of(
    "backhandDrive",
    HumanSword.cut,
    HUMAN_SWING_BACKHAND_DRIVE,
  );

  /**
   * A two-handed backhand drive; no measured racket speed was read, so the
   * cut's provisional 6 to 10 m/s.
   */
  export const twoHandBackhand: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportSwing"]["twoHandBackhand"]
  > = AutoMovieMotionHumanActionRow.of(
    "twoHandBackhand",
    HumanSword.cut,
    HUMAN_SWING_TWO_HAND_BACKHAND,
  );

  /**
   * A topspin stroke: the racket brushed up from below the ball; no measured
   * racket speed was read, so the cut's provisional 6 to 10 m/s.
   */
  export const topspin: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportSwing"]["topspin"]
  > = AutoMovieMotionHumanActionRow.of(
    "topspin",
    HumanSword.cut,
    HUMAN_SWING_TOPSPIN,
  );

  /**
   * A serve, a smash or a badminton clear: the racket brought down from
   * overhead; no measured racket speed was read, so the cut's provisional 6 to
   * 10 m/s.
   */
  export const overheadSmash: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportSwing"]["overheadSmash"]
  > = AutoMovieMotionHumanActionRow.of(
    "overheadSmash",
    HumanSword.cut,
    HUMAN_SWING_OVERHEAD_SMASH,
  );

  /**
   * A volley: a short punch of the racket from high on its own side; no
   * measured racket speed was read, so the cut's provisional 6 to 10 m/s.
   */
  export const volley: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportSwing"]["volley"]
  > = AutoMovieMotionHumanActionRow.of(
    "volley",
    HumanSword.cut,
    HUMAN_SWING_VOLLEY,
  );

  /**
   * A full golf swing: both hands, down from above the rear shoulder; the
   * clubhead at 45.0 to 48.8 m/s (`CLUB_SPEED`).
   */
  export const golfSwing: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportSwing"]["golfSwing"]
  > = AutoMovieMotionHumanActionRow.of(
    "golfSwing",
    HumanSword.cutAt(CLUB_SPEED),
    HUMAN_SWING_GOLF_SWING,
  );

  /**
   * A golf putt or chip: both hands, a level stroke along the ground line; no
   * measured putter speed was read, so the cut's provisional 6 to 10 m/s.
   */
  export const putt: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportSwing"]["putt"]
  > = AutoMovieMotionHumanActionRow.of(
    "putt",
    HumanSword.cut,
    HUMAN_SWING_PUTT,
  );

  /**
   * A volleyball spike or serve: the open hand brought down from overhead; the
   * hand at 11.9 m/s at contact (`HAND_SPEED`).
   */
  export const spike: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportSwing"]["spike"]
  > = AutoMovieMotionHumanActionRow.of(
    "spike",
    HumanSword.cutAt(HAND_SPEED),
    HUMAN_SWING_SPIKE,
  );
}
