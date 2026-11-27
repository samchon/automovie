import { swivelArcs } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  IAutoMovieSwivelArcs,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { HumanMinimumJerkSpline } from "../../posture/HumanMinimumJerkSpline";

/**
 * The knots of a swivel course (`courseLimbSwivels.swivels`): the limbs'
 * swivels and branches fitted at its seconds and the seeds a second between two
 * knots takes.
 */
export namespace courseLimbSwivelKnots {
  /** The limbs' swivels and branches at one knot. */
  export interface ISwivelKnot {
    /** The second, from the plan's start. */
    seconds: number;

    /** Each fitted limb's seed. */
    seeds: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>;

    /**
     * The coursed limbs the plan writes a goal for at this second; unknown for
     * the entered knot.
     */
    held?: ReadonlySet<AutoMovieHumanLimb>;

    /**
     * Every other limb's seed the knot's resolve reported (a leg on its goal),
     * which the next knot continues and no second between knots reads; none for
     * the entered knot.
     */
    fits?: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>;
  }

  /**
   * One limb's swivel, and forearm twist where every knot of its run gives one,
   * at a knot of the minimum-jerk path through its run of knots: the unwrapped
   * values and their velocities and accelerations.
   */
  export interface IRate {
    /** The swivel, unwrapped along the run, then the twist where given, degrees. */
    values: readonly number[];

    /** Their velocities, degrees per second. */
    velocities: readonly number[];

    /** Their accelerations, degrees per second squared. */
    accelerations: readonly number[];
  }

  /** Each limb's rate at one knot; absent where the limb has no run there. */
  export type Rates = ReadonlyMap<AutoMovieHumanLimb, IRate>;

  /**
   * Each knot's limb rates on the minimum-jerk path through the knots (Flash
   * and Hogan 1985, J Neurosci 5:1688, `HumanMinimumJerkSpline`): for each
   * limb, every run of consecutive knots that fit it on one branch is one path,
   * a quintic between each two knots whose position, velocity and acceleration
   * (and jerk and snap) carry across each interior knot, at rest at the run's
   * two ends, the model's boundary conditions. The swivel is unwrapped along
   * the run, each step its shortest turn; the forearm's twist is a second
   * coordinate of a run whose every knot gives one. Prepared once over all the
   * knots.
   *
   * @param knots The knots, in order.
   * @param limbs The coursed limbs.
   * @returns Each knot's rates, in the knots' order.
   */
  export function rates(
    knots: readonly ISwivelKnot[],
    limbs: readonly AutoMovieHumanLimb[],
  ): Rates[] {
    const out: Map<AutoMovieHumanLimb, IRate>[] = knots.map(
      (): Map<AutoMovieHumanLimb, IRate> => new Map(),
    );
    for (const limb of limbs) {
      let first: number = 0;
      while (first < knots.length) {
        const start: IAutoMovieSwivelSeed | undefined =
          knots[first]!.seeds.get(limb);
        if (start === undefined) {
          ++first;
          continue;
        }
        // The run: the knots after `first` that fit the limb on its branch.
        let last: number = first;
        while (last + 1 < knots.length) {
          const next: IAutoMovieSwivelSeed | undefined =
            knots[last + 1]!.seeds.get(limb);
          if (next === undefined || next.branch !== start.branch) break;
          ++last;
        }
        const run: readonly ISwivelKnot[] = knots.slice(first, last + 1);
        const twisted: boolean = run.every(
          (k: ISwivelKnot): boolean => k.seeds.get(limb)!.twist !== undefined,
        );
        const values: number[][] = [];
        for (const k of run) {
          const seed: IAutoMovieSwivelSeed = k.seeds.get(limb)!;
          const before: number[] | undefined = values.at(-1);
          const turn: number =
            before === undefined ? 0 : seed.swivel - before[0]!;
          const swivel: number =
            before === undefined
              ? seed.swivel
              : before[0]! + turn - 360 * Math.round(turn / 360);
          values.push(twisted ? [swivel, seed.twist!] : [swivel]);
        }
        const derived: HumanMinimumJerkSpline.IDerivatives =
          HumanMinimumJerkSpline.derivatives(
            run.map((k: ISwivelKnot): number => k.seconds),
            values,
          );
        values.forEach((value: number[], i: number): void => {
          out[first + i]!.set(limb, {
            values: value,
            velocities: derived.velocities[i]!,
            accelerations: derived.accelerations[i]!,
          });
        });
        first = last + 1;
      }
    }
    return out;
  }

  /**
   * The seeds a second between two knots takes: each limb both knots fit on one
   * branch on the minimum-jerk path through its run (`rates`), the quintic
   * Hermite of the two knots' values, velocities and accelerations
   * (`HumanMinimumJerkSpline.quintic`), so the course's value, velocity and
   * acceleration at a knot equal its limits from either side; a limb whose
   * branch changes or whose goal ends inside the interval at the earlier knot's
   * seed; and a limb whose goal begins inside it (the plan writes it none at
   * the earlier knot) at the later knot's, the arm its goal starts from there.
   * At the later knot the fitted seeds are exact, including a limb's absence.
   *
   * @param seconds The second, from the plan's start.
   * @param a The earlier knot.
   * @param b The later knot.
   * @param from The earlier knot's rates.
   * @param to The later knot's rates.
   * @returns Each limb's seed at the second.
   */
  export function between(
    seconds: number,
    a: ISwivelKnot,
    b: ISwivelKnot,
    from: Rates,
    to: Rates,
  ): ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> {
    if (seconds >= b.seconds) return b.seeds;
    const h: number = b.seconds - a.seconds;
    const share: number =
      h > 0 ? Math.min(1, Math.max(0, (seconds - a.seconds) / h)) : 0;
    const out: Map<AutoMovieHumanLimb, IAutoMovieSwivelSeed> = new Map();
    for (const [limb, seed] of a.seeds) {
      const next: IAutoMovieSwivelSeed | undefined = b.seeds.get(limb);
      const p: IRate | undefined = from.get(limb);
      const q: IRate | undefined = to.get(limb);
      if (
        next === undefined ||
        next.branch !== seed.branch ||
        p === undefined ||
        q === undefined
      ) {
        out.set(limb, seed);
        continue;
      }
      const at: number[] = HumanMinimumJerkSpline.quintic(
        p.values,
        q.values,
        p.velocities,
        q.velocities,
        p.accelerations,
        q.accelerations,
        h,
        share,
      );
      // When both proximal intervals contain the interpolated swivel, carry
      // the earlier interval in that swivel's turn.
      const feasible: IAutoMovieSwivelArcs.IArc | null =
        seed.feasible !== undefined &&
        next.feasible !== undefined &&
        swivelArcs.holding([next.feasible], at[0]!) !== null
          ? swivelArcs.holding([seed.feasible], at[0]!)
          : null;
      out.set(limb, {
        swivel: at[0]!,
        branch: seed.branch,
        ...(at.length > 1 ? { twist: at[1]! } : {}),
        ...(feasible === null ? {} : { feasible }),
      });
    }
    // A limb whose goal begins inside the interval takes the later knot's
    // placement.
    for (const [limb, next] of b.seeds)
      if (!out.has(limb) && a.held?.has(limb) === false) out.set(limb, next);
    return out;
  }
}
