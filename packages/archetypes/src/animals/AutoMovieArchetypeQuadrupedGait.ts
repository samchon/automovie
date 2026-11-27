import { AutoMovieArchetypeRefusal } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { QuadrupedChange } from "./QuadrupedChange";
import type { AutoMovieArchetypeQuadruped } from "./AutoMovieArchetypeQuadruped";

/**
 * The timing of a quadruped's gaits: how long a stride lasts and how much of it
 * each foot is on the ground at a speed, and when in the stride each foot
 * lands, read from its species' declared observed, derived or authored table
 * and scaled to the animal's height by dynamic similarity.
 *
 * A species' `ITable` gives its gaits in order of speed, each with declared
 * stride and stance durations by speed, whose owner states observed, derived or
 * authored provenance, the phase at which each foot lands, how it is changed
 * into from the gait below, and the ranges the ride poses with. Unless the
 * table declares absolute clocks, another height uses the table's stated
 * reference and provisional dynamic similarity (`scale`): read at the speed of
 * equal Froude number and multiplied by the square root of the height ratio. A
 * stride starts when the left fore foot lands; a leaded gait is given on the
 * left lead, and the right lead is its mirror image.
 */
export namespace AutoMovieArchetypeQuadrupedGait {
  /** The gaits. */
  export type Gait =
    | "walk"
    | "trot"
    | "tolt"
    | "pace"
    | "runningWalk"
    | "rack"
    | "foxTrot"
    | "pasoLlano"
    | "pasoCorto"
    | "canter"
    | "gallop"
    | "passage"
    | "piaffe";

  /**
   * The gaits that have a lead, whose right lead mirrors the left: the canter
   * and the gallop; the walk and the trot are symmetric.
   */
  export const LEADED: readonly Gait[] = ["canter", "gallop"];

  /**
   * How many times a stride the trunk sinks: twice in the symmetric walk, trot,
   * pace, ambling stepping gaits (`AutoMovieArchetypeEquineGaitedProfile`),
   * passage and piaffe, and once in the canter and gallop. The tölt uses the
   * same two-cycle coarse carriage proxy as the walk. Species supply the
   * oscillation range.
   */
  export const BEATS: Readonly<Record<Gait, number>> = {
    walk: 2,
    trot: 2,
    tolt: 2,
    pace: 2,
    runningWalk: 2,
    rack: 2,
    foxTrot: 2,
    pasoLlano: 2,
    pasoCorto: 2,
    canter: 1,
    gallop: 1,
    passage: 2,
    piaffe: 2,
  };

  /** The sides a leaded gait leads on. */
  export type Lead = "left" | "right";

  /** One stride's gait and lead. */
  export interface IStride {
    /** The gait. */
    gait: Gait;

    /** The lead, read in a leaded gait. */
    lead: Lead;
  }

  /**
   * One declared SI clock point: speed, period, timing spread and contact
   * durations; its table owner identifies observed, derived or authored
   * values.
   */
  export interface IRow {
    /** Speed, metres per second. */
    speed: number;

    /**
     * Declared stride period, seconds; an observed mean, derived representative
     * period or authored clock as the table owner states.
     */
    stride: number;

    /**
     * Declared stride-time spread, seconds: the table owner identifies an
     * empirical SD or authored amplitude; zero means deterministic timing
     * without claiming zero biological variance.
     */
    deviation: number;

    /**
     * Declared fore-foot contact duration, seconds, with provenance stated by
     * the table owner.
     */
    stance: number;

    /**
     * Optional declared hind-foot contact duration, seconds. Absent retains the
     * existing common fore/hind timing approximation for that row.
     */
    hindStance?: number;
  }

  /**
   * One declared gait of a species: its clock rows, its footfalls, how it is
   * changed into, and the ranges the ride poses with.
   */
  export interface IGait {
    /**
     * Declared clock rows in strictly increasing speed order; the source table
     * states their provenance.
     */
    rows: readonly IRow[];

    /**
     * When each foot lands, as a fraction of the stride from the left fore's
     * landing, on the left lead for a leaded gait.
     */
    phases: Readonly<Record<AutoMovieArchetypeQuadrupedBody.Limb, number>>;

    /**
     * How the gait is changed into from the one below it in `ITable.order`;
     * absent for the slowest.
     */
    change?: QuadrupedChange.Rule;

    /**
     * How far the trunk rises and falls in a stride, as a fraction of the
     * height at the withers.
     */
    bob: number;

    /**
     * The head's pitch range in a stride, degrees, and when in the stride it is
     * nose-down: `support`, the nose highest as each fore lifts off; `bob`,
     * nose-down as the trunk sinks; `lead`, lowest at the leading fore's
     * landing.
     */
    nod: Readonly<{ range: number; timing: "support" | "bob" | "lead" }>;

    /** The peak fold of the carpus and of the hock in the swing, degrees. */
    fold: Readonly<{ fore: number; hind: number }>;

    /**
     * How high a swinging foot rises at the middle of its swing, fore and hind,
     * as a fraction of the height at the withers.
     */
    lift: Readonly<{ fore: number; hind: number }>;

