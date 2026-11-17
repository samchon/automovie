import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A body the water carries (#3432): the water's forces on every segment
 * (`resolveHydrodynamicForce`) summed over the posed body, the height at
 * which a still body floats, and a glide slowed by drag, integrated at plan
 * time by the engine's integrator.
 *
 * The float is the root height at which the buoyancy of the posed body
 * equals its weight (Archimedes), found by bisection on the root's height:
 * the submerged volume grows monotonically as the body is lowered. The
 * glide is the root's horizontal speed under the summed drag of the body
 * held in its shape, `m dv/dt = -Σ ½ ρ C_d A |v| v`, integrated from its
 * start (`integrateMotionTrajectory`), so it decays as quadratic drag does,
 * `v0 / (1 + k v0 t)` with `k = Σ ½ ρ C_d A / m`.
 *
 * First pass: the strokes do not yet drive the root; a swimmer's speed from
 * its strokes and its roll from its arms are the next pass, on the same
 * forces. The float holds the posture's orientation and moves the root only
 * vertically. These calculations are exported and unit-tested; the swim law
 * and the performance do not yet consume them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation surface: The surface's height, world metres. density: The density, kg/m³; fresh water when absent.
 * @evidence contracts/development/design.md#principled-representation surface: The surface's height, world metres. density: The density, kg/m³; fresh water when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanWater.ts (HumanWater.sum, water); perform/HumanWater.ts (HumanWater.float, water); perform/HumanWater.ts (HumanWater.glide, water); perform/HumanWater.ts (HumanWater.sum, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanWater {
  /**
   * The water's forces on a posed body moving at one velocity. The water a body is in.
   *
   * @evidence contracts/development/common.md#meaningful-documentation surface: The surface's height, world metres. density: The density, kg/m³; fresh water when absent.
   * @evidence contracts/development/design.md#principled-representation surface: The surface's height, world metres. density: The density, kg/m³; fresh water when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanWater.ts (HumanWater.sum, water); perform/HumanWater.ts (HumanWater.float, water); perform/HumanWater.ts (HumanWater.glide, water).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanWater.sum.
   */
  export interface IWater {
    /** The surface's height, world metres. */
    surface: number;

    /** The density, kg/m³; fresh water when absent. */
    density?: number;
  }

  /**
   * The water's summed forces on a posed body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation buoyancy: Buoyancy, world newtons. drag: Drag, world newtons. submerged: The submerged volume, m³.
   * @evidence contracts/development/design.md#principled-representation buoyancy: Buoyancy, world newtons. drag: Drag, world newtons. submerged: The submerged volume, m³.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanWater.ts (HumanWater.sum, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ISum {
    /** Buoyancy, world newtons. */
    buoyancy: IAutoMovieVector3;

    /** Drag, world newtons. */
    drag: IAutoMovieVector3;

    /** The submerged volume, m³. */
    submerged: number;

    /** The body's whole volume, m³. */
    volume: number;
  }
}
