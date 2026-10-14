import type { IPortraitEyebrowProfile } from "../anatomy/brow/IPortraitEyebrowProfile";

/**
 * Explicit authored shaft population and dimensions on the shared brow band.
 *
 * @evidence contracts/common.md#principled-implementation An explicit emitted strand count extends the common numerical radius/flow/profile owner on a registered brow band; profile admission bounds count and dimensions before generation.
 * @evidence contracts/common.md#clear-and-simple-design Population count stays here while the inherited profile owns representation, dimensions, segment budget and authored flow semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Emitted count is neither biological follicle density nor clinical acquisition, and source/default population conventions do not reconstruct an individual's brow.
 * @evidence contracts/common.md#meaningful-documentation The comment states authored band scope and strandCount states the integer 0..4096 allocation envelope and biological distinction; inherited members supply millimetres/default meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface performs no root distribution or tube/ribbon generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Profile inheritance reuses schema meaning, not emitted-shaft computations or cached populations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The document owns the profile/count and the producer enforces allocation bounds; no shaft buffer or task is opened by the type.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBrowPopulation extends IPortraitEyebrowProfile {
  /** Requested shaft count, integer 0..4096; not follicle density or a clinical count. */
  strandCount: number;
}
