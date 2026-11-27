/**
 * The striking family's measured timing, speed, reaction and guard numbers,
 * from novice to elite, as `HumanSkill.quantity` reads them. They belong to
 * striking alone: no other action family reads them, and striking reads no
 * other family's numbers (only the cross-task variability laws of
 * `HumanSkill`).
 *
 * Elite phase durations are the measured means of trained populations; the
 * novice end scales them by the ratios of Vagner et al. 2023 (a systematic
 * review of the roundhouse kick, PMC10459763): the time from launch to target
 * is about equal across levels (280 to 300 ms, so the strike phase scales x1.06
 * to x1.0), while the whole kick takes 1.06 s for novices against 0.84 s for
 * elites, which the chamber and the recovery absorb (x1.4 to x1.0). Peak distal
 * speed differs far more (6.5, 11.4 and 14.3 m/s for novice, sub-elite and
 * elite foot speed), so with near-equal time the novice covers a shorter path:
 * proficiency scales the share of the available range a strike uses (its
 * chamber and its trunk turn), never the range itself.
 *
 * Constants with no located study are marked provisional, with the measurement
 * that would settle them.
 */
export namespace IAutoMovieMotionHumanStrikingSkill {
  /** A guard drop after a strike. */
  export interface IGuardDrop {
    /**
     * How far the non-striking or returning glove sags below its guard, metres;
     * 0 when it does not drop.
     */
    depth: number;

    /** How long the drop lasts after the strike's contact, seconds. */
    seconds: number;
  }
}
