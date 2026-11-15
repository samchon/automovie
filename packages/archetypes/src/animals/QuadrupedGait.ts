import { ArchetypeRefusal } from "../core";
import type { QuadrupedBody } from "./QuadrupedBody";
import type { QuadrupedChange } from "./QuadrupedChange";
import type { createQuadruped } from "./createQuadruped";

/**
 * The timing of a quadruped's gaits: how long a stride lasts and how much of it each foot is on the ground at a speed, and when in the stride each foot lands, read from its species' measured table and scaled to the animal's height by dynamic similarity.
 *
 * A species' `ITable` gives its gaits in order of speed, each with measured rows of stride time and stance time by speed, the phase at which each foot lands, how it is changed into from the gait below, and the ranges the ride poses with. For an animal of another height than the one measured the rows are scaled by dynamic similarity (`scale`): read at the speed of equal Froude number and multiplied by the square root of the height ratio. A stride starts when the left fore foot lands; a leaded gait is given on the left lead, and the right lead is its mirror image.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a species gives, how height enters and the stride's zero.
 * @evidence contracts/development/design.md#principled-representation Measured rows by gait and speed, read by interpolation, and one landing phase per foot per gait: the two things a gait is, in the studies' own variables, as each species' data.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `rideQuadruped` reads to pose the limbs and name the footfalls, and what a riding act reads to lock a rising trot to a diagonal (#3352).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No fitted curve stands in for the rows; a speed outside a gait's measured range, or a gait the species has no table for, is refused.
 */
export namespace QuadrupedGait {
  /**
   * The gaits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is.
   * @evidence contracts/development/design.md#principled-representation The gaits measured, as a closed union.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; a parameter of `rideQuadruped` and the key of every species' table.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Closed literals, not free text.
   */
  export type Gait = "walk" | "trot" | "canter" | "gallop";

  /** The gaits that have a lead, whose right lead mirrors the left: the canter and the gallop; the walk and the trot are symmetric. */
  export const LEADED: readonly Gait[] = ["canter", "gallop"];

  /** How many times a stride the trunk sinks: twice in the walk and the trot, whose two halves mirror each other, and once in the canter and the gallop. */
  export const BEATS: Readonly<Record<Gait, number>> = {
    walk: 2,
    trot: 2,
    canter: 1,
    gallop: 1,
  };

  /** The sides a leaded gait leads on. */
  export type Lead = "left" | "right";

  /**
   * One stride's gait and lead.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is.
   * @evidence contracts/development/design.md#principled-representation The two choices a stride is taken at.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; read by `phase`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IStride {
    /** The gait. */
    gait: Gait;

