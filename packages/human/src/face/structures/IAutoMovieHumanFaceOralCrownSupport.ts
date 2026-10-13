/**
 * A permanent source crown's native component and exact cervical witness.
 * ISO identity comes from the licensed producer's coarse tooth registration;
 * clinical long axis, cusp and measured gingival margin remain unknown.
 *
 * @evidence contracts/common.md#principled-implementation assertHumanFaceOralSupport compares every registered crown's identity, head/jaw owner, native component ordinals, cervical cycle and exact neutral port XYZ against the actual source crown reader.
 * @evidence contracts/common.md#clear-and-simple-design One permanent coarse source component owns its cervical witness; the containing oral support owns source surface and generation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact native agreement supplies source authority, not clinical tooth long axis, cusp-tip registration or CEJ measurement, and a crown label cannot replace missing actual geometry.
 * @evidence contracts/common.md#meaningful-documentation ISO quadrant/position, native index domain, head/jaw ownership and metre port rows distinguish source witness from clinical acquisition.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The witness performs no component extraction or port comparison.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Persistent native identity does not implement posed dental caches.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The producer owns index/XYZ arrays; this record creates no crown mesh or collider.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOralCrownSupport {
  /** Permanent ISO quadrant 1–4 and position 1–8 assigned by the producer's coarse native component registration. */
  id: `${1 | 2 | 3 | 4}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;

  /** Existing rigid head/maxillary or jaw/mandibular owner; no second joint or clinical trajectory is defined. */
  owner: "head" | "jaw";

  /** Original component vertex ordinals in the registered native dental surface, aligned with its immutable topology. */
  vertices: number[];

  /** Ordered open-root boundary ordinals in that native surface; the gingival generator consumes this exact port. */
  cervical: number[];

  /** Exact neutral head-metre XYZ triples aligned with cervical ordinals. */
  neutralCervicalPositions: number[];
}
