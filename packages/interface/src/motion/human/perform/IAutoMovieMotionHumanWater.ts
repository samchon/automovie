import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A water environment for human buoyancy and drag queries: surface height in world metres and optional density in kilograms per cubic metre. HumanWater uses fresh-water density when omitted.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A water environment for human buoyancy and drag queries: surface height in world metres and optional density in kilograms per cubic metre. HumanWater uses fresh-water density when omitted.
 * @evidence contracts/development/design.md#principled-representation surface: The surface's height, world metres. density: The density, kg/m³; fresh water when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanWater.sum, float, glide and stroke share this environmental surface and density input.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The environment supplies no force values or movement defaults. HumanWater evaluates forces using the world height and density.
 */
export interface IAutoMovieMotionHumanWater {
  /** The surface's height, world metres. */
  surface: number;

  /** The density, kg/m³; fresh water when absent. */
  density?: number;

  /** The blade area of a fin worn on each foot, square metres: a plate along the sole that the water drags on across its face. No fins when absent. */
  fins?: number;
}

/** Operation-local contracts supporting IAutoMovieMotionHumanWater. */
export namespace IAutoMovieMotionHumanWater {
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
