/**
 * Heel strikes entrained to a beat track: which beat each strike answers and
 * when it lands, by the linear phase-correction model of sensorimotor
 * synchronisation (Vorberg and Wing 1996, reviewed by Repp 2005, Psychon Bull
 * Rev 12:969).
 *
 * A locked walker's k-th heel strike answers beat `b0 + k`. Its asynchrony,
 * strike minus beat, follows `A(k+1) = (1 - alpha) A(k) + T(k) - C`, with `C`
 * the beat's period, `T(k)` the walker's timer interval (the period drawn with
 * Wing and Kristofferson's timing variability, `HumanSkill.jitter`, which
 * carries the motor part too) and `alpha` the correction gain, discipline's
 * (`HUMAN_ATTRIBUTE_EFFECTS.discipline .correction`). The first strike keeps
 * the plan's own second, so its asynchrony is where the walker set off, and the
 * correction draws the strikes onto the beats from there. Whether a walker
 * locks at all is drawn against discipline's share (`discipline.lock`: 62 % of
 * side-by-side civilian pairs lock step frequency, Nessler and Gilliland 2009;
 * drilled troops all do); one who does not keeps its own tempo. After the
 * track's last beat the steps keep the plan's own times.
 */
export namespace IAutoMovieMotionHumanWalkCadence {
  /** A walk's cadence: the beat track it keeps step to. */
  export interface ICadence {
    /** The cue track's name (`HumanCue.beats`), each `beat` a step. */
    cue: string;

    /**
     * The foot that strikes on beat `index`; the left when absent, by drill
     * custom.
     */
    foot?: "left" | "right";

    /**
     * The beat the `foot`'s first strike answers; the beat nearest it when
     * absent.
     */
    index?: number;
  }

  /**
   * The film seconds a walker's heel strikes land at, entrained to a beat
   * track, or null when the walker does not lock. Input strikes of
   * walkCadence.strikes. The plan's heel strikes, seconds of the plan, in
   * order, with the foot of each.
   */
  export type IStrikesStrikes = readonly {
    /** Heel-strike instant in action-local seconds, in chronological order. */
    seconds: number;
    /** Foot making this heel strike. */
    side: "left" | "right";
  }[];
}
