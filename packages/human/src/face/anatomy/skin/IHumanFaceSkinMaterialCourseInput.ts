import type { IHumanFaceSkinHost } from "./IHumanFaceSkinHost";
import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IHumanFaceSkinMaterialGuidePoint } from "./IHumanFaceSkinMaterialGuidePoint";

/**
 * Registered source-reference geometry, current host and native relief guide.
 * Every station names its native vertex; optional reference-metre offsets are
 * registered through the same shape-only native reference. Material identity stays fixed
 * while the current host supplies physical lengths, positions and normals.
 *
 * @evidence contracts/common.md#principled-implementation Native source registration and shape-only reference admit each guide station once, while the current host supplies physical metric through unchanged material correspondence; missing coverage refuses in the chart owner.
 * @evidence contracts/common.md#clear-and-simple-design The input groups the source disk, reference positions, current host and ordered guide because their identities must agree before course compilation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Domain selects a publisher-registered chart, not a width-dependent nearest patch; support vertices are source identities rather than public sculpt controls.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish reference from current geometry, domain ownership, seed-first support order and optional registered displacement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input interface performs no registration or lifting; createHumanFaceSkinMaterialCourse and its chart own those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no cache; reference and topology changes require a new consuming chart/course.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The input borrows source and guide arrays and acquires no resource; the compiler owns retained copies and callbacks.
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
