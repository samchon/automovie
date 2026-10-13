import type { IAutoMovieHumanFaceOralArch } from "./IAutoMovieHumanFaceOralArch";
import type { IAutoMovieHumanFaceOralPerformance } from "./IAutoMovieHumanFaceOralPerformance";
import type { IAutoMovieHumanFaceOralSpace } from "./IAutoMovieHumanFaceOralSpace";
import type { IAutoMovieHumanFaceOralTongue } from "./IAutoMovieHumanFaceOralTongue";
import type { IAutoMovieHumanFaceOralTooth } from "./IAutoMovieHumanFaceOralTooth";

/**
 * Numerical coarse oral assembly on the connected source: independently sized
 * permanent source crowns, upper/lower arches, their common cervical gingiva,
 * palate/floor/walls, and source tongue identity and performance. Existing lip,
 * commissure and jaw channels remain their source owners. Clinical observations
 * remain separate, with unknown acquisition and tissue properties preserved.
 * Omission retains the historical source replay without generating a new layer.
 *
 * @evidence contracts/common.md#principled-implementation Actual source crowns and cervical ports drive independent crown/arch identity and one common lining assembly, while tongue identity/performance modify the existing source tongue before ordinary rigid articulation.
 * @evidence contracts/common.md#clear-and-simple-design Permanent crown records, separate arches, enclosure, tongue identity and tip performance have distinct owners; lip/commissure/jaw channels remain existing source controls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplied oral generation requires qualified native source registration and ordinary geometry/contact admission; source-local extents and crown presence do not reconstruct clinical eruption, CEJ, CBCT residual volume or muscular mechanics.
 * @evidence contracts/common.md#meaningful-documentation Omission, unlisted crown retention and identity versus performance are explicit, with clinical observations remaining separate.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The schema performs no crown transformation or lining triangulation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Common source ports are an ownership relation; compilation/pose reuse belongs to the oral builders.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Optional caller records create no dental mesh, enclosure query or renderer materials.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOral {
  /** Independent ISO3950 permanent source crowns; unlisted entries retain source geometry, not inferred clinical eruption. */
  teeth?: Partial<
    Record<
      `${1 | 2 | 3 | 4}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`,
      IAutoMovieHumanFaceOralTooth
    >
  >;

  /** Maxillary arch and gingiva, independent of mandibular identity. */
  maxillary?: IAutoMovieHumanFaceOralArch;

  /** Mandibular arch and gingiva, carried by the source jaw owner. */
  mandibular?: IAutoMovieHumanFaceOralArch;

  /** Palate, floor and wall clearances, independently of crowns and tongue. */
  space?: IAutoMovieHumanFaceOralSpace;

  /** Persistent source-tongue dimensions, independently of current performance. */
  tongue?: IAutoMovieHumanFaceOralTongue;

  /** Current independent source-tongue performance; omission is neutral. */
  performance?: IAutoMovieHumanFaceOralPerformance;
}
