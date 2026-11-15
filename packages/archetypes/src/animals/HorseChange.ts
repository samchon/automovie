import { ArchetypeCourse } from "../core";
import { HorseGait } from "./HorseGait";
import { createHorse } from "./createHorse";

/**
 * Where a horse changes gait with its speed: the walk-to-trot change from the measured Froude number at its leg's length, the trot-to-canter change from the measured trot-gallop speed at its mass, the canter-to-gallop change at the middle of the two gaits' measured ranges, and the gap past each that keeps the gait from flickering.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each change point's source and the gap.
 * @evidence contracts/development/design.md#principled-representation A speed in metres per second per pair of neighbouring gaits, worked from the horse's own dimensions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The change points `rideHorse` reads when the speed chooses the gait.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each change point names its source or says it is provisional.
 */
export namespace HorseChange {
  /** The Froude number at which horses change from walk to trot: 0.35, speed squared over gravity times leg length, across nine horses of 90 to 720 kg and legs of 0.7 to 1.4 m changing at 1.6 to 2.3 m/s (Griffin, Kram, Wickler and Hoyt 2004, J Exp Biol 207:4215, abstract, https://journals.biologists.com/jeb/article/207/24/4215/2679/Biomechanical-and-energetic-determinants-of-the). The change point is the square root of this times gravity times the leg's length. The paper's Methods, which name the landmark its leg length was measured to, could not be read (the article page shows the abstract only, the journal's PDF refused the fetch, and searches for a copy found none); the hip joint's height from the ground (`createHorse.rig`) stands for it, a provisional choice consistent with the paper's figures: its 1.4 m for its 720 kg horse against 1.29 m at the hip of the 718 kg, 1.80 m warmblood the bands allow. */
  export const FROUDE: number = 0.35;

  /** The trot-gallop transition speed as it scales with body mass, the canter being the gallop's slow form: `speed` at `mass` times the mass ratio to `exponent`. Heglund and Taylor 1988 (J Exp Biol 138:301, https://doi.org/10.1242/jeb.138.1.301), as a summary of the paper reads (https://www.originalwisdom.com/wp-content/uploads/bsk-pdf-manager/2019/10/Heglund-and-Taylor_1988_Speed-and-stride-frequency-and-energy-cost-per-stride-how-do-they-change-with-body-size-and-gait.pdf): "Transition speed rose with body mass to the power 0.216; stride frequency there fell with body mass to the power -0.150." and "A 30 g mouse began to gallop at 0.8 m/s, a 170 kg pony at 5 m/s." The coefficient of the paper's Table 2 is unread (the journal's PDF refused the fetch and the summary gives no table), so the pony's point anchors the power law; the same page notes the paper's horse masses are given inconsistently. `rideHorse`'s spec checks that the speed falls inside the trot's and the canter's measured ranges. */
  export const GALLOP: Readonly<{ speed: number; mass: number; exponent: number }> = {
    speed: 5,
    mass: 170,
    exponent: 0.216,
  };

  /** How far past a change point the speed must go before the gait changes, metres per second at the measured horses' height, scaled with the gait's speeds. A gap is needed at all because a speed at a change point wavers, and without one the gait would flicker between its two gaits every stride. A provisional value: no measured difference between a horse's up and down changes was found (searches for gait transition hysteresis in horses found Griffin et al. 2004's speed steps, upward only; a 2013 quadruped simulation, arXiv 1310.7568, reporting hysteresis without a horse's measure; and Nauwelaerts et al.'s acceleration study, read at its abstract only). Twice the 0.1 m/s a steady speed wavers by in the hysteresis spec. */
  export const HYSTERESIS: number = 0.2;

  /**
   * The speed at which a horse changes between two neighbouring gaits.
   *
   * @param low The slower gait.
   * @param high The faster gait, the next in `HorseGait.GAITS`.
   * @param dimensions The horse's dimensions: its withers height, girth and mass are read.
   * @returns The change point, metres per second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Walk to trot at `FROUDE` on the hip joint's height; trot to canter at `GALLOP` for the horse's mass; canter to gallop at the middle of the two gaits' overlapping measured ranges (Robilliard et al. 2007, scaled to the horse), provisional for want of a measured change.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per pair.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The canter-to-gallop point is a named provisional rule, stated here.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `createHorse.rig` and `HorseGait.range`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function point(
    low: HorseGait.Gait,
    high: HorseGait.Gait,
    dimensions: Readonly<Partial<Record<createHorse.Dimension, number>>>,
  ): number {
    if (low === "walk" && high === "trot")
      return Math.sqrt(
        FROUDE *
          ArchetypeCourse.GRAVITY *
          createHorse.rig(dimensions).limbs.leftHind[0]!.y,
      );
    if (low === "trot" && high === "canter")
      return GALLOP.speed * (dimensions.mass! / GALLOP.mass) ** GALLOP.exponent;
    const a: { minimum: number; maximum: number } = HorseGait.range(
      low,
      dimensions.withersHeight!,
    );
    const b: { minimum: number; maximum: number } = HorseGait.range(
      high,
      dimensions.withersHeight!,
    );
    return (Math.max(a.minimum, b.minimum) + Math.min(a.maximum, b.maximum)) / 2;
  }

  /**
   * The gait a speed calls for, from the gait the horse is in: up past each change point above it by `HYSTERESIS`, down below it by as much.
   *
   * @param speed The speed, metres per second.
   * @param from The gait the horse is in.
   * @param dimensions The horse's dimensions.
   * @returns The gait.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule.
   * @evidence contracts/development/implementation.md#principled-implementation Step up through the gaits while the speed passes the next change point by the gap, then down while it falls short of the one below by the gap; the gap scales with the gait's speeds by `HorseGait.scale`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two loops over the four gaits.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most three steps each way.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `point`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function called(
    speed: number,
    from: HorseGait.Gait,
    dimensions: Readonly<Partial<Record<createHorse.Dimension, number>>>,
  ): HorseGait.Gait {
    const order: readonly HorseGait.Gait[] = HorseGait.GAITS;
    const gap: number = HYSTERESIS * HorseGait.scale(dimensions.withersHeight!);
    let k: number = order.indexOf(from);
    while (
      k < order.length - 1 &&
      speed > point(order[k]!, order[k + 1]!, dimensions) + gap
    )
      k++;
    while (k > 0 && speed < point(order[k - 1]!, order[k]!, dimensions) - gap)
      k--;
    return order[k]!;
  }
}
