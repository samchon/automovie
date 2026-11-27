import type {
  IAutoMovieMesh,
  IAutoMoviePlanarRegion,
  IAutoMoviePlanarRegionExtrusion,
  IAutoMovieRegionTriangulation,
} from "@automovie/interface";

import { buildRegionFace } from "./planar-region/internal/buildRegionFace";
import { extrudeRegion } from "./planar-region/internal/extrudeRegion";
import { regionFailure } from "./planar-region/internal/regionFailure";
import { triangulateRegion } from "./planar-region/internal/triangulateRegion";

/** Admit, triangulate and build geometry for a planar region with voids. */
export namespace AutoMovieEnginePlanarRegion {
  /**
   * Return the first region diagnostic when rings lack a usable interior. The
   * outer contour is checked first, followed by each hole, all pairs of
   * contours, then hole containment. Relations use an absolute 1e-12 m or
   * square-metre tolerance as appropriate. The input stays unchanged.
   *
   * @param region Borrowed XY metre contours in either winding.
   * @param label Region name in diagnostics, which defaults to `polygon`.
   * @returns The first ring or containment diagnostic, or null if admitted.
   */
  export function failure(
    region: IAutoMoviePlanarRegion,
    label: string = "polygon",
  ): string | null {
    return regionFailure(region, label);
  }

  /**
   * Triangulate a simple, possibly concave outer contour and its holes. The
   * copied outer ring is wound counter-clockwise and holes clockwise.
   * Counter-clockwise output triangles face +Z. The original outer-then-hole
   * point identities survive winding changes in `sourceIndices`.
   *
   * @param region Borrowed XY metre contours. Omitted holes mean none.
   * @param label Region name in diagnostics, which defaults to `polygon`.
   * @returns The copied canonical contours and their triangle indices.
   * @throws Error with the first admission diagnostic or when no numerical hole
   *   bridge or ear can be found.
   */
  export function triangulate(
    region: IAutoMoviePlanarRegion,
    label: string = "polygon",
  ): IAutoMovieRegionTriangulation {
    return triangulateRegion(region.outer, region.holes ?? [], label);
  }

  /**
   * Build one open face with holes at local Z = 0. Each triangle and normal
   * faces +Z and the texture coordinates use the authored XY metres.
   *
   * @param region The visible region and optional cutouts in XY metres.
   * @returns A single-sided mesh with new buffers and no skin.
   * @throws Error when the region cannot be triangulated.
   */
  export function buildFace(region: IAutoMoviePlanarRegion): IAutoMovieMesh {
    return buildRegionFace(region);
  }

  /**
   * Extrude a region and its holes into a closed prism whose volume is the
   * region area times the depth. Each side has a flat normal. Cap texture
   * coordinates use XY metres with V mirrored on the bottom cap. Side
   * coordinates use ring arc length and local Z in metres.
   *
   * @param input Region contours and positive depth in metres. The caps lie at
   *   local Z = ±depth/2.
   * @returns A closed mesh with new buffers and no skin.
   * @throws Error for an invalid depth or a region that cannot be triangulated.
   */
  export function extrude(
    input: IAutoMoviePlanarRegionExtrusion,
  ): IAutoMovieMesh {
    return extrudeRegion(input);
  }
}
