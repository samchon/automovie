import { stopDropRoll as stopDropRollLaw } from "../reaction/internal/stopDropRoll";
import { beatFlames as beatFlamesLaw } from "../tasks/internal/beatFlames";
import { extinguish as extinguishLaw } from "../tasks/internal/extinguish";
import { hoseLine as hoseLineLaw } from "../tasks/internal/hoseLine";
import { hoseTeam as hoseTeamLaw } from "../tasks/internal/hoseTeam";

/**
 * Fighting a fire. A nozzle and a backup role extinguish, run a hose line and
 * beat flames; a victim whose clothes burn stops, drops and rolls. The
 * durations are provisional.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `extinguish`: Aim, squeeze and sweep an extinguisher whose pin is already
 *   pulled: the A, S and S of OSHA's PASS (pull, aim, squeeze, sweep; Portable
 *   fire extinguishers,
 *   https://osha.gov/etools/evacuation-plans-procedures/emergency-standards/portable-extinguishers/use).
 * - `hoseLine`: One member of a two-member hose team holding a charged line
 *   against its nozzle reaction.
 * - `beatFlames`: Beat flames on a lying partner with a held cloth: a wet sack or
 *   a flapper brought down flat on the burning region again and again,
 *   smothering it.
 * - `stopDropRoll`: Stop, drop and roll
 *   (`IAutoMovieMotionHumanFirefight.IStopDropRoll`): the NFPA's steps to
 *   safety for burning clothes (NFPA, Steps to Safety,
 *   https://www.saskatoon.ca/sites/default/files/STEPSTOSAFETY__1-pager_FIRES.pdf):
 *   stop, drop gently, cover the face with the hands, and roll back and forth.
 * - `hoseTeam`: Advance a two-member hose team and work the line: the operator
 *   carries the line by its nozzle grip, the backup grips without carrying it,
 *   each walks the advance, then works the line in their role (`hoseLine`).
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanFirefighting} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanFirefighting {
  /**
   * Aim, squeeze and sweep an extinguisher whose pin is already pulled: the A,
   * S and S of OSHA's PASS (pull, aim, squeeze, sweep; Portable fire
   * extinguishers,
   * https://osha.gov/etools/evacuation-plans-procedures/emergency-standards/portable-extinguishers/use).
   * Register as `extinguish`; the chain's `pass` pulls the pin first.
   *
   * The extinguisher rides the hand on its `handle`, so its `nozzle` lies at a
   * fixed lever from the wrist. The wrist stays where it is and turns the least
   * that points the nozzle's discharge at the fire's base (the aim), then
   * sweeps that aim side to side about the vertical through the wrist, `span`
   * degrees in all, `sweeps` times, while the holding hand's index finger
   * squeezes the `lever` down on its `leverTip` and holds it. The aim is
   * reached over `AIM` seconds and released over another, the lever let go as
   * the sweeps end. Events: `strokeStart` as the squeeze begins, `strokeEnd` as
   * the sweeps end.
   *
   * Refusals: a hand that does not hold the extinguisher, a pin still in (the
   * lever is locked until it is pulled), an extinguisher without its lever, pin
   * or nozzle, and a non-positive sweep count or span.
   */
  export const extinguish: typeof extinguishLaw = extinguishLaw;

  /**
   * One member of a two-member hose team holding a charged line against its
   * nozzle reaction. Register as `hoseLine`.
   *
   * The nozzle operator holds the line by its `nozzle` grip (taken up before);
   * the free hand swings the nozzle's `bail` open and keeps it there
   * (`workHeldPush`), while the holding wrist turns the stream's `tip` onto the
   * target and sweeps it side to side, as `extinguish` sweeps its horn. The
   * backup member, behind, grips the line at their `grip` with both hands
   * without carrying it, each a power grip from above sharing the grip's
   * length, the hand reaching across the body ahead: the hands follow that grip
   * where the operator's hold puts the line at each second. The line bends at
   * the operator's hold (its `flex`) against the sweep, so the run behind the
   * nozzle stays put and the backup's grip barely moves. Both members lean into
   * the reaction: the stream pushes the line back with `REACTION` newtons,
   * which the team shares, so each member's trunk tips forward by
   * `atan(REACTION / 2 / (m g))` over the feet, the lean that brings the body's
   * weight to balance its share. `advance` is walked by the team before
   * (`AutoMovieMotionHumanFirefighting.hoseTeam`); here the members stand.
   * Events: `strokeStart` as the stream opens, `strokeEnd` as it shuts.
   *
   * Refusals: an operator without a target or not holding the line, a line
   * without the named grip, bail or tip, and a grip beyond the arm.
   */
  export const hoseLine: typeof hoseLineLaw = hoseLineLaw;

  /**
   * Beat flames on a lying partner with a held cloth: a wet sack or a flapper
   * brought down flat on the burning region again and again, smothering it.
   * Register as `beatFlames`.
   *
   * The cloth rides the hand that holds it, so its working `face` lies at a
   * fixed lever from the wrist; the wrist holds the attitude that lays the face
   * flat on the region, its normal turned the least way from where the hand
   * held it against the region's, and brings the face down to `CLEAR` above the
   * region's surface along its outward normal, then raises it `RAISE` above and
   * back down, `count` times on a `BEAT` each, reaching the first in the
   * transport movement time. The region is read where the partner lies at the
   * start. Events: `strokeStart` at the first beat, `strokeEnd` after the
   * last.
   *
   * The trunk leans in over the partner as far as the beats need
   * (`HumanTrunkLean`). Refusals: a hand that does not hold the cloth, a cloth
   * without a `face`, a non-positive whole count, and a region beyond the arm
   * at every hinge the hips' range allows.
   */
  export const beatFlames: typeof beatFlamesLaw = beatFlamesLaw;

  /**
   * Stop, drop and roll (`IAutoMovieMotionHumanFirefight.IStopDropRoll`): the
   * NFPA's steps to safety for burning clothes (NFPA, Steps to Safety,
   * https://www.saskatoon.ca/sites/default/files/STEPSTOSAFETY__1-pager_FIRES.pdf):
   * stop, drop gently, cover the face with the hands, and roll back and forth.
   *
   * The drop is the protective forward collapse (`collapse`) into the prone
   * lie, the hands brought over the face as the body goes down. The rolls then
   * turn the lying body about its long axis, a half turn onto one side and
   * back, alternating sides, each on a half sine. The body is a lying
   * cross-section half as deep as the chest and as wide as the shoulders: its
   * long axis rides at the height that cross-section rests at when turned, and
   * travels sideways by the arc it rolls, so the body rolls on the floor rather
   * than about a fixed line. The hands stay on the face, carried by the head,
   * throughout.
   */
  export import stopDropRoll = stopDropRollLaw;

  /**
   * Advance a two-member hose team and work the line: the operator carries the
   * line by its nozzle grip, the backup grips without carrying it, each walks
   * the advance, then works the line in their role (`hoseLine`).
   *
   * @param nozzle The operator's chain and standing place.
   * @param backup The backup member's chain and standing place.
   * @param params The line, the advance, the target and the sweeps.
   * @returns Both chains after the drill, the operator's first.
   */
  export const hoseTeam: typeof hoseTeamLaw = hoseTeamLaw;
}
