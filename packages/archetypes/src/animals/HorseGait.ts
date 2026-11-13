import { ArchetypeRefusal } from "../core";
import type { createHorse } from "./createHorse";

/**
 * The timing of a horse's gaits: how long a stride lasts and how much of it each hoof is on the ground at a speed, and when in the stride each hoof lands.
 *
 * Every number is from Robilliard, Pfau and Wilson 2007, Gait characterisation and classification in horses, J Exp Biol 210:187 (https://journals.biologists.com/jeb/article/210/2/187/17107/Gait-characterisation-and-classification-in-horses): stride time and left-fore stance time by speed (Tables 2 and 3), the order of footfalls (Table 1) and the fore and hind phase ratios (Table 4). Its eight horses were Icelandic, about 1.4 m at the withers; warmbloods of 1.6 m stride about 15 % slower at the same speed (Back, Schamhardt and Barneveld 1996, Vet Q 18:79: 1.09 s at a 1.6 m/s walk, 0.67 s at a 4.0 m/s trot). For a horse of another height the rows are scaled by dynamic similarity (`scale`): read at the speed of equal Froude number and multiplied by the square root of the height ratio. The scaled timing is provisional; it closes about half of the gap to those warmblood figures.
 *
 * A stride starts when the left fore hoof lands. A hoof is named by its limb, `createHorse.Limb`, and its phase is the fraction of the stride at which it lands; the canter and the gallop are given on the left lead, the left fore landing last before the suspension, and the right lead is their mirror image.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the source of every number, the population it measured, the known gap to a larger horse and the stride's zero.
 * @evidence contracts/development/design.md#principled-representation Measured rows by gait and speed, read by interpolation, and one landing phase per hoof per gait: the two things a gait is, in the paper's own variables.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `rideHorse` reads to pose the limbs and name the footfalls, and what a riding act reads to lock a rising trot to a diagonal (#3352).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No fitted curve stands in for the rows; a speed outside a gait's measured range is refused.
 */
export namespace HorseGait {
  /**
   * The gaits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation The four gaits the source measured, as a closed union.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; a parameter of `rideHorse` and the key of every table.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Closed literals, not free text.
   */
  export type Gait = "walk" | "trot" | "canter" | "gallop";

  /** Every gait, for a caller that reads one at run time. */
  export const GAITS: readonly Gait[] = ["walk", "trot", "canter", "gallop"];

  /**
   * One measured row: a speed with the stride's mean time, its standard deviation and the left fore hoof's stance time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation One measured row: speed in metres per second, mean stride time and its standard deviation in seconds, and the left fore's stance time in seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; the element of `ROWS`, read by `timing`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None; the members are the paper's own variables.
   */
  export interface IRow {
    /** Speed, metres per second. */
    speed: number;

    /** Mean stride time, seconds. */
    stride: number;

    /** Standard deviation of the stride time, seconds; zero for a row of one stride. */
    deviation: number;

    /** Mean stance time of the left fore hoof, seconds. */
    stance: number;
  }

