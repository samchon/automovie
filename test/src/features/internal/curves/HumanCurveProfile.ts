/**
 * Shape readings of a sampled profile, such as a limb's girth every 2 mm:
 * how far it strays from monotone, where it turns, and where it changes its
 * bending. Each reading has one definition that every profile rule shares
 * (`packages/human/docs/testing/consistency.md`, section 1.2), so a rule's
 * limit means the same thing on every region.
 */
export namespace HumanCurveProfile {
  /** One interior turn of a profile. */
  export interface ITurn {
    /** Sample index of the turn. */
    index: number;

    /** Whether the profile peaks (`max`) or dips (`min`) there. */
    kind: "max" | "min";
  }

  /**
   * Excess variation: the total variation of the values less the absolute
   * difference of their ends. A monotone run reads zero; every reversal of
   * height a adds 2a, so a wobble of amplitude a on a falling span reads 2a
   * per wobble.
   */
  export function excess(values: readonly number[]): number {
    let total: number = 0;
    for (let i: number = 1; i < values.length; i++) total += Math.abs(values[i]! - values[i - 1]!);
    return values.length < 2 ? 0 : total - Math.abs(values[values.length - 1]! - values[0]!);
  }

  /**
   * The interior turns that stand out of the noise: a zigzag with hysteresis
   * floor e. The profile is walked keeping the running extreme of the current
   * run; a run ends, and its extreme becomes a turn, once the profile has come
   * back from it by more than e. So a turn is a maximum or minimum that both
   * the value before it and the value after it fall short of by more than e,
   * and a ripple smaller than e makes none. The ends are never turns.
   */
  export function turns(values: readonly number[], floor: number): ITurn[] {
    const out: ITurn[] = [];
    if (values.length < 3) return out;

    // The first run's direction is set by the first departure beyond the floor.
    const start: number = 0;
    let direction: 0 | 1 | -1 = 0;
    let extreme: number = 0;
    for (let i: number = 1; i < values.length; i++) {
      const v: number = values[i]!;
      if (direction === 0) {
        if (Math.abs(v - values[start]!) > floor) {
          direction = v > values[start]! ? 1 : -1;
          extreme = i;
        }
        continue;
      }

      // Extend the run while it keeps going its way; turn once it comes back by more than the floor.
      if ((direction === 1 && v > values[extreme]!) || (direction === -1 && v < values[extreme]!)) extreme = i;
      else if (Math.abs(values[extreme]! - v) > floor) {
        out.push({ index: extreme, kind: direction === 1 ? "max" : "min" });
        direction = direction === 1 ? -1 : 1;
        extreme = i;
      }
    }
    return out;
  }

  /**
   * Inflections: sign changes of the profile's second derivative over a
   * window, counted only where the curvature on both sides of the change
   * exceeds `8 e / w^2`, the second derivative of a parabola that rises e
   * over a chord w. The derivative is the centred second difference over half
   * the window, so features narrower than the window do not count and a
   * ripple of height e across the window counts once per sign change.
   *
   * @param values Profile samples.
   * @param step Distance between samples, mm.
   * @param window Window w, mm; a tenth of the segment suits a limb.
   * @param floor Noise floor e, in the values' unit.
   */
  export function inflections(values: readonly number[], step: number, window: number, floor: number): number {
    const h: number = Math.max(1, Math.round(window / (2 * step)));
    const limit: number = (8 * floor) / (window * window);
    let last: 0 | 1 | -1 = 0;
    let count: number = 0;
    for (let i: number = h; i + h < values.length; i++) {
      const d2: number = (values[i + h]! - 2 * values[i]! + values[i - h]!) / (h * step) ** 2;
      const sign: 0 | 1 | -1 = d2 > limit ? 1 : d2 < -limit ? -1 : 0;
      if (sign === 0) continue;
      if (last !== 0 && sign !== last) count++;
      last = sign;
    }
    return count;
  }

  /** Index of the largest value in `[from, to]` (indices, inclusive), or -1 when the range is empty. */
  export function argmax(values: readonly number[], from: number, to: number): number {
    let best: number = -1;
    for (let i: number = Math.max(0, from); i <= Math.min(values.length - 1, to); i++) if (best < 0 || values[i]! > values[best]!) best = i;
    return best;
  }

  /** Index of the least value in `[from, to]` (indices, inclusive), or -1 when the range is empty. */
  export function argmin(values: readonly number[], from: number, to: number): number {
    let best: number = -1;
    for (let i: number = Math.max(0, from); i <= Math.min(values.length - 1, to); i++) if (best < 0 || values[i]! < values[best]!) best = i;
    return best;
  }
}
