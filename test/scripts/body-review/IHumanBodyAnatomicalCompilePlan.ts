import type { IHumanBodyAnatomicalRawInput } from "./IHumanBodyAnatomicalRawInput";

/**
 * Actual source files for one registered whole-body coarse assembly compile.
 *
 * Paths resolve against this plan's directory. Every referenced source is a
 * real acquired or reproducibly authored input, not a test fixture. The rig
 * file is the source owner's complete registered graph with public rest-frame
 * witnesses; original mesh bytes and compiled registered objects retain
 * separate digests. Shared generation publication remains outside this CLI.
 * @author Samchon
 */
export interface IHumanBodyAnatomicalCompilePlan {
  /** Neutral-only static source compilation requires held rest frames and no motion; omission uses fully registered articulated replay. */
  mode?: "neutral-only";

  /** Actual whole-source preparation receipt preserving original member refusals and any independently authored replacements. */
  sourcePreparationReceipt: string;

  /** Actual original body view gzip to preserve its source skin/rig identity. */
  bodyView: string;
  /** Actual original head view gzip used by the person composition consumer. */
  headView: string;
  /** Actual saved neutral person document, never a copied application default. */
  personDocument: string;
  /** Complete source-qualified SourceRig JSON in the canonical body metre frame. */
  rig: string;
  /** Source-derived part inventory with original FMA/file/rights byte identities. */
  inventory: string;
  /** Directory of the actual common-atlas mesh gzip outputs. */
  compiledAtlas: string;
  /** Current acquired-source compile receipt, including refused source members. */
  atlasReceipt: string;
  /** Reproducibly authored missing-part source packet and its independent meshes. */
  otherParts: string;
  /** Paired independently authored glandular source receipt. */
  glandular: string;
  /** Current-source body-terminated adipose source receipt. */
  adipose: string;
  /** Agreed common-atlas registration, applied to geometry exactly once. */
  registration: string;
  /** Actual member-to-bone/site/role references from the joint/tissue source authors. */
  attachmentPackets: string[];
  /** Original files supplying every surface receipt; no hash normalization or inferred bytes. */
  rawInputs: IHumanBodyAnatomicalRawInput[];
  /** Exact source shape condition; missing channel weights mean zero. */
  shape: Record<string, number>;
}
