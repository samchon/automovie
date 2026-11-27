import type {
  AutoMovieHumanLimb,
  IAutoMovieMotionHumanBody,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

/*
 * The seed held for a body's limb.
 * Parameter body: The body of a fit.
 * Parameter limb: Its limb.
 * Returns: The seed, or undefined outside a scope, for another body or where
 * none is held.
 */
export function HumanLimbIncumbent(
  body: IAutoMovieMotionHumanBody,
  limb: AutoMovieHumanLimb,
): IAutoMovieSwivelSeed | undefined {
  return current !== undefined && current.body === body
    ? (current.seeds[limb] ?? undefined)
    : undefined;
}

/*
 * The seeds a caller holds for a body's swept limb fits while its reads run
 * (`within`): each limb's branch and swivel chosen for a nearby target, read by
 * the limb fit (`solveHumanLimbFit`) as the bounded sweep's incumbent
 * (`IAutoMovieFitChainToTargetProps.incumbent`), never as a continuation: the
 * answer is the swept fit's whether or not a seed is held.
 */
export namespace HumanLimbIncumbent {
  /*
   * One body's held seeds.
   */
  export interface IScope {
    /*
     * The body whose limb fits read the seeds.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * Each limb's seed, in the frame its own fit chose it in.
     */
    seeds: Readonly<
      Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelSeed | null>>
    >;
  }

  /*
   * Run reads inside a scope, restoring the scope outside it on return or
   * throw.
   * Parameter scope: The held seeds.
   * Parameter read: The reads.
   * Returns: What `read` returns.
   */
  export function within<T>(scope: IScope, read: () => T): T {
    const outer: IScope | undefined = current;
    current = scope;
    try {
      return read();
    } finally {
      current = outer;
    }
  }
}

/*
 * The scope current while a caller's reads run (`HumanLimbIncumbent.within`).
 */
let current: HumanLimbIncumbent.IScope | undefined;
