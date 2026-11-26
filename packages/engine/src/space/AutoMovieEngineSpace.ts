import { affordanceSupportContacts as affordanceSupportContactsImplementation } from "./internal/affordanceSupportContacts";
import { groundFunction as groundFunctionImplementation } from "./internal/groundFunction";
import { heightAt as heightAtImplementation } from "./internal/heightAt";
import { isWalkable as isWalkableImplementation } from "./internal/isWalkable";
import { prepareSpace as prepareSpaceImplementation } from "./internal/prepareSpace";
import { prepareSurface as prepareSurfaceImplementation } from "./internal/prepareSurface";
import { preparedSurfaceContains as preparedSurfaceContainsImplementation } from "./internal/preparedSurfaceContains";
import { spaceGround as spaceGroundImplementation } from "./internal/spaceGround";
import { supportContactsFor as supportContactsForImplementation } from "./internal/supportContactsFor";
import { surfaceAt as surfaceAtImplementation } from "./internal/surfaceAt";
import { surfaceContains as surfaceContainsImplementation } from "./internal/surfaceContains";
import { surfaceHeightAt as surfaceHeightAtImplementation } from "./internal/surfaceHeightAt";

import { type AutoMovieRingPlacement, type IAutoMovieFootprint, type IAutoMovieFootprintInteriorPoint, type IAutoMovieFootprintRing, type IAutoMovieSurface, type IAutoMovieVector3, type IAutoMovieAffordanceSupportContacts, type IAutoMovieSpace, type IAutoMoviePreparedSpace, type IAutoMoviePreparedSurface, type IAutoMovieHeightSurface } from "@automovie/interface";

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

  /**
   * The world-space support contacts of a `"stack-top"` affordance: its extent
   * corners carried through the affordance frame and the parent's world
   * transform, in exactly the shape {@link detectSupportToppling} and
   * {@link supportContactsFor} consume.
   *
   * A placed crate is stable when its center of mass projects inside these
   * contacts' hull and topples when it overhangs. The object supplies its own
   * authored support face for the same judgment as a floor or table surface.
   *
   * Each extent corner is a point in the affordance frame's XZ plane (`y`
   * ignored, per {@link IAutoMovieAffordance.extent}): it is lifted into the model
   * frame through the affordance `frame`, then into world through `parentWorld`
   * Scale in either transform is ignored by this helper. Non-unit scales
   * therefore do not describe the same contacts as full affine placement.
   *
   * Throws on a non-`stack-top` kind or a missing extent: feeding a handle to the
   * support judgment is a mis-wired pipeline, not a skippable frame
   * ({@link validateModel} rejects such data before it gets here).
   */
  export function affordanceSupportContacts(props: IAutoMovieAffordanceSupportContacts.IProps): IAutoMovieVector3[] {
    return affordanceSupportContactsImplementation(props);
  }

  /** Adapt a scalar ground height or preserve a supplied ground callback. */
  export function groundFunction(ground: number | ((x: number, z: number) => number)): ((x: number, z: number) => number) {
    return groundFunctionImplementation(ground);
  }

  /** Read the topmost walkable surface height, or null over absent or no-go tops. */
  export function heightAt(space: IAutoMovieSpace, x: number, z: number, prepared?: IAutoMoviePreparedSpace): number | null {
    return heightAtImplementation(space, x, z, prepared);
  }

  /** Answer whether the canonical walking-height query returns a height. */
  export function isWalkable(space: IAutoMovieSpace, x: number, z: number, prepared?: IAutoMoviePreparedSpace): boolean {
    return isWalkableImplementation(space, x, z, prepared);
  }

  /** Prepare every authored surface's rings and areas for repeated space queries. */
  export function prepareSpace(space: IAutoMovieSpace): IAutoMoviePreparedSpace {
    return prepareSpaceImplementation(space);
  }

  /** Prepare one borrowed surface and its actual outer-and-hole footprint. */
  export function prepareSurface(surface: IAutoMovieSurface): IAutoMoviePreparedSurface {
    return prepareSurfaceImplementation(surface);
  }

  /** Query membership in an already prepared surface footprint. */
  export function preparedSurfaceContains(prepared: IAutoMoviePreparedSurface, x: number, z: number): boolean {
    return preparedSurfaceContainsImplementation(prepared, x, z);
  }

  /** Prepare a space once and expose its walking height as a ground callback. */
  export function spaceGround(space: IAutoMovieSpace, fallback?: number): ((x: number, z: number) => number) {
    return spaceGroundImplementation(space, fallback);
  }

  /** Project supplied footprint points onto the topmost authored support surface. */
  export function supportContactsFor(space: IAutoMovieSpace, footprint: readonly IAutoMovieVector3[]): IAutoMovieVector3[] {
    return supportContactsForImplementation(space, footprint);
  }

  /** Select the topmost surface at an XZ query, including non-walkable surfaces. */
  export function surfaceAt(space: IAutoMovieSpace, x: number, z: number, prepared?: IAutoMoviePreparedSpace): IAutoMovieSurface | null {
    return surfaceAtImplementation(space, x, z, prepared);
  }

  /** Query a surface's actual outer-and-hole footprint in the horizontal plane. */
  export function surfaceContains(surface: IAutoMovieSurface, x: number, z: number): boolean {
    return surfaceContainsImplementation(surface, x, z);
  }

  /**
   * Evaluate the canonical surface height at XZ without checking footprint
   * membership.
   */
  export function surfaceHeightAt(surface: IAutoMovieHeightSurface, x: number, z: number): number {
    return surfaceHeightAtImplementation(surface, x, z);
  }
}
