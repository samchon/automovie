import type { IAutoMovieHumanFaceBasisSurface } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasisSurface";

/** Current source geometry and the unchanged interior contact stations.
 * The publisher supplies actual same-generation parent/sample incidence.
 * No person-authored coordinates or replacement station identities enter.
 * @author Samchon
 */
export interface IHumanSourceLipMaterialCourseInput {
  /** Actual head-frame metre surface, source partition and complete winding. */
  surface: IAutoMovieHumanFaceBasisSurface;

  /** One vermilion component's resident vertices, never another skin sheet. */
  component: readonly number[];

  /** Original vermilion-region triangles in the surface's native winding. */
  regionIndices: readonly number[];

  /** Original join, 2 mm station and central stops in their declared order. */
  stops: readonly number[];

  /** The original mandibular measurement axis; it is not a texture axis. */
  axis: readonly [number, number, number];
}
