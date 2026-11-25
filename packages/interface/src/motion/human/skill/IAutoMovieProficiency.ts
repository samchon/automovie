/**
 * How skilled a performer is, from clumsy to expert: a named level or a
 * continuous `p` in [0, 1], with optional per-axis overrides in [0, 1].
 *
 * The named levels are `novice` 0, `amateur` 1/3, `trained` 2/3 and `elite` 1,
 * Fitts and Posner's three learning stages laid end to end in equal thirds
 * (`HumanSkill.LEVELS`). An axis names one dimension motor-learning studies
 * measure separately: `timing` (rhythm variability), `path` (trajectory
 * smoothness and wobble), `balance` (postural sway), `guard` (protective
 * posture kept), `power`, `speed` (peak distal speed), `recovery` (time back to
 * readiness), `reaction` (reaction time), `anticipation` (lead from reading the
 * other's movement) and `sequencing` (proximal-to-distal coordination). An axis
 * absent from `axes` takes the overall value. Proficiency changes timing, path
 * and outcome; it never raises a joint's range of motion.
 *
 * What a level changes. A quantity that a skill governs runs from its novice
 * value to its elite value along its axis by a smoothstep, so the levels sit at
 * 0, 0.26, 0.74 and 1 of the way (`HumanSkill.quantity`). Each action family
 * owns its endpoints and states them on its own type: the strikes' delivery,
 * recovery, peak speed, range share, guard drop and reaction
 * ({@link IAutoMovieMotionHumanPunch}, `StrikingSkill`). Three effects hold
 * across every timed action (`HumanSkill`): the timing variability of an
 * interval, 7 % of it plus 25 ms at novice to 2.5 % plus 10 ms at elite
 * (`timing`); the endpoint scatter of a reach, its standard deviation the
 * distance over the time times 0.012 s at novice to 0.004 s at elite (`path`,
 * provisional); and the postural sway, 1.6 times at novice to 1.0 at elite
 * (`balance`, provisional). The performer's `proficiency` is its skill for
 * every action; an action's `manner.proficiency` only narrows the offsets its
 * `variation` draws ({@link IAutoMovieMotionManner.proficiency}). *
 */
export type IAutoMovieProficiency =
  | {
      /** A named level. */
      level: "novice" | "amateur" | "trained" | "elite";
      /** Per-axis overrides in [0, 1]. */
      axes?: Partial<Record<IAutoMovieProficiency.Axis, number>>;
    }
  | {
      /** A continuous value in [0, 1]. */
      p: number;
      /** Per-axis overrides in [0, 1]. */
      axes?: Partial<Record<IAutoMovieProficiency.Axis, number>>;
    };

/**
 * The ten independent motor-skill dimensions used for proficiency overrides and
 * HumanSkill axis lookup.
 */
export namespace IAutoMovieProficiency {
  /** One measured dimension of skill. */
  export type Axis =
    | "timing"
    | "path"
    | "balance"
    | "guard"
    | "power"
    | "speed"
    | "recovery"
    | "reaction"
    | "anticipation"
    | "sequencing";
}
