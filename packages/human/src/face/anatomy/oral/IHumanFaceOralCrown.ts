import type { IAutoMovieHumanFaceOralCrownSupport } from "../../structures/IAutoMovieHumanFaceOralCrownSupport";

/**
 * Native source crown and its exact open cervical boundary. Vertex ordinals retain the original dental surface identity; no clinical CEJ is inferred.
 *
 * @evidence contracts/common.md#principled-implementation A registered permanent source crown preserves original dental vertices, triangle corners and its open cervical cycle.
 * @evidence contracts/common.md#clear-and-simple-design Identity lowering, arch construction and source query closures consume this same native registration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The coarse cervical port is not an inferred clinical CEJ or tooth long axis.
 * @evidence contracts/common.md#meaningful-documentation ISO quadrant/position and original dental ordinals remain distinct from local render UV indices.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Native topology extraction and support admission execute in readHumanFaceOralCrowns/assertHumanFaceOralSupport.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The source record reuses one crown incidence across identity, lining and collider consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The reader owns copied vertex/index/cycle arrays, retained by current oral construction rather than a hidden mesh cache.
 *
 * @author Samchon
 */
export interface IHumanFaceOralCrown {
  /** Permanent ISO quadrant/position admitted from the publisher's native crown registration. */
  id: IAutoMovieHumanFaceOralCrownSupport["id"];
  /** Original dental-surface vertex ordinals of this component, before render UV separation. */
  vertices: number[];
  /** Oriented native triangle corners in original dental-surface ordinals, not crown-local indices. */
  indices: number[];
  /** Ordered degree-two open root cycle in the same native ordinals; shared source port, not a measured clinical CEJ. */
  cervical: number[];
  /** True for mandibular source components carried by the existing jaw; false for maxillary head-owned components. */
  mandibular: boolean;
}
