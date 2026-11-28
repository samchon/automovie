import { AutoMovieArchetypeRefusal } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { QuadrupedChange } from "./quadruped/QuadrupedChange";
import type { AutoMovieArchetypeQuadruped } from "./AutoMovieArchetypeQuadruped";

/**
 * Reads stride periods, stance fractions and touchdown phases from
 * species tables.
 */
export namespace AutoMovieArchetypeQuadrupedGait {
  /**
   * Closed names for gait clocks, from walking to leaded, ambling and
   * collected gaits. A species supplies only the clocks it supports.
   */
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

  /** Gaits with separate mirrored leads, `canter` and `gallop`. */
  export const LEADED: readonly Gait[] = ["canter", "gallop"];

  /**
   * Trunk oscillation cycles per stride. Canter and gallop use one cycle.
   * Every other declared gait uses two.
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

  /** Left or right lead of a canter or gallop. */
  export type Lead = "left" | "right";

  /** Names a gait and its lead for a query of one stride. */
  export interface IStride {
    /** Gait to read from the species table. */
    gait: Gait;

    /** Side used to mirror phases for a canter or gallop. */
    lead: Lead;
  }

  /**
   * Clock measurements at one speed. The table owner records whether each
   * value is observed, derived or authored.
   */
  export interface IRow {
    /** Speed at this clock point in metres per second. */
    speed: number;

    /** Duration of one complete stride in seconds. */
    stride: number;

    /** Stride-time spread in seconds. Zero gives deterministic timing. */
    deviation: number;

    /** Fore-foot ground contact time in seconds. */
    stance: number;

    /**
     * Optional hind-foot ground contact time in seconds. An omitted row uses
     * that row's fore contact time during interpolation.
     */
    hindStance?: number;
  }

  /** Clock rows, touchdown phases, transition and pose inputs for one gait. */
  export interface IGait {
    /**
     * Nonempty clock points in strictly increasing speed order. One row
     * defines one admitted speed.
     */
    rows: readonly IRow[];

    /**
     * Touchdown fractions in [0, 1) from left fore contact. Supply left-lead
     * values for a gait whose phases depend on its lead.
     */
    phases: Readonly<Record<AutoMovieArchetypeQuadrupedBody.Limb, number>>;

    /**
     * Rule for entry from the preceding automatic gait. Omit it for the
     * slowest automatic gait and for explicit-only gaits.
     */
    change?: QuadrupedChange.Rule;

    /** Trunk rise and fall range as a fraction of the withers height. */
    bob: number;

    /**
     * Head pitch range in degrees. `support` makes the head highest on fore
     * lift-off, `bob` links it to the trunk cycle and `lead` makes it lowest
     * at the leading fore foot's landing.
     */
    nod: Readonly<{ range: number; timing: "support" | "bob" | "lead" }>;

    /** Peak carpus and hock fold during fore and hind swing, in degrees. */
    fold: Readonly<{ fore: number; hind: number }>;

    /**
     * Mid-swing clearance as a fraction of withers height for each foot pair.
     */
    lift: Readonly<{ fore: number; hind: number }>;

    /**
     * Optional swing targets along the supporting cannons. When present these
     * take the place of withers-relative `lift`.
     */
    elevation?: IElevation;
  }

  /**
   * Swing height targets measured along the supporting fore and hind
   * cannons.
   */
  export interface IElevation {
    /** Fore toe target from 0 at the fetlock to 1 at the carpus. */
    fore: number;

    /** Hind toe target from 0 at the fetlock to 1 at the hock. */
    hind: number;
  }

  /** A species' admitted gait vocabulary, clock data and ride settings. */
  export interface ITable {
    /**
     * Automatic gait order by increasing minimum speed. Adjacent gait ranges
     * can overlap.
     */
    order: readonly Gait[];

    /** Gaits available only when named in the take. */
    explicit?: readonly Gait[];

    /**
     * Maps a named collected gait to its automatic parent. When the course
     * is above the collected range but still within the parent range, the
     * ride uses the collected gait's fastest clock row.
     */
    collected?: Readonly<Partial<Record<Gait, Gait>>>;

    /** One definition for each listed automatic or explicit gait. */
    gaits: Readonly<Partial<Record<Gait, IGait>>>;

    /**
     * Reference withers height in metres. An absolute table uses it as the
     * default query height.
     */
    reference: number;

    /**
     * Use `absolute` to keep recorded speeds and times. Omit it to scale
     * speeds and times by the square root of the height ratio.
     */
    scaling?: "absolute";

    /**
     * Speed offset around an automatic change point, in metres per second at
     * the table's reference height.
     */
    hysteresis: number;

