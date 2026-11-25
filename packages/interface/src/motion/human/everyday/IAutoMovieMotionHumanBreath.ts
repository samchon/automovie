/**
 * Breathing as an additive layer: the chest, the upper chest and the lumbar
 * spine extend and the shoulder girdles rise a little with each inhalation, on
 * every action, at a seeded resting rate that exertion raises and that recovers
 * afterwards, with an occasional seeded sigh.
 *
 * Breathing is written as joint angles rather than an effector goal, because no
 * body point is brought anywhere: it is a rhythmic change of the trunk's own
 * shape. Every planted or gripping limb goal is left untouched, and the arms
 * and legs are solved by inverse kinematics after the trunk, so contacts and
 * held hand goals stay where they are.
 *
 * The law, with its sources:
 *
 * - Resting rate 12 to 20 breaths a minute, the adult normal range (Cretikos et
 *   al. 2008, Med J Aust 188:657); each performer's rate is a seeded draw from
 *   a normal of mean 15 and SD 2 truncated to that band. Children breathe
 *   faster; the centiles of Fleming et al. 2011 (Lancet 377:1011) apply below
 *   18 years, and a caller passes such a rate as `rate`.
 * - Inspiration takes 0.42 of each cycle (Ti/Ttot of quiet breathing, Tobin et
 *   al. 1983, Chest 84:202); inhalation and exhalation each follow a
 *   minimum-jerk profile, so the layer is continuous in value and velocity.
 * - Sighs: humans sigh about twelve times an hour (Ramirez 2014, Prog Brain Res
 *   209:91), so each cycle is a sigh with probability `period / 300 s`, drawn
 *   from the cycle's index; a sigh's amplitude is 2.5 times a tidal breath
 *   (provisional: a sigh is described as about two to three tidal volumes, the
 *   joint scale of that volume is unmeasured).
 * - Exertion: each declared bout raises the rate toward 43 a minute and the
 *   amplitude toward 5 times tidal at level 1 (peak breathing frequency and
 *   tidal volume of exercise to exhaustion, Loe, Steinshamn and Wisloff 2014,
 *   PLoS ONE 9:e113884), rising from its start over a minute of the exercise
 *   (Whipp and Ward 1990, Med Sci Sports Exerc 22:62) and recovering as `(1 -
 *   u)^3` over its recovery time (the polynomial shapes are no measurement;
 *   ventilation rises and recovers roughly exponentially, and a polynomial
 *   keeps the computation exact in ECMAScript). Overlapping bouts do not add:
 *   the hardest one drives the breathing at each instant, so no number of bouts
 *   passes the level-1 rate and amplitude. The phase is the closed-form
 *   integral of the rate, so a rate change never jumps the phase.
 * - Angles at one tidal breath (provisional; no located study gives the trunk
 *   joint angles of quiet breathing): chest extension 1.5 degrees, upper chest
 *   1 degree, lumbar spine 0.5 degrees and each shoulder girdle raised 1
 *   degree.
 *
 * The phase runs on film seconds from a seeded offset, so breathing continues
 * smoothly across action boundaries.
 */
export namespace IAutoMovieMotionHumanBreath {
  /** The breathing layer. Layer options. */
  export interface IOptions {
    /** Breaths a minute at rest; a seeded draw from the adult band when absent. */
    rate?: number;

    /** Bouts of exertion. */
    exertion?: IAutoMovieMotionHumanBreath.IExertion[];
  }

  /** One bout of exertion, from `from` to `at`. */
  export interface IExertion {
    /** Film second the bout starts; under way since before the film when absent. */
    from?: number;

    /** Film second the bout ends and recovery starts. */
    at: number;

    /** Level in [0, 1]: 0 at rest, 1 at hard exercise. */
    level: number;

    /** Recovery seconds; 60 when absent, the onset's span (Whipp and Ward 1990). */
    recovery?: number;
  }

  /**
   * The breathing state at a film second. Result returned by HumanBreath.state.
   * The rate, the cycle phase and the lung volume in tidal breaths.
   */
  export type IStateResult = {
    /** Instantaneous breathing rate in breaths per minute. */
    rate: number;
    /**
     * Integrated breathing phase in cycles, including the performer's
     * deterministic phase offset.
     */
    phase: number;
    /** Tidal breath volume relative to the resting breath volume. */
    volume: number;
  };
}
