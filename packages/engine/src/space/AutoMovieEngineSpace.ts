import type {
  AutoMovieRingPlacement,
  IAutoMovieFootprint,
  IAutoMovieFootprintInteriorPoint,
  IAutoMovieFootprintRing,
  IAutoMovieSurface,
  IAutoMovieVector3,
} from "@automovie/interface";

import { footprintArea as _footprintArea } from "./internal/footprintArea";
import { footprintContains as _footprintContains } from "./internal/footprintContains";
import { footprintConvexPieces as _footprintConvexPieces } from "./internal/footprintConvexPieces";
import { footprintInteriorPoint as _footprintInteriorPoint } from "./internal/footprintInteriorPoint";
import { footprintRing as _footprintRing } from "./internal/footprintRing";
import { footprintRingPlacement as _footprintRingPlacement } from "./internal/footprintRingPlacement";
import { surfaceFootprint as _surfaceFootprint } from "./internal/surfaceFootprint";

/** Canonical operations over authored space footprints. */
export namespace AutoMovieEngineSpace {
  /** Plan area in square metres, with hole areas subtracted. */
  export function footprintArea(footprint: IAutoMovieFootprint): number {
    return _footprintArea(footprint);
  }
  /** Test whether an XZ point lies on the closed footprint surface. */
  export function footprintContains(
    footprint: IAutoMovieFootprint,
    x: number,
    z: number,
  ): boolean {
    return _footprintContains(footprint, x, z);
  }
  /** Decompose a footprint into the existing ordered convex pieces. */
  export function footprintConvexPieces(
    footprint: IAutoMovieFootprint,
  ): IAutoMovieVector3[][] {
    return _footprintConvexPieces(footprint);
  }
  /** Choose an anchor from the widest convex piece. */
  export function footprintInteriorPoint(
    footprint: IAutoMovieFootprint,
  ): IAutoMovieFootprintInteriorPoint.IResult {
    return _footprintInteriorPoint(footprint);
  }
  /** Prepare a borrowed world ring and its owned XZ projection. */
  export function footprintRing(
    points: readonly IAutoMovieVector3[],
  ): IAutoMovieFootprintRing {
    return _footprintRing(points);
  }
  /** Classify an XZ query against a ring, including its rim. */
  export function footprintRingPlacement(
    ring: IAutoMovieFootprintRing,
    x: number,
    z: number,
  ): AutoMovieRingPlacement {
    return _footprintRingPlacement(ring, x, z);
  }
  /** Project a surface's outer ring and holes into a footprint record. */
  export function surfaceFootprint(
    surface: IAutoMovieSurface,
  ): IAutoMovieFootprint {
    return _surfaceFootprint(surface);
  }
}
