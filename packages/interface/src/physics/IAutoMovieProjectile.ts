import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieProjectileFlight } from "./IAutoMovieProjectileFlight";

/**
 * Borrowed finite world launch state: origin in metres, initial velocity in
 * metres/second and constant acceleration in metres/second squared, with an
 * optional quadratic drag and an optional attitude. Projectile readers evaluate
 * the same flight without mutating it.
 *
 * Without `drag` the flight is the closed-form constant-acceleration law; with
 * it, the flight is the solution of `dv/dt = gravity - (rho Cd A / 2m) |v| v`
 * read from the engine's one fixed-step integrator (`projectileAt`). Without
 * `attitude` a state carries no rotation, so every reader that existed before
 * attitude reads the same record.
 */
export interface IAutoMovieProjectile {
  /** Borrowed finite world launch position in metres. */
  origin: IAutoMovieVector3;

  /** Borrowed finite initial world velocity in metres/second. */
  velocity: IAutoMovieVector3;

  /**
   * Borrowed finite constant world acceleration in metres/second squared; -Y
   * terrestrial gravity is a caller choice.
   */
  gravity: IAutoMovieVector3;

  /**
   * Quadratic air drag on the body; drag-free when absent, and then the closed
   * form is evaluated unchanged.
   */
  drag?: IAutoMovieProjectile.IDrag;

  /** How the body turns in flight; a state carries no rotation when absent. */
  attitude?: IAutoMovieProjectile.Attitude;

  /**
   * The drag flight's reader, built with the projectile when it has drag; a
   * reader that finds none integrates the flight itself.
   */
  flight?: IAutoMovieProjectileFlight;
}

/** Data and callback contracts shared by the Projectile operations. */
export namespace IAutoMovieProjectile {
  /** Quadratic drag, `F = -1/2 rho Cd A |v| v`. */
  export interface IDrag {
    /** The drag coefficient Cd, dimensionless, finite and non-negative. */
    coefficient: number;

    /**
     * The reference area A the coefficient is stated for, m², finite and
     * non-negative.
     */
    area: number;

    /** The body's mass, kg, finite and positive. */
    mass: number;

    /** The fluid's density rho, kg/m³; `AutoMovieEngineAir.DENSITY` when absent. */
    density?: number;
  }

  /**
   * How the body turns in flight:
   *
   * - `velocity`: the body's `+Z` along the flight's velocity, an arrow or a
   *   javelin;
   * - `spin`: turning at a constant rate about an axis of the body from its
   *   launch rotation, a thrown knife or an axe;
   * - `fixed`: its launch rotation kept, a dropped cup.
   */
  export type Attitude =
    | {
        /** Nose along the velocity. */
        kind: "velocity";
      }
    | {
        /** A constant spin. */
        kind: "spin";

        /** The spin axis in the body's own frame; non-zero. */
        axis: IAutoMovieVector3;

        /** Degrees per second about `axis`, right-handed. */
        rate: number;

        /** The body's rotation at launch, body to world; identity when absent. */
        rotation?: IAutoMovieQuaternion;
      }
    | {
        /** The launch rotation kept. */
        kind: "fixed";

        /** The body's rotation at launch, body to world; identity when absent. */
        rotation?: IAutoMovieQuaternion;
      };
}
