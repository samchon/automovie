import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyUnderwearParts } from "../../body/structures/IAutoMovieHumanBodyUnderwearParts";
import type { IAutoMovieHumanPersonBoundaryStitchProps } from "./IAutoMovieHumanPersonBoundaryStitchProps";
import type { IAutoMovieHumanPersonSeam } from "./IAutoMovieHumanPersonSeam";

/**
 * Legacy Person's source-region placement and clothing scalar transport.
 * The placement callback and stitch inputs are the existing final-skin owners;
 * this unit carries the same source field through their actual stencils.
 * @evidence contracts/common.md#principled-implementation Existing placement and stitch records supply the actual operators that transport coverage.
 * @evidence contracts/common.md#clear-and-simple-design Names source parts, region correspondence, cut and existing placement separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No geometric proximity or personal neck exception defines attachment.
 * @evidence contracts/common.md#meaningful-documentation States final-skin and source-field responsibilities.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Existing source parts retain identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels Source document defines controls.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Existing cut/stitch owners emit geometry.
 * @evidence contracts/modeling.md#spatial-conventions Placement and stitch use existing Person-frame metres; stencil weights are dimensionless.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Stitch and partition construct the contours.
 * @evidenceExclude contracts/modeling.md#rendered-observation Final Person owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries source data without anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range Source admission precedes transport.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no shaping input.
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