  /** The measured rows by gait, in order of speed (Robilliard et al. 2007, Tables 2 and 3; the canter and gallop rows are the left and right lead rows the paper could be read at). */
  export const ROWS: Readonly<Record<Gait, readonly IRow[]>> = {
    walk: [
      { speed: 1.0, stride: 1.121, deviation: 0.12, stance: 0.733 },
      { speed: 1.5, stride: 0.904, deviation: 0.079, stance: 0.54 },
      { speed: 2.0, stride: 0.887, deviation: 0.077, stance: 0.526 },
      { speed: 2.5, stride: 0.714, deviation: 0.113, stance: 0.384 },
      { speed: 3.0, stride: 0.654, deviation: 0.106, stance: 0.307 },
    ],
    trot: [
      { speed: 2.0, stride: 0.649, deviation: 0.046, stance: 0.302 },
      { speed: 2.5, stride: 0.651, deviation: 0.043, stance: 0.328 },
      { speed: 3.0, stride: 0.637, deviation: 0.057, stance: 0.327 },
      { speed: 3.5, stride: 0.6, deviation: 0.039, stance: 0.259 },
      { speed: 4.0, stride: 0.569, deviation: 0.036, stance: 0.223 },
      { speed: 4.5, stride: 0.542, deviation: 0.036, stance: 0.206 },
      { speed: 5.0, stride: 0.511, deviation: 0.036, stance: 0.2 },
      { speed: 5.5, stride: 0.516, deviation: 0.039, stance: 0.18 },
      { speed: 6.0, stride: 0.5, deviation: 0.028, stance: 0.173 },
      { speed: 6.5, stride: 0.482, deviation: 0.013, stance: 0.158 },
    ],
    canter: [
      { speed: 4.0, stride: 0.454, deviation: 0, stance: 0.167 },
      { speed: 5.0, stride: 0.496, deviation: 0.024, stance: 0.172 },
      { speed: 8.0, stride: 0.431, deviation: 0.008, stance: 0.132 },
      { speed: 8.5, stride: 0.417, deviation: 0.021, stance: 0.127 },
    ],
    gallop: [
      { speed: 5.0, stride: 0.472, deviation: 0.021, stance: 0.176 },
      { speed: 8.0, stride: 0.393, deviation: 0.012, stance: 0.136 },
    ],
  };

  /**
   * When each hoof lands, as a fraction of the stride from the left fore's landing.
   *
   * The walk is the lateral sequence left hind, left fore, right hind, right fore with the pairs half a stride apart (Table 4: fore and hind ratios 0.50); the quarter-stride lag from a hind hoof to the fore hoof of its side is the even four-beat walk's, which the paper does not give as a number. The trot lands diagonal pairs together. The left canter lands right hind, then right fore with left hind, then left fore (fore ratio 0.73, hind ratio 0.32). The left transverse gallop lands right hind, left hind, right fore, left fore (fore ratio 0.78, hind ratio 0.29); the lag from the hind pair to the fore pair is not in the paper, and is set so the right hind lands 0.05 of a stride after the left fore lifts off at the gallop's longest measured duty factor of 0.37, the suspension that makes the gait a gallop: an estimate.
   */
  export const PHASES: Readonly<
    Record<Gait, Readonly<Record<createHorse.Limb, number>>>
  > = {
    walk: { leftFore: 0, rightFore: 0.5, leftHind: 0.75, rightHind: 0.25 },
    trot: { leftFore: 0, rightFore: 0.5, leftHind: 0.5, rightHind: 0 },
    canter: { leftFore: 0, rightFore: 0.73, leftHind: 0.73, rightHind: 0.41 },
    gallop: { leftFore: 0, rightFore: 0.78, leftHind: 0.71, rightHind: 0.42 },
  };

  /**
   * The timing of a gait at a speed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation A gait's timing at a speed: stride time and its deviation in seconds, and the duty factor, a fraction between 0 and 1.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; returned by `timing` and read by `rideHorse`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITiming {
    /** Stride time, seconds. */
    stride: number;

    /** Standard deviation of the stride time at that speed, seconds. */
    deviation: number;

