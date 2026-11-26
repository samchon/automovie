import type {
  IAutoMovieAssertWorldPlacements,
  IAutoMovieGroundQueryPoint,
  IAutoMovieWorldBlock,
  IAutoMovieWorldHeightfield,
  IAutoMovieWorldRamp,
  IAutoMovieWorldSurface,
  IAutoMovieWorldTerrain,
} from "@automovie/interface";

import { bakeHeightfield } from "./internal/bakeHeightfield";
import { buildBlock } from "./internal/buildBlock";
import { buildRamp } from "./internal/buildRamp";
import { buildTerrain } from "./internal/buildTerrain";
import { checkPlacements } from "./internal/checkPlacements";
import { readGroundHeight } from "./internal/readGroundHeight";
import { readSurfaceHeight } from "./internal/readSurfaceHeight";
import { selectGroundSurface } from "./internal/selectGroundSurface";

/** Construct, query, and check authored world geometry in metres with Y up. */
export namespace AutoMovieEngineWorld {
  /**
   * Build an unrotated block with a model group, placed node, and exact bounds.
   * The base is the bottom centre. Construction throws for an invalid sRGB
   * colour or dimensions that do not give representable bounds at that base.
   */
  export function block(
    input: IAutoMovieWorldBlock.IInput,
  ): IAutoMovieWorldBlock {
    return buildBlock(input);
  }

  /**
   * Bake a world-height callback into a rectangular, row-major lattice. The
   * callback runs once per point in increasing Z row and X column order.
   * Invalid lattice dimensions, coordinates, or sampled heights throw.
   */
  export function heightfield(
    input: IAutoMovieWorldHeightfield.IInput,
  ): IAutoMovieWorldSurface {
    return bakeHeightfield(input);
  }

  /**
   * Build a rectangular planar ramp with the given centreline, width, and rise.
   * The two ends lie at the base height and base height plus rise. A collapsed
   * width, invalid centreline, or unrepresentable plane throws.
   */
  export function ramp(
    input: IAutoMovieWorldRamp.IInput,
  ): IAutoMovieWorldSurface {
    return buildRamp(input);
  }

  /** Build a flat surface at the supplied height, cloning its XZ footprint. */
  export function terrain(
    input: IAutoMovieWorldTerrain.IInput,
  ): IAutoMovieWorldSurface {
    return buildTerrain(input);
  }

  /**
   * Check block overlap, base support, route clearance, and landmark access.
   * Box faces may touch. Routes are widened by half the formation width in XZ.
   * Throws an error naming the first contradiction in the order above.
   */
  export function assertPlacements(
    input: IAutoMovieAssertWorldPlacements.IInput,
  ): void {
    checkPlacements(input);
  }

  /**
   * Return the first declared surface whose footprint contains the XZ point.
   * Footprint edges count as inside. Return null when no surface contains it.
   */
  export function groundSurface(
    surfaces: readonly IAutoMovieWorldSurface[],
    point: IAutoMovieGroundQueryPoint,
  ): IAutoMovieWorldSurface | null {
    return selectGroundSurface(surfaces, point);
  }

  /**
   * Read world Y at the XZ point from the first containing surface. Return null
   * when no surface contains the point.
   */
  export function groundHeight(
    surfaces: readonly IAutoMovieWorldSurface[],
    point: IAutoMovieGroundQueryPoint,
  ): number | null {
    return readGroundHeight(surfaces, point);
  }

  /**
   * Evaluate one surface's height rule independently of its footprint.
   * Heightfield reads interpolate between samples and clamp beyond the
   * lattice.
   */
  export function surfaceHeight(
    surface: IAutoMovieWorldSurface,
    point: IAutoMovieGroundQueryPoint,
  ): number {
    return readSurfaceHeight(surface, point);
  }
}
