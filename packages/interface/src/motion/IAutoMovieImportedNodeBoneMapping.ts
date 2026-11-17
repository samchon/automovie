import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Explicit imported-node to normalized source-bone correspondence.
 * Node ids and bone slots must each be unique, and each bone must exist on the
 * declared source skeleton. adoptAutoMovieExternalMotion admits inspected-node
 * bindings and importedNodeClipToAutoMovieMotion admits clip conversion inputs.
 *
 * @evidence contracts/development/design.md#principled-representation An exact imported node id paired with one semantic bone slot makes the lowering correspondence explicit; uniqueness on both sides prevents two channels silently overwriting one clinical articulation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Ingest adoption and engine clip conversion exchange this same node/source-bone pair; each validates its surrounding source and skeleton obligations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither fuzzy node-name matching nor a source-specific skeleton guess is represented; every correspondence is caller-authored.
 * @evidence contracts/development/common.md#meaningful-documentation States exact ids, both uniqueness requirements, skeleton membership and the runtime validator enforcing them.
 */
export interface IAutoMovieImportedNodeBoneMapping {
  /** Exact imported node identity. */
  node: string;

  /** Explicit normalized source-rig role. */
  bone: AutoMovieHumanoidBone;
}
