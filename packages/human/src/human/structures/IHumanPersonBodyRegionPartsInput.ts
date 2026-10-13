import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyUnderwearParts } from "../../body/structures/IAutoMovieHumanBodyUnderwearParts";
import type { IAutoMovieHumanPersonBoundaryStitchProps } from "./IAutoMovieHumanPersonBoundaryStitchProps";
import type { IAutoMovieHumanPersonSeam } from "./IAutoMovieHumanPersonSeam";

/**
 * Legacy Person's source-region placement and clothing scalar transport. The placement callback and stitch inputs are the existing final-skin owners; this unit carries the same source field through their actual stencils.
 *
 * @evidence contracts/common.md#principled-implementation Region source indices and one frozen cut transport garment coverage through the same placement and stitch stencils as skin geometry.
 * @evidence contracts/common.md#clear-and-simple-design The existing placement callback stays authoritative while this stage carries scalar coverage; the stitch context omits only its per-region operands.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional garments preserve the ungarmented path, and strict registered seam insertions still refuse rather than inventing correspondence.
 * @evidence contracts/common.md#meaningful-documentation Documentation states source and render order, absence of garment meaning, neutral cut identities and shared metre-frame stitching.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The input signature specifies placement operands but chooses no region traversal; clipping and body-region construction own its cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A placement callback is supplied for one construction; this interface introduces no request cache or effect sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The input borrows its parts, cut and callback; region construction owns temporary scalar arrays and emitted parts.
 *
 * @author Samchon
 */
export interface IHumanPersonBodyRegionPartsInput {
  /** Completed Body parts before Person placement and Body-name prefixing. */
  parts: IAutoMovieModel["parts"];

  /** Source region ids mapped to native skin ordinals in original render-vertex order. */
  regions: ReadonlyMap<string, readonly number[]>;

  /** Prepared rest coverage and fabric material; omission preserves ungarmented parts. */
  garment?: IAutoMovieHumanBodyUnderwearParts;

  /** Native basis surface index whose field is extended through the frozen neck cut. */
  surface: number;

  /** Neutral source-edge cut; intersections append after its original margin ordinals. */
  cut: NonNullable<IAutoMovieHumanPersonSeam["cut"]>;

  /**
   * Place a clipped mesh using one source identity per resident vertex. The existing owner reads the final joined metre-frame position and normal fields and returns the placed mesh.
   *
   * @evidence contracts/common.md#principled-implementation Resident source identities address the same final joined fields that own skin placement, retaining attribute-chart splits in the input mesh.
   * @evidence contracts/common.md#clear-and-simple-design Supplying the existing placement owner lets coverage transport reuse final-skin placement without duplicating its coordinate logic.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The callback consumes clipped source correspondence rather than locating vertices by a consumer-specific positional heuristic.
   * @evidence contracts/common.md#meaningful-documentation The member identifies resident-vertex source order, final joined fields, metre frame and returned placed mesh.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The placement signature declares no scattering algorithm; the supplied final-skin owner chooses its traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-region callback defines no cache; already evaluated joined fields are supplied by its enclosing placement closure.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The callback declaration acquires no mesh or handle; its caller owns the clipped operand and placed result.
   */
  place: (mesh: IAutoMovieMesh, sources: readonly number[]) => IAutoMovieMesh;

  /** Existing shared metre-frame neck boundary, face normals and physical registration. */
  stitch: Omit<IAutoMovieHumanPersonBoundaryStitchProps, "mesh" | "sources" | "side">;
}