    /**
     * Optional landmark elevation replacing `lift`: the swinging toe rises to
     * this coordinate along the supporting limb's own neutral cannon, 0 at the
     * fetlock and 1 at the carpus or hock.
     */
    elevation?: IElevation;
  }

  /**
   * A swing height named by the limb's own anatomical landmarks rather than by
   * a share of the withers height.
   */
  export interface IElevation {
    /**
     * Fore toe height along the fore cannon, 0 at the fetlock and 1 at the
     * carpus.
     */
    fore: number;

    /**
     * Hind toe height along the hind cannon, 0 at the fetlock and 1 at the
     * hock.
     */
    hind: number;
  }

  /** A species' gaits. */
  export interface ITable {
    /** The species' automatically selected gaits, slowest first. */
    order: readonly Gait[];

    /** Optional gait names available only when the take names them. */
    explicit?: readonly Gait[];

    /**
     * Explicit gaits collected out of an ordered gait: while decelerating into
     * one from its parent's speeds, its clock holds its fastest declared row.
     */
    collected?: Readonly<Partial<Record<Gait, Gait>>>;

    /** The declared automatic and explicit-only gait rows. */
    gaits: Readonly<Partial<Record<Gait, IGait>>>;

    /**
     * Declared reference withers height, metres, for the table's stated
     * dynamic-similarity assumption. With absolute scaling this is only the
     * default query height and no measured-height claim is implied.
     */
    reference: number;

    /**
     * `absolute` keeps declared speed/time clocks unscaled without inferring an
     * unmeasured reference height. Absent uses the existing provisional
     * dynamic-similarity rule.
     */
    scaling?: "absolute";

    /**
     * How far past a change point the speed must go before the gait changes,
     * metres per second at the declared reference height, scaled with the
     * gait's speeds.
     */
    hysteresis: number;

    /**
     * The share of a foot's fore-and-aft travel that its top joint follows,
     * fore and hind.
     */
    follow: Readonly<{ fore: number; hind: number }>;
  }

  /** The species identity and gait table read by the clock and phase laws. */
  export type ClockSource = Pick<
    AutoMovieArchetypeQuadruped.ISpecies,
    "archetype" | "table"
  >;

  /** The timing of a gait at a speed. */
  export interface ITiming {
    /** Stride time, seconds. */
    stride: number;

    /**
     * Declared timing spread at that speed, seconds; the owner identifies
     * empirical SD, authored amplitude or deterministic zero without a
     * measured-variance claim.
     */
    deviation: number;

    /** Fore duty factor; also used for hind feet when hindDuty is absent. */
    duty: number;

    /**
     * Hind-foot stance fraction when separately declared in the bracketed rows;
     * absent uses duty for every foot, preserving legacy tables.
     */
    hindDuty?: number;
  }

