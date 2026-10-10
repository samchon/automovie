import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyUnderwearParts } from "../../body/structures/IAutoMovieHumanBodyUnderwearParts";
import type { IAutoMovieHumanPersonBoundaryStitchProps } from "./IAutoMovieHumanPersonBoundaryStitchProps";
import type { IAutoMovieHumanPersonSeam } from "./IAutoMovieHumanPersonSeam";

/**
 * Legacy Person's source-region placement and clothing scalar transport.
 * The placement callback and stitch inputs are the existing final-skin owners;
 * this unit carries the same source field through their actual stencils.
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

  /** Existing placement owner reading the final joined position/normal field. */
  place: (mesh: IAutoMovieMesh, sources: readonly number[]) => IAutoMovieMesh;

  /** Existing shared metre-frame neck boundary, face normals and physical registration. */
  stitch: Omit<IAutoMovieHumanPersonBoundaryStitchProps, "mesh" | "sources" | "side">;
}