    /** The lead, read in a leaded gait. */
    lead: Lead;
  }

  /**
   * One measured row: a speed with the stride's mean time, its standard deviation and the left fore foot's stance time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation One measured row: speed in metres per second, mean stride time and its standard deviation in seconds, and the left fore's stance time in seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; the element of `IGait.rows`, read by `timing`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None; the members are the studies' own variables.
   */
  export interface IRow {
    /** Speed, metres per second. */
    speed: number;

    /** Mean stride time, seconds. */
    stride: number;

    /** Standard deviation of the stride time, seconds; zero for a row of one stride. */
    deviation: number;

    /** Mean stance time of the left fore foot, seconds. */
    stance: number;
  }

  /**
   * One gait of a species: its measured rows, its footfalls, how it is changed into, and the ranges the ride poses with.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation The gait's measured variables in their units: seconds, metres, degrees and fractions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; each species states its own in its `ITable`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None; a value one gait borrows from another says so where the species states it.
   */
  export interface IGait {
    /** The measured rows, in order of speed. */
    rows: readonly IRow[];

    /** When each foot lands, as a fraction of the stride from the left fore's landing, on the left lead for a leaded gait. */
    phases: Readonly<Record<QuadrupedBody.Limb, number>>;

    /** How the gait is changed into from the one below it in `ITable.order`; absent for the slowest. */
    change?: QuadrupedChange.Rule;

    /** How far the trunk rises and falls in a stride, metres. */
    bob: number;

    /** The head's pitch range in a stride, degrees, and when in the stride it is nose-down: `support`, the nose highest as each fore lifts off; `bob`, nose-down as the trunk sinks; `lead`, lowest at the leading fore's landing. */
    nod: Readonly<{ range: number; timing: "support" | "bob" | "lead" }>;

    /** The peak fold of the carpus and of the hock in the swing, degrees. */
    fold: Readonly<{ fore: number; hind: number }>;

    /** How high a swinging foot rises at the middle of its swing, fore and hind, as a fraction of the height at the withers. */
    lift: Readonly<{ fore: number; hind: number }>;
  }

  /**
   * A species' gaits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation The gaits by name in order of speed, the measured animals' height, and the two values the ride reads across gaits.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; a species' `createQuadruped.ISpecies.table`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITable {
    /** The species' gaits, slowest first. */
    order: readonly Gait[];

    /** Each gait in `order`. */
    gaits: Readonly<Partial<Record<Gait, IGait>>>;

    /** The height at the withers of the animals the rows were measured on, metres. */
    reference: number;

    /** How far past a change point the speed must go before the gait changes, metres per second at the measured animals' height, scaled with the gait's speeds. */
    hysteresis: number;

    /** The share of a foot's fore-and-aft travel that its top joint follows, fore and hind. */
    follow: Readonly<{ fore: number; hind: number }>;
  }

  /**
   * The timing of a gait at a speed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation A gait's timing at a speed: stride time and its deviation in seconds, and the duty factor, a fraction between 0 and 1.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; returned by `timing` and read by `rideQuadruped`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITiming {
    /** Stride time, seconds. */
    stride: number;

    /** Standard deviation of the stride time at that speed, seconds. */
    deviation: number;

    /** Duty factor: the fraction of the stride a foot is on the ground. */
    duty: number;
  }

  /**
   * A species' gait, refused when the species has none of that name.
   *
   * @param species The species.
   * @param gait The gait.
   * @returns The gait's table.
   * @throws {ArchetypeRefusal} When the species has no such gait, listing those it has.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A lookup in the species' table.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Find, or refuse with the alternatives.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A gait the species lacks is refused, never borrowed from another species.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(species: createQuadruped.ISpecies, gait: Gait): IGait {
    const found: IGait | undefined = species.table.gaits[gait];
    if (found === undefined)
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: species.archetype,
        axis: "gait",
        value: gait,
        feasible: { kind: "alternatives", values: [...species.table.order] },
        reason: `a ${species.archetype} has no measured ${gait}`,
        fix: "name one of its gaits",
      });
    return found;
  }

  /**
   * The factor by which an animal's stride times and speeds differ from its species' measured animals' at the same gait: the square root of its height at the withers over theirs.
   *
   * Animals of one build move in a dynamically similar way at equal Froude number, the speed squared over gravity times leg length (Alexander and Jayes 1983, J Zool 201:135; Alexander 1984, Int J Robotics Res 3:49): their stride lengths are then the same multiple of leg length, so at speeds in the ratio of the square roots of their leg lengths their stride times are in that ratio too. Height at the withers stands for leg length, the two being proportional across animals of one build. Neither paper was read at its source, and for the horse the rule under-corrects against measured warmbloods (it gives 0.99 s for a 1.6 m/s walk and 0.63 s for a 4.0 m/s trot at 1.615 m, against the 1.09 s and 0.67 s of Back, Schamhardt and Barneveld 1996, Vet Q 18:79): provisional.
   *
   * @param species The species.
   * @param withers The animal's height at the withers, metres.
   * @returns The factor; 1 at the measured animals' height.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the similarity rule, its sources, what stands for leg length and how far it falls short of a measured case.
   * @evidence contracts/development/implementation.md#principled-implementation Dynamic similarity at equal Froude number, the rule the human gaits of this repository scale by.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One square root.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No factor is fitted to the warmblood figures; the shortfall is stated instead.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function scale(
    species: createQuadruped.ISpecies,
    withers: number,
  ): number {
    return Math.sqrt(withers / species.table.reference);
  }

  /**
   * The range of speeds of a gait for an animal of a height: the measured rows' range at the dynamically similar speeds.
   *
   * @param species The species.
   * @param gait The gait.
   * @param withers The animal's height at the withers, metres; the measured animals' when absent.
   * @returns The least and greatest speed, metres per second.
   * @throws {ArchetypeRefusal} When the species has no such gait.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the range is and how height enters.
   * @evidence contracts/development/implementation.md#principled-implementation The first and last measured rows' speeds times `scale`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two lookups and one factor.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `of` and `scale`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function range(
    species: createQuadruped.ISpecies,
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
   * @param speed The speed, metres per second, inside the gait's range for that height.
   * @param tempo How far this animal's stride time lies from the mean, in standard deviations, from -1 to 1; the mean when absent.
   * @param withers The animal's height at the withers, metres; the measured animals' when absent, which gives the rows as measured.
   * @returns The stride time, its standard deviation and the duty factor. For a height other than the measured animals' the times are scaled by dynamic similarity and are provisional, as `scale` states.
   * @throws {ArchetypeRefusal} When the species has no such gait, the speed lies outside the gait's range for that height, giving the range, the tempo lies outside -1 to 1, or the height is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs' units and ranges, what height does, that scaled values are provisional and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The rows are read at the dynamically similar speed, the speed over `scale`, by linear interpolation between the two rows that bracket it; the stride time and its deviation are then multiplied by `scale`, and the duty factor, a ratio of two times, is unchanged.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the height, the tempo and the speed, scale the speed, find the bracket, interpolate three numbers, scale the times.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is extrapolated beyond the rows.
   * @evidence contracts/development/implementation.md#efficient-algorithms A scan of at most ten rows.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `of`, `scale` and `range`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function timing(
    species: createQuadruped.ISpecies,
    gait: Gait,
    speed: number,
    tempo: number = 0,
    withers: number = species.table.reference,
  ): ITiming {
    const refuse = (
      axis: string,
      value: number,
      low: number,
      high: number | null,
      unit: string,
      reason: string,
    ): never => {
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: species.archetype,
        axis,
        value,
        feasible: { kind: "range", minimum: low, maximum: high, unit },
        reason,
        fix: `give a ${axis} inside its range`,
      });
    };
    if (!(Number.isFinite(withers) && withers > 0))
      refuse("withers", withers, 0, null, "m", "a height is positive");
    if (!(tempo >= -1 && tempo <= 1))
      refuse(
        "tempo",
        tempo,
        -1,
        1,
        "",
        "tempo is at most one standard deviation from the mean",
      );
    const rows: readonly IRow[] = of(species, gait).rows;
    const by: number = scale(species, withers);
    const { minimum, maximum }: { minimum: number; maximum: number } = range(
      species,
      gait,
      withers,
    );
    if (!(speed >= minimum && speed <= maximum))
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: species.archetype,
        axis: "speed",
        value: speed,
        feasible: { kind: "range", minimum, maximum, unit: "m/s" },
        reason: `a ${species.archetype} of ${withers} m has no measured ${gait} at ${speed} m/s`,
        fix: "choose a speed inside the gait's range, or another gait",
      });

    // The measured animals' speed at the same Froude number, held inside the rows against rounding at the ends.
    const similar: number = Math.max(
      rows[0]!.speed,
      Math.min(rows[rows.length - 1]!.speed, speed / by),
    );
    let k: number = 0;
    while (k < rows.length - 2 && similar > rows[k + 1]!.speed) k++;
    const low: IRow = rows[k]!;
    const high: IRow = rows[k + 1]!;
    const share: number = (similar - low.speed) / (high.speed - low.speed);
    const mix = (a: number, b: number): number => a + (b - a) * share;
    const deviation: number = mix(low.deviation, high.deviation);
    const stride: number = mix(low.stride, high.stride);
    return {
      stride: (stride + tempo * deviation) * by,
      deviation: deviation * by,
      duty: mix(low.stance, high.stance) / stride,
    };
  }

  /**
   * When a foot lands in a stride, as a fraction of it from the left fore's landing: the gait's phases on the left lead, and their mirror on the right.
   *
   * @param species The species.
   * @param stride The stride's gait and lead.
   * @param limb The foot.
   * @returns The phase, 0 to 1.
   * @throws {ArchetypeRefusal} When the species has no such gait.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the zero and the mirror.
   * @evidence contracts/development/implementation.md#principled-implementation The right lead is the left lead's mirror image: each foot takes its opposite's phase, shifted so the left fore still lands at 0.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup, or a mirrored lookup and a shift.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `of`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function phase(
    species: createQuadruped.ISpecies,
    stride: IStride,
    limb: QuadrupedBody.Limb,
  ): number {
    const phases: Readonly<Record<QuadrupedBody.Limb, number>> = of(
      species,
      stride.gait,
    ).phases;
    if (stride.lead === "left" || !LEADED.includes(stride.gait))
      return phases[limb];
    const mirror: QuadrupedBody.Limb = (
      limb.startsWith("left")
        ? limb.replace("left", "right")
        : limb.replace("right", "left")
    ) as QuadrupedBody.Limb;
    const shifted: number = phases[mirror] - phases.rightFore;
    return shifted < 0 ? shifted + 1 : shifted;
  }
}