  /**
   * A species' gait, refused when the species has none of that name.
   *
   * @param species The species.
   * @param gait The gait.
   * @returns The gait's table.
   * @throws {AutoMovieArchetypeRefusal} When the species has no such gait,
   *   listing those it has.
   */
  export function of(species: ClockSource, gait: Gait): IGait {
    const found: IGait | undefined = species.table.gaits[gait];
    if (found === undefined)
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: species.archetype,
        axis: "gait",
        value: gait,
        feasible: { kind: "alternatives", values: [...species.table.order] },
        reason: `a ${species.archetype} has no declared ${gait}`,
        fix: "name one of its gaits",
      });
    return found;
  }

  /**
   * The factor for stride times and speeds: square-root height similarity, or
   * one when the table explicitly preserves an absolute declared interval.
   *
   * Animals of one build move in a dynamically similar way at equal Froude
   * number, the speed squared over gravity times leg length (Alexander and
   * Jayes 1983, J Zool 201:135; Alexander 1984, Int J Robotics Res 3:49): their
   * stride lengths are then the same multiple of leg length, so at speeds in
   * the ratio of the square roots of their leg lengths their stride times are
   * in that ratio too. Height at the withers stands for leg length, the two
   * being proportional across animals of one build. Neither paper was read at
   * its source, and for the horse the rule under-corrects against measured
   * warmbloods (it gives 0.99 s for a 1.6 m/s walk and 0.63 s for a 4.0 m/s
   * trot at 1.615 m, against the 1.09 s and 0.67 s of Back, Schamhardt and
   * Barneveld 1996, Vet Q 18:79): provisional.
   *
   * @param species The species.
   * @param withers The animal's height at the withers, metres.
   * @returns The factor; 1 at the declared reference height, and at every
   *   height for absolute tables.
   */
  export function scale(species: ClockSource, withers: number): number {
    if (species.table.scaling === "absolute") return 1;
    return Math.sqrt(withers / species.table.reference);
  }

  /**
   * The declared speed domain of a gait for an animal of a height: the rows'
   * range at the dynamically similar speeds.
   *
   * @param species The species.
   * @param gait The gait.
   * @param withers The animal's withers height in metres; the table's declared
   *   reference when absent.
   * @returns The least and greatest speed, metres per second.
   * @throws {AutoMovieArchetypeRefusal} When the species has no such gait.
   */
  export function range(
    species: ClockSource,
    gait: Gait,
    withers: number = species.table.reference,
  ): { minimum: number; maximum: number } {
    const rows: readonly IRow[] = of(species, gait).rows;
    const by: number = scale(species, withers);
    return {
      minimum: rows[0]!.speed * by,
      maximum: rows[rows.length - 1]!.speed * by,
    };
  }

  /**
   * The timing of a gait at a speed, for an animal of a height.
   *
   * @param species The species.
   * @param gait The gait.
   * @param speed The speed, metres per second, inside the gait's range for that
   *   height.
   * @param tempo Coordinate of the table's declared timing spread, from -1 to
   *   1; zero when absent. It denotes standard deviations only when that source
   *   reports an SD.
   * @param withers The animal's withers height, metres; the declared reference
   *   when absent. Absolute tables preserve their clocks without a
   *   measured-height claim.
   * @returns Declared stride time, timing spread and fore duty, with separate
   *   hind duty when supplied. Duties are ratios of interpolated contact
   *   durations to period, not a claim to reproduce independently averaged
   *   biological statistics. Height similarity remains provisional as `scale`
   *   states.
   * @throws {AutoMovieArchetypeRefusal} When the species has no such gait, the
   *   speed lies outside the gait's range for that height, giving the range,
   *   the tempo lies outside -1 to 1, or the height is not positive.
   */
  export function timing(
    species: ClockSource,
    gait: Gait,
    speed: number,
    tempo: number = 0,
    withers: number = species.table.reference,
  ): ITiming {
    /** Report a malformed timing coordinate with its dimensional range. */
    function refuse(
      axis: string,
      value: number,
      low: number,
      high: number | null,
      unit: string,
      reason: string,
    ): never {
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: species.archetype,
        axis,
        value,
        feasible: { kind: "range", minimum: low, maximum: high, unit },
        reason,
        fix: `give a ${axis} inside its range`,
      });
    }
    if (!(withers > 0))
      refuse("withers", withers, 0, null, "m", "a height is positive");
    if (!(tempo >= -1 && tempo <= 1))
      refuse(
        "tempo",
        tempo,
        -1,
        1,
        "",
        "tempo is a coordinate from -1 to 1 of the declared timing spread",
      );
    const rows: readonly IRow[] = of(species, gait).rows;
    const by: number = scale(species, withers);
    const { minimum, maximum }: { minimum: number; maximum: number } = range(
      species,
      gait,
      withers,
    );
    if (!(speed >= minimum && speed <= maximum))
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: species.archetype,
        axis: "speed",
        value: speed,
        feasible: { kind: "range", minimum, maximum, unit: "m/s" },
        reason: `a ${species.archetype} of ${withers} m has no declared ${gait} at ${speed} m/s`,
        fix: "choose a speed inside the gait's range, or another gait",
      });

    // The declared reference speed at the same Froude number, held inside the rows against rounding at the ends.
    const similar: number = Math.max(
      rows[0]!.speed,
      Math.min(rows[rows.length - 1]!.speed, speed / by),
    );
    let k: number = 0;
    while (k < rows.length - 2 && similar > rows[k + 1]!.speed) k++;
    const low: IRow = rows[k]!;
    const high: IRow = rows.length === 1 ? low : rows[k + 1]!;
    const share: number =
      rows.length === 1 ? 0 : (similar - low.speed) / (high.speed - low.speed);
    /** Interpolate one pair at the already admitted speed bracket. */
    function mix(a: number, b: number): number {
      return a + (b - a) * share;
    }
    const deviation: number = mix(low.deviation, high.deviation);
    const stride: number = mix(low.stride, high.stride);
    return {
      stride: (stride + tempo * deviation) * by,
      deviation: deviation * by,
      duty: mix(low.stance, high.stance) / stride,
      ...(low.hindStance === undefined && high.hindStance === undefined
        ? {}
        : {
            hindDuty:
              mix(
                low.hindStance ?? low.stance,
                high.hindStance ?? high.stance,
              ) / stride,
          }),
    };
  }

  /**
   * When a foot lands in a stride, as a fraction of it from the left fore's
   * landing: the gait's phases on the left lead, and their mirror on the
   * right.
   *
   * @param species The species.
   * @param stride The stride's gait and lead.
   * @param limb The foot.
   * @returns The phase, 0 to 1.
   * @throws {AutoMovieArchetypeRefusal} When the species has no such gait.
   */
  export function phase(
    species: ClockSource,
    stride: IStride,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
  ): number {
    const phases: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, number>
    > = of(species, stride.gait).phases;
    if (stride.lead === "left" || !LEADED.includes(stride.gait))
      return phases[limb];
    const mirror: AutoMovieArchetypeQuadrupedBody.Limb =
      limb === "leftFore"
        ? "rightFore"
        : limb === "rightFore"
          ? "leftFore"
          : limb === "leftHind"
            ? "rightHind"
            : "leftHind";
    const shifted: number = phases[mirror] - phases.rightFore;
    return shifted < 0 ? shifted + 1 : shifted;
  }
}
