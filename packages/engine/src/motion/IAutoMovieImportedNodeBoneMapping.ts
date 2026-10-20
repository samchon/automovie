import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Explicit imported-node to normalized source-bone correspondence.
 * Node ids and bone slots must each be unique, and each bone must exist on the
 * declared source skeleton; importedNodeClipToAutoMovieMotion enforces this.
 *
 * @evidence contracts/common.md#principled-implementation An exact imported node id paired with one semantic bone slot makes the lowering correspondence explicit; uniqueness on both sides prevents two channels silently overwriting one clinical articulation.
 * @evidence contracts/common.md#clear-and-simple-design A two-field pair is reused in the imported motion's mapping list, with shape admission left to the clip conversion owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither fuzzy node-name matching nor a source-specific skeleton guess is represented; every correspondence is caller-authored.
 * @evidence contracts/common.md#meaningful-documentation States exact ids, both uniqueness requirements, skeleton membership and the runtime validator enforcing them.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A correspondence pair performs no lookup or graph traversal itself.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The pair establishes semantic correspondence, not equivalence of imported takes or a converted-motion cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Each mapping list owns one node string and one bone slot per entry, with no source byte buffer retained by this record.
 */
export interface IAutoMovieImportedNodeBoneMapping {
  /** Exact imported node identity. */
  node: string;

  /** Explicit normalized source-rig role. */
  bone: AutoMovieHumanoidBone;
}
