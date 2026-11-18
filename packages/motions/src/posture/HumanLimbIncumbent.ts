import type {
  AutoMovieHumanLimb,
  IAutoMovieMotionHumanBody,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

/**
 * The seeds a caller holds for a body's swept limb fits while its reads run
 * (`within`): each limb's branch and swivel chosen for a nearby target, read
 * by the limb fit (`solveHumanLimbFit`) as the bounded sweep's incumbent
 * (`IAutoMovieFitChainToTargetProps.incumbent`), never as a continuation:
 * the answer is the swept fit's whether or not a seed is held.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is held, who reads it, as what, and that the answer does not depend on it.
 * @evidence contracts/development/design.md#principled-representation One body and its per-limb seeds, current only while the caller's reads run.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The scope record, its opener and the limb reader the limb fit consults.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No fit or pose is kept: a scope holds only seeds, which start a search and cannot choose its answer.
 */
export namespace HumanLimbIncumbent {
  /**
   * One body's held seeds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The body the seeds belong to and its limbs' seeds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Made by the display's leaf resolve, read by the limb fit.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Another body's fit does not read it.
   */
  export interface IScope {
    /** The body whose limb fits read the seeds. */
    body: IAutoMovieMotionHumanBody;

    /** Each limb's seed, in the frame its own fit chose it in. */
    seeds: Readonly<Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelSeed | null>>>;
  }

  /**
   * Run reads inside a scope, restoring the scope outside it on return or
   * throw.
   *
   * @param scope The held seeds.
   * @param read The reads.
   * @returns What `read` returns.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the dynamic extent and its restoration.
   * @evidence contracts/development/implementation.md#principled-implementation A dynamic scope: current exactly while `read` runs, nested scopes restoring the outer one.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Set, run, restore.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The outer scope comes back on a throw too.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing is shared but the scope given.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The scope is current only during `read`.
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

  /**
   * The seed held for a body's limb.
   *
   * @param body The body of a fit.
   * @param limb Its limb.
   * @returns The seed, or undefined outside a scope, for another body or where none is held.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the match and the absent result.
   * @evidence contracts/development/implementation.md#principled-implementation Identity of the body, the limb's entry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One comparison and one read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Another body's fit reads none.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(body: IAutoMovieMotionHumanBody, limb: AutoMovieHumanLimb): IAutoMovieSwivelSeed | undefined {
    return current !== undefined && current.body === body ? (current.seeds[limb] ?? undefined) : undefined;
  }
}

/** The scope current while a caller's reads run (`HumanLimbIncumbent.within`). */
let current: HumanLimbIncumbent.IScope | undefined;
