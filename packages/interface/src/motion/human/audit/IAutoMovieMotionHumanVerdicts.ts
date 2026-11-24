import type { IAutoMovieMotionHumanPerformance } from "../perform/IAutoMovieMotionHumanPerformance";

/**
 * The verdict report of a performance: every physical bound that holds for any
 * human motion whatever it means to do, read on the film a composition gives,
 * with each finding placed on the performer and the action it happens in.
 *
 * A composition that plans is not yet a composition that performs well: a hand
 * may pass through a hip, a foot may skate. A production checks its own scene
 * with this report before it looks at a single frame, and a scene is accepted
 * only when the report is clean, a cited signature value holds
 * (`HumanSignature`) and the stills show no flaw.
 *
 * ```ts
 * const report = HumanVerdicts(performance);
 * if (!report.clean) throw new Error(HumanVerdicts.describe(report));
 * ```
 *
 * The bounds, the ones the vocabulary's own sweep holds every action to:
 *
 * - `timing`: every declared contact window and event is well formed.
 * - `tangle`: no part of a body passes more than 10 mm into another part of it
 *   (the skin's give where a hand rests on the body).
 * - `floor`, `slip`, `lift`: nothing sinks under the floor, and a planted foot
 *   neither slides nor leaves it, each within 5 mm.
 * - `jump`, `reversal`, `speed`: every joint centre travels a continuous path
 *   with no out-and-back spike and no impossible speed.
 * - `balance`: while both feet alone bear the body, its extrapolated centre of
 *   mass stays over them.
 * - `skate`, `loose`, `afloat`: a foot the motion shows on the floor does not
 *   skate, and a declared plant is neither loose nor afloat.
 * - `statics`: while a held body's bearing contacts all declare their load, the
 *   load-weighted contact centre lies under the centre of mass within 2 % of
 *   stature (`AutoMovieMotionHumanAuditStatics`).
 * - `range`: every joint stays within its range of motion, within `ROM_TOLERANCE`
 *   (0.01 degrees).
 * - `unloaded`: a foot no plant on the ground holds dorsiflexes no further than
 *   an ankle bearing no weight does (`ANKLE_DORSIFLEXION.unloaded`), within
 *   `ROM_TOLERANCE`.
 * - `turn`: no bone snaps by more than 5 degrees, the turn left once an interval
 *   is halved until a smooth turn is gone
 *   (`AutoMovieMotionHumanAuditSpin.SNAP`).
 * - `partner`: two people do not pass more than 10 mm into each other.
 *
 * A performer who swims or climbs a ladder is not carried by the floor, so the
 * floor, plant and balance bounds are left unread for that performer.
 *
 * Each reading is in its bound's own unit, the one its audit owner states:
 *
 * - Metres: `tangle`, `floor`, `slip`, `lift`, `jump`, `reversal`, `balance`,
 *   `afloat`, `statics` and `partner`;
 * - Metres per second: `speed`, `skate` and `loose`;
 * - Degrees: `range`, `unloaded` and `turn`;
 * - None: `timing`, whose finding reads zero.
 */
export namespace IAutoMovieMotionHumanVerdicts {
  /** A bound that does not hold. */
  export interface IFinding {
    /** The bound. */
    check: string;

    /** The performer, or `a+b` for a bound between two. */
    subject: string;

    /**
     * The action the finding's instant lies in; empty before the performer's
     * first action or for a bound read over the whole film.
     */
    act: string;

    /**
     * Which occurrence of that action in the performer's chain, from 1; 0 when
     * `act` is empty.
     */
    instance: number;

    /** The reading in the bound's own unit (units above); for `timing`, 0. */
    value: number;

    /** The limit it exceeds, in the same unit; for `timing`, 0. */
    limit: number;

    /** The film second of the reading. */
    seconds: number;

    /** What the reading is of: a bone, a pair of parts, or the fault's text. */
    where: string;
  }

  /**
   * Read every bound on a performance, or on one span of its film. The report
   * of a performance.
   */
  export interface IReport {
    /** Whether every bound holds. */
    clean: boolean;

    /**
     * The bounds that do not hold, performer by performer in the order they
     * were given.
     */
    findings: IAutoMovieMotionHumanVerdicts.IFinding[];

    /**
     * The flights still in the air at the film's end, each as
     * `prop@launch-second`: allowed, since a shot into the distance is
     * legitimate, and so reported apart from the findings. `of` always fills
     * it; absent from a report built by hand.
     */
    unended?: string[];
  }

  /**
   * Read every bound on a performance, or on one span of its film. Input span
   * of HumanVerdicts. The film seconds the bounds are read over; the whole film
   * when absent.
   */
  export type IOfSpan = {
    /** Beginning of the judged interval, in performance seconds. */
    from: number;
    /** End of the judged interval, in performance seconds. */
    to: number;
  };

  /**
   * One performer of a verdict report as a film names it: the subject the
   * report's findings carry, the film's entity path of that performer and
   * whether the floor carries the body.
   */
  export interface IPerformer {
    /** The performer's subject, as the report names it. */
    subject: string;

    /** The film's canonical entity path of the performer. */
    path: string;

    /**
     * Whether the performer swims or climbs a ladder, so the floor, plant and
     * balance bounds were left unread for them.
     */
    airborne: boolean;
  }

  /**
   * A performance a film offers to be read, with the entity path of each of its
   * performers.
   */
  export interface ISource {
    /** The film's human performance. */
    performance: IAutoMovieMotionHumanPerformance;

    /** The film's canonical entity path of each performer, by subject. */
    paths: Readonly<Record<string, string>>;
  }
}
