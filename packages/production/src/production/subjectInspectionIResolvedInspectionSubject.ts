import { resolveAutoMovieSubjectReviewUnit } from "@automovie/engine";
import { AutoMovieSubjectReviewDescription } from "@automovie/interface";

/**
 * Keep one acquired compiled revision together with its native unit and shared description.
 *
 * @evidence contracts/common.md#principled-implementation Digest of acquired shot bytes accompanies the engine-resolved unit and its description.
 * @evidence contracts/common.md#clear-and-simple-design Resolution and later frame/coverage consumers share one lookup result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A revision alone does not prove generated-manifest entry agreement; the resolver's exception-to-null behavior remains separate.
 * @evidence contracts/common.md#meaningful-documentation The description aliases the resolved unit and uses its canonical subject id.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Byte read/hash, schema and native subject resolution execute in subjectInspectionResolveSubject.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One parsed unit is reused through the sweep instead of resolving each viewpoint again.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The sweep retains the unit/description and their parsed artifact references until completion; this erased type owns no handle.
 *
 * @author Samchon
 */
export interface subjectInspectionIResolvedInspectionSubject {
  /** Digest of the exact compiled shot bytes acquired for this lookup. */
  revision: string;

  /** Native engine unit resolved from that acquired artifact. */
  unit: ReturnType<typeof resolveAutoMovieSubjectReviewUnit>;

  /** The same unit's description, borrowed without a second projection. */
  description: AutoMovieSubjectReviewDescription;
}
