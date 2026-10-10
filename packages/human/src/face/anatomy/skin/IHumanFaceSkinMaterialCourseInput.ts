import type { IHumanFaceSkinHost } from "./IHumanFaceSkinHost";
import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IHumanFaceSkinMaterialGuidePoint } from "./IHumanFaceSkinMaterialGuidePoint";

/**
 * Registered source-reference geometry, current host and native relief guide.
 * Every station names its native vertex; optional reference-metre offsets are
 * registered through the same shape-only native reference. Material identity stays fixed
 * while the current host supplies physical lengths, positions and normals.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinMaterialCourseInput {
  /** Native source reference and its producer-registered material disks. */
  surface: IAutoMovieHumanFaceBasisSurface;

  /** Shape-only reference geometry used once to register finite dimensioned guides. */
  referencePositions: readonly number[];

  /** Exact source-registered course domain, independent of current geometry. */
  domain: string;

  /** Current-state position and normal owner. */
  host: IHumanFaceSkinHost;

  /** Ordered anatomical registration vertices, with the seed identity first. */
  supportVertices: readonly number[];

  /** Ordered registered material stations and explicit source-reference offsets. */
  guide: readonly IHumanFaceSkinMaterialGuidePoint[];
}