    /** Duty factor: the fraction of the stride a hoof is on the ground. */
    duty: number;
  }

  /** The height at the withers of the horses the rows were measured on, metres: Icelandic horses, 1.38 m (range 1.30 to 1.43) in Jensen et al. 2019, Acta Vet Scand 61, Table 2 (https://www.ebi.ac.uk/europepmc/webservices/rest/PMC6933663/fullTextXML). Robilliard et al. do not report their own horses' height, so this is another sample of the breed: provisional. */
  export const REFERENCE: number = 1.38;

  /**
   * The factor by which a horse's stride times and speeds differ from the measured horses' at the same gait: the square root of its height at the withers over theirs.
   *
   * Animals of one build move in a dynamically similar way at equal Froude number, the speed squared over gravity times leg length (Alexander and Jayes 1983, J Zool 201:135; Alexander 1984, Int J Robotics Res 3:49): their stride lengths are then the same multiple of leg length, so at speeds in the ratio of the square roots of their leg lengths their stride times are in that ratio too. Height at the withers stands for leg length, the two being proportional across horses of one build. Neither paper was read at its source, and the rule under-corrects against measured warmbloods (it gives 0.99 s for a 1.6 m/s walk and 0.63 s for a 4.0 m/s trot at 1.615 m, against the 1.09 s and 0.67 s of Back, Schamhardt and Barneveld 1996, Vet Q 18:79): provisional.
   *
   * @param withers The horse's height at the withers, metres.
   * @returns The factor; 1 at the measured horses' height.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the similarity rule, its sources, what stands for leg length and how far it falls short of a measured case.
   * @evidence contracts/development/implementation.md#principled-implementation Dynamic similarity at equal Froude number, the rule the human gaits of this repository scale by.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One square root.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No factor is fitted to the warmblood figures; the shortfall is stated instead.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function scale(withers: number): number {
    return Math.sqrt(withers / REFERENCE);
  }

  /**
   * The range of speeds of a gait for a horse of a height: the measured rows' range at the dynamically similar speeds.
   *
   * @param gait The gait.
   * @param withers The horse's height at the withers, metres; the measured horses' when absent.
   * @returns The least and greatest speed, metres per second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the range is and how height enters.
   * @evidence contracts/development/implementation.md#principled-implementation The first and last measured rows' speeds times `scale`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two lookups and one factor.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `scale`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function range(
    gait: Gait,
    withers: number = REFERENCE,
  ): { minimum: number; maximum: number } {
    const rows: readonly IRow[] = ROWS[gait];
    const by: number = scale(withers);
    return {
      minimum: rows[0]!.speed * by,
      maximum: rows[rows.length - 1]!.speed * by,
    };
  }

  /**
   * The timing of a gait at a speed, for a horse of a height.
   *
   * @param gait The gait.
   * @param speed The speed, metres per second, inside the gait's range for that height.
   * @param tempo How far this horse's stride time lies from the mean, in standard deviations, from -1 to 1; the mean when absent.
   * @param withers The horse's height at the withers, metres; the measured horses' when absent, which gives the rows as measured.
   * @returns The stride time, its standard deviation and the duty factor. For a height other than the measured horses' the times are scaled by dynamic similarity and are provisional, as `scale` states.
   * @throws {ArchetypeRefusal} When the speed lies outside the gait's range for that height, giving the range, the tempo lies outside -1 to 1, or the height is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs' units and ranges, what height does, that scaled values are provisional and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The rows are read at the dynamically similar speed, the speed over `scale`, by linear interpolation between the two rows that bracket it; the stride time and its deviation are then multiplied by `scale`, and the duty factor, a ratio of two times, is unchanged.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the height, the tempo and the speed, scale the speed, find the bracket, interpolate three numbers, scale the times.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is extrapolated beyond the rows.
   * @evidence contracts/development/implementation.md#efficient-algorithms A scan of at most ten rows.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `scale` and `range`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function timing(
    gait: Gait,
    speed: number,
    tempo: number = 0,
    withers: number = REFERENCE,
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
        archetype: "horse",
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
    const rows: readonly IRow[] = ROWS[gait];
    const by: number = scale(withers);
    const { minimum, maximum }: { minimum: number; maximum: number } = range(
      gait,
      withers,
    );
    if (!(speed >= minimum && speed <= maximum))
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: "horse",
        axis: "speed",
        value: speed,
        feasible: { kind: "range", minimum, maximum, unit: "m/s" },
        reason: `a horse of ${withers} m has no measured ${gait} at ${speed} m/s`,
        fix: "choose a speed inside the gait's range, or another gait",
      });

    // The measured horses' speed at the same Froude number, held inside the rows against rounding at the ends.
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
}
