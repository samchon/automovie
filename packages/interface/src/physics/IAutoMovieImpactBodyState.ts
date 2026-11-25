import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Borrowed collision-advice inputs: finite positive kilograms, finite world
 * metres/second velocity and finite restitution, hardness and penetrability in
 * [0,1]. Material traits drive a deterministic qualitative heuristic.
 */
export interface IAutoMovieImpactBodyState {
  /** Finite strictly positive kilograms, admitted by resolveImpact. */
  mass: number;

  /** Borrowed finite world metres/second vector. */
  velocity: IAutoMovieVector3;

  /** Finite [0,1] fraction of returned normal closing speed. */
  restitution: number;

  /** Finite [0,1] heuristic rigidity trait, with one denoting hard material. */
  hardness: number;

  /**
   * Finite [0,1] heuristic ease-of-piercing trait; no constitutive material law
   * is implied.
   */
  penetrability: number;
}
