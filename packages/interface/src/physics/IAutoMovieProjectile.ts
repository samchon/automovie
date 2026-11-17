import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Borrowed finite world launch state: origin in metres, initial velocity in metres/second and constant acceleration in metres/second squared, with an optional quadratic drag and an optional attitude. Projectile readers evaluate the same flight without mutating it.
 *
 * Without `drag` the flight is the closed-form constant-acceleration law; with it, the flight is the solution of `dv/dt = gravity - (rho Cd A / 2m) |v| v` read from the engine's one fixed-step integrator (`projectileAt`). Without `attitude` a state carries no rotation, so every reader that existed before attitude reads the same record.
 *
 * @evidence contracts/development/design.md#principled-representation The three vectors supply p(t)=origin+velocity*t+gravity*t*t/2 when no drag is given; the drag record is the quadratic drag law's four quantities and the attitude a closed union of how a body turns in flight.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One launch-state record is sufficient for sampling; it stores no per-frame trajectory, and the integrated flight is the reader's memo, keyed by this record.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Acceleration is constant and may be arbitrary finite direction, not necessarily -Y gravity; homing and collision response stay outside this representation (`projectileContinue` starts a new flight after a contact).
 * @evidence contracts/development/common.md#meaningful-documentation Members state world units, finite-vector premise, constant acceleration and what drag and attitude change.
 */
export interface IAutoMovieProjectile {
  /** Borrowed finite world launch position in metres. */
  origin: IAutoMovieVector3;

  /** Borrowed finite initial world velocity in metres/second. */
  velocity: IAutoMovieVector3;

  /** Borrowed finite constant world acceleration in metres/second squared; -Y terrestrial gravity is a caller choice. */
  gravity: IAutoMovieVector3;

  /** Quadratic air drag on the body; drag-free when absent, and then the closed form is evaluated unchanged. */
  drag?: IAutoMovieProjectile.IDrag;

  /** How the body turns in flight; a state carries no rotation when absent. */
  attitude?: IAutoMovieProjectile.Attitude;
}

/** Data and callback contracts shared by the Projectile operations. */
export namespace IAutoMovieProjectile {
  /**
     * Quadratic drag, `F = -1/2 rho Cd A |v| v`.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Members give the drag law's quantities, SI units, numeric premises and density default.
     * @evidence contracts/development/design.md#principled-representation Cd, reference area, mass and fluid density determine the quadratic force; finite non-negative coefficients and area, positive mass and valid density remain numeric runtime premises.
     * @evidence contracts/development/design.md#minimal-and-owned-surface The four quantities projectileAt consumes, with the shared air density used when absent.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Every coefficient belongs to the caller's body and fluid; the record names no projectile or fixture.
     */
    export interface IDrag {
      /** The drag coefficient Cd, dimensionless, finite and non-negative. */
      coefficient: number;
  
      /** The reference area A the coefficient is stated for, m², finite and non-negative. */
      area: number;
  
      /** The body's mass, kg, finite and positive. */
      mass: number;
  
      /** The fluid's density rho, kg/m³; `AutoMovieAir.DENSITY` when absent. */
      density?: number;
    }

  /**
     * How the body turns in flight:
     *
     * - `velocity`: the body's `+Z` along the flight's velocity, an arrow or a javelin;
     * - `spin`: turning at a constant rate about an axis of the body from its launch rotation, a thrown knife or an axe;
     * - `fixed`: its launch rotation kept, a dropped cup.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the three attitudes, body-axis convention, angular-rate unit, launch frame and identity defaults.
     * @evidence contracts/development/design.md#principled-representation A discriminated union separates velocity alignment, body-axis constant spin and fixed launch orientation; finite rates, non-zero axes and unit quaternions remain numeric premises.
     * @evidence contracts/development/design.md#minimal-and-owned-surface projectileAt reads these three supported rotation laws from the shared flight record.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Variant-specific axis and rate fields cannot be attached to a fixed or velocity attitude; no independent trajectory is stored.
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