    /** Fractions of fore and hind foot travel followed by each top joint. */
    follow: Readonly<{ fore: number; hind: number }>;
  }

  /**
   * Species identity for refusals and the gait table for clock and phase
   * queries.
   */
  export type ClockSource = Pick<
    AutoMovieArchetypeQuadruped.ISpecies,
    "archetype" | "table"
  >;

  /**
   * Stride period, timing spread and planted fractions at a requested
   * speed.
   */
  export interface ITiming {
    /**
     * Stride duration in seconds, after tempo displacement and height
     * scaling.
     */
    stride: number;

    /** Height-scaled stride-time spread in seconds. */
    deviation: number;

    /**
     * Fore-foot stance time divided by the interpolated period before tempo.
     */
    duty: number;

    /**
     * Hind-foot stance fraction when either bracket row has an explicit hind
     * contact duration. When absent, use `duty`.
     */
    hindDuty?: number;
  }

  /**
   * Looks up one gait's table.
   *
   * @param species Species identity and admitted gait table.
   * @param gait Name of the gait to find.
   * @returns The stored gait definition.
   * @throws {AutoMovieArchetypeRefusal} If the gait is absent. The refusal
   *   lists the automatic gait alternatives.
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
   * Computes the speed and time scale for a query at a given height.
   *
   * @param species Clock source with its declared scaling and reference height.
   * @param withers Withers height in metres.
   * @returns One for absolute scaling. Otherwise the square root of the
   *   query height divided by reference height. This is a provisional
   *   similarity based on withers height.
   */
  export function scale(species: ClockSource, withers: number): number {
    if (species.table.scaling === "absolute") return 1;
    return Math.sqrt(withers / species.table.reference);
  }

  /**
   * Reads a gait's inclusive speed interval at the supplied height.
   *
   * @param species Species identity and admitted clock table.
   * @param gait Name of the gait to query.
   * @param withers Withers height in metres. Defaults to the table reference.
   * @returns Minimum and maximum metres per second. Both are the same for
   *   a single-point clock.
   * @throws {AutoMovieArchetypeRefusal} If the gait is absent.
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
   * Samples the admitted clock at a speed within its inclusive range.
   *
   * Interpolates the bracketing rows at equivalent reference speed and scales
   * the resulting stride and spread. `tempo` changes period by its share of
   * that spread. Both duty factors still use the period before that change.
   *
   * @param species Species identity and admitted clock table.
   * @param gait Name of the gait to query.
   * @param speed Speed in metres per second within the height-scaled range.
   * @param tempo Displacement from −1 to 1 through the declared timing spread.
   *   Defaults to zero.
   * @param withers Positive finite withers height in metres. Defaults to the
   *   table's reference height.
   * @returns The clock and planted fractions. A bracket without hind contact
   *   readings omits the separate hind duty.
   * @throws {AutoMovieArchetypeRefusal} For an unknown gait, invalid speed,
   *   tempo or height, or a period or spread outside the finite clock range.
   */
  export function timing(
    species: ClockSource,
    gait: Gait,
    speed: number,
    tempo: number = 0,
    withers: number = species.table.reference,
  ): ITiming {
    /*
     * Report a malformed timing coordinate with its dimensional range.
     */
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
    if (!Number.isFinite(withers) || withers <= 0)
      refuse(
        "withers",
        withers,
        0,
        null,
        "m",
        "a height is finite and positive",
      );
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
    if (!Number.isFinite(speed) || !(speed >= minimum && speed <= maximum))
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
    /*
     * Interpolate one pair at the already admitted speed bracket.
     */
    function mix(a: number, b: number): number {
      return a + (b - a) * share;
    }
    const deviation: number = mix(low.deviation, high.deviation);
    const stride: number = mix(low.stride, high.stride);
    const period: number = (stride + tempo * deviation) * by;
    const spread: number = deviation * by;
    if (!Number.isFinite(period) || period <= 0)
      refuse(
        "stride",
        period,
        0,
        null,
        "s",
        "the adjusted stride must be finite and positive",
      );
    if (!Number.isFinite(spread))
      refuse(
        "deviation",
        spread,
        0,
        null,
        "s",
        "the scaled timing spread must be finite",
      );
    return {
      stride: period,
      deviation: spread,
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
   * Reads a foot's touchdown as a fraction of the stride.
   *
   * Right lead mirrors the four leaded offsets, then restarts the clock at
   * left fore touchdown. Other gaits use the stored offsets for both leads.
   *
   * @param species Species identity and admitted timing table.
   * @param stride Gait and lead being evaluated.
   * @param limb Foot to read.
   * @returns Touchdown phase from zero up to one, excluding one.
   * @throws {AutoMovieArchetypeRefusal} If the gait is absent.
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
