import { advanceAutoMovieGrid as advanceAutoMovieGridImplementation } from "./internal/advanceAutoMovieGrid";
import { type IAutoMovieCheckLegality, type IAutoMovieSchedule, type IAutoMovieEvaluateSchedule, type IAutoMovieMeasureSchedule, type IAutoMovieComposition, type IAutoMovieScheduleLaws } from "@automovie/interface";
import { checkAutoMovieLegality as checkAutoMovieLegalityImplementation } from "./internal/checkAutoMovieLegality";
import { evaluateAutoMovieSchedule as evaluateAutoMovieScheduleImplementation } from "./internal/evaluateAutoMovieSchedule";
import { measureAutoMovieSchedule as measureAutoMovieScheduleImplementation } from "./internal/measureAutoMovieSchedule";
import { resolveAutoMovieSchedule as resolveAutoMovieScheduleImplementation } from "./internal/resolveAutoMovieSchedule";

/** Public operations for Auto Movie Engine Schedule. */
export namespace AutoMovieEngineSchedule {
  /**
   * The first grid instant after a read one that a measured margin does not
   * certify, by conservative advancement (Mirtich 1996, Impulse-based Dynamic
   * Simulation of Rigid Body Systems, ch. 3): a check reads a margin `d` at an
   * instant, how far its value may still move before it can violate, and a bound
   * on how far the value can move from that instant to a later one; every later
   * instant the bound keeps below `d` cannot violate and is not read.
   *
   * The grid is a scan's own sequence of instants, by index. `travel(at, j)`
   * bounds how far the checked value can move between the instant read, `at`, and
   * instant `j`: a quantity in the margin's unit, not negative, that does not
   * decrease as `j` grows (a bound summed over the grid's steps, or a rate bound
   * times the elapsed time), or undefined where no bound is certified, which then
   * holds for every later `j` too. Instant `j` is certified when its travel is
   * strictly below the margin. The search gallops (one step, two, four, ...)
   * until an instant is not certified or the grid ends, then halves the last
   * gallop to the first such instant, so the bound is asked a number of times
   * logarithmic in the stretch certified. The instant returned is the one a scan
   * that read every instant would reach first with an uncertified margin, so a
   * scan that reads only the returned instants finds the same first violation as
   * a scan of every instant.
   *
   * @param at The index of the instant read.
   * @param end The index of the grid's last instant, at least `at`.
   * @param margin How far the checked value may move from its reading at `at`
   *   before it can violate, in the unit `travel` gives; zero, negative or NaN
   *   certifies nothing.
   * @param travel The bound on the value's movement from `at` to a later index,
   *   or undefined where none is certified.
   * @returns The least index in `(at, end]` that is not certified, or `end + 1`
   *   when every instant to the end is.
   * @throws {RangeError} When the bound is negative or not a number.
   */
  export function advanceGrid(at: number, end: number, margin: number, travel: (from: number, to: number) => number | undefined): number {
    return advanceAutoMovieGridImplementation(at, end, margin, travel);
  }

  /**
   * Check a schedule against a production's rules: each rule's predicate reads
   * one entry in the whole schedule and returns a violation text or null. The
   * engine applies every rule to every entry and reports, never repairs.
   *
   * @param schedule The resolved schedule.
   * @param rules The production's rules.
   * @returns Every violation, by entry then rule order.
   */
  export function checkLegality(schedule: IAutoMovieSchedule, rules: readonly IAutoMovieCheckLegality.IRule[]): IAutoMovieCheckLegality.IViolation[] {
    return checkAutoMovieLegalityImplementation(schedule, rules);
  }

  /**
   * The schedule at one instant, pure and seekable: the entries active then with
   * their phase, and each subject's latest state snapshot from an entry already
   * ended. Reading any instant in any order gives the same answer.
   *
   * @param schedule The resolved schedule.
   * @param seconds Film seconds.
   * @returns The active entries and the subjects' states.
   */
  export function evaluate(schedule: IAutoMovieSchedule, seconds: number): IAutoMovieEvaluateSchedule.IInstant {
    return evaluateAutoMovieScheduleImplementation(schedule, seconds);
  }

  /**
   * Measure a schedule's pacing against the production's own classification:
   * actions per minute, the share of actions that follow the same subject's
   * previous action within the combination gap, each subject's lateral share of
   * displacement and idle seconds over its presence, and the share of time a
   * camera entry moves with the cut cadence. Targets for these numbers stay in
   * the production's research; the engine only counts.
   *
   * @param schedule The resolved schedule.
   * @param classify The production's classification of entries.
   * @returns The measurements.
   */
  export function measure(schedule: IAutoMovieSchedule, classify: IAutoMovieMeasureSchedule.IClassify): IAutoMovieMeasureSchedule.IMeasure {
    return measureAutoMovieScheduleImplementation(schedule, classify);
  }

  /**
   * Place a composition on the film clock with the production's pure laws.
   *
   * The walk is depth first in declaration order. A sequence starts each part at
   * the previous part's end; a parallel group starts every part at its own start
   * and ends at the latest end; `at` starts its part at the named anchor's
   * contact instant (its start when the timing gives no contact) plus the offset,
   * and the walk continues after the later of the cursor and that part's end. An
   * `at` that names an `event` reads that instant of the anchor, which may then
   * be a cue track of the laws, and one that names `align` asks the laws' `align`
   * when its part must start for that instant of the part's first intent to fall
   * there. An intent with `until` ends at its cut (a share of its duration, the
   * share of one of the events its timing names, or the share at which the
   * `until` law finds a proximity) and drops a contact after the cut; a proximity
   * the law reports as never met leaves the intent uncut, so it runs to its end,
   * while laws with no `until` at all cannot place a proximity cut and throw; the
   * entry records the cut, and the entry the next part of a sequence places there
   * records it as `interruptedBy`. For each intent the production's `timing`
   * gives its duration and optional contact offset, then `outcome` and `state`
   * read the entries placed so far, so an outcome may depend on earlier state.
   * Legacy untagged cuts are normalized before the walk. Canonical intents are
   * retained by reference, and legacy intents are copied once for the walk.
   * Callers keep shared intent and state records stable. Pure laws and unchanged
   * inputs give the same schedule.
   *
   * @param composition The composition.
   * @param laws The production's pure timing, outcome and state functions.
   * @returns The placed entries ordered by start time and the total duration.
   */
  export function resolve(composition: IAutoMovieComposition, laws: IAutoMovieScheduleLaws): IAutoMovieSchedule {
    return resolveAutoMovieScheduleImplementation(composition, laws);
  }
}
