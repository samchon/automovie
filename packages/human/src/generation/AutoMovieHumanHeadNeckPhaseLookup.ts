/** Exact nearest source-ring phase lookup; sorting changes only search cost. */
export namespace AutoMovieHumanHeadNeckPhaseLookup {
  /** Original source-ring point in the body frame. */
  export type IPoint = readonly [number, number, number];

  /** Nearest original vertex and the number of exact angular comparisons. */
  export interface IReading {
    /** Original array index, preserving the earlier vertex on an exact tie. */
    index: number;
    /** Exact wrapped-angle comparisons, excluding binary broad-phase steps. */
    comparisons: number;
  }

  /** Sorted immutable-ring lookup; a changed source ring needs a new lookup. */
  export interface IPrepared {
    /** Read the original vertex using the original atan2(sin,cos) distance. */
    nearest(theta: number): IReading;
  }

  /** Original phase plus a periodic copy used only by the sorted broad phase. */
  interface IPhase {
    /** Original atan2 angle translated by an integral full turn. */
    phase: number;
    /** Original source vertex index. */
    index: number;
  }

  /** Compile original angles once, retaining every coincident source vertex. */
  export function prepare(points: readonly IPoint[], origin: number): IPrepared {
    if (points.length === 0 || !Number.isFinite(origin) || points.some((p: IPoint): boolean => !p.every(Number.isFinite)))
      throw new Error("A physical neck phase lookup requires a finite source ring.");
    const two: number = 2 * Math.PI;
    const phases: number[] = points.map((p: IPoint): number => Math.atan2(p[2], p[0] - origin));
    const sorted: IPhase[] = [-1, 0, 1].flatMap((turn: number) => phases.map((phase: number, index: number) => ({ phase: phase + turn * two, index }))).sort((a, b): number => a.phase - b.phase || a.index - b.index);
    const lower = (phase: number): number => {
      let lo: number = 0;
      let hi: number = sorted.length;
      while (lo < hi) { const mid: number = (lo + hi) >>> 1; if (sorted[mid]!.phase < phase) lo = mid + 1; else hi = mid; }
      return lo;
    };
    return { nearest: (theta: number): IReading => {
      if (!Number.isFinite(theta)) throw new Error("A neck ray requires a finite phase.");
      // H supplies [-pi,pi]. Reduce other rotations without changing that path.
      const target: number = theta >= -Math.PI && theta <= Math.PI ? theta : Math.atan2(Math.sin(theta), Math.cos(theta));
      const pivot: number = lower(target);
      let best: number = Infinity;
      let selected: number = points.length;
      let comparisons: number = 0;
      const inspect = (index: number): void => {
        const a: number = phases[index]! - theta;
        const distance: number = Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
        comparisons++;
        if (distance < best || distance === best && index < selected) { best = distance; selected = index; }
      };
      inspect(sorted[Math.max(0, Math.min(sorted.length - 1, pivot))]!.index);
      inspect(sorted[Math.max(0, pivot - 1)]!.index);
      // This expands only the broad phase. Every admitted vertex still uses
      // the unchanged angular metric; no skin coordinate or tolerance moves.
      // The allowance covers roundoff in phase subtraction and one +/-2pi
      // unwrap, with sixteen ulps for each of the four elementary operations.
      const guard: number = 64 * Number.EPSILON * (1 + two + Math.abs(target));
      const from: number = lower(target - best - guard);
      const to: number = lower(target + best + guard);
      const seen: Set<number> = new Set();
      for (let i: number = from; i < to; i++) {
        const index: number = sorted[i]!.index;
        if (!seen.has(index)) { seen.add(index); inspect(index); }
      }
      return { index: selected, comparisons };
    } };
  }
}
