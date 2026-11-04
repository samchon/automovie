import { Singleton } from "tstl";

import { AutoMovieHumanTrunkChains } from "../../../src/generation/AutoMovieHumanTrunkChains";
import { AutoMovieHumanTrunkFixed } from "../../../src/generation/AutoMovieHumanTrunkFixed";
import { AutoMovieHumanTrunkQuadrant } from "../../../src/generation/AutoMovieHumanTrunkQuadrant";
import { AutoMovieHumanTrunkSolver } from "../../../src/generation/AutoMovieHumanTrunkSolver";
import type { IAutoMovieHumanTrunkSolution } from "../../../src/generation/IAutoMovieHumanTrunkSolution";
import type { IAutoMovieLoftChain } from "@automovie/engine";
import type { IHumanDebugPerson } from "../../people/IHumanDebugPerson";

/**
 * The trunk and shoulder pieces' shared input: one person's trunk solve from its typed parameters
 * alone.
 *
 * The fixed inputs are `AutoMovieHumanTrunkFixed.of` (the tapes, courses and controls, the stature,
 * the crotch height and the neck chain the body law gives the same person) and the solution is
 * `AutoMovieHumanTrunkSolver.solve` of them. The chains `trunk` and `upper` are
 * `AutoMovieHumanTrunkChains.build` of that solution at the sampling the trunk construction uses:
 * two uniform phases per control of the section and the sagittal phase rule. Each is built once
 * per person and page load and kept by a `Singleton`.
 */
export namespace HumanDebugTrunkKit {
  /** What every trunk and shoulder piece reads. */
  export interface IFixed {
    /** The solve's fixed inputs. */
    fixed: AutoMovieHumanTrunkSolver.IFixed;

    /** The solved trunk. */
    solution: IAutoMovieHumanTrunkSolution;

    /** The chains `trunk` (crotch to axilla vault) and `upper` (vault to the neck's ring). */
    chains: [IAutoMovieLoftChain, IAutoMovieLoftChain];

    /** Milliseconds the solve and the chains took. */
    milliseconds: number;
  }

  /**
   * A person's trunk solve.
   *
   * @param person The person.
   * @returns The fixed inputs, solution and chains, built once per person.
   */
  export function of(person: IHumanDebugPerson): IFixed {
    let found: Singleton<IFixed> | undefined = CACHE.get(person.alias);
    if (found === undefined) {
      found = new Singleton((): IFixed => build(person));
      CACHE.set(person.alias, found);
    }
    return found.get();
  }

  /** Solves by person alias. */
  const CACHE: Map<string, Singleton<IFixed>> = new Map();

  /**
   * Solve a person's trunk and build its chains.
   *
   * @param person The person.
   * @returns The kit.
   */
  function build(person: IHumanDebugPerson): IFixed {
    const started: number = performance.now();
    const fixed: AutoMovieHumanTrunkSolver.IFixed = AutoMovieHumanTrunkFixed.of(person.parameters);
    const solution: IAutoMovieHumanTrunkSolution = AutoMovieHumanTrunkSolver.solve(fixed);
    const chains: [IAutoMovieLoftChain, IAutoMovieLoftChain] = AutoMovieHumanTrunkChains.build(solution, {
      samples: 2 * AutoMovieHumanTrunkQuadrant.ORDER,
      rule: "sagittal",
    });
    return { fixed, solution, chains, milliseconds: Math.round(performance.now() - started) };
  }
}
