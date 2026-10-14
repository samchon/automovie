import { IAutoMovieSceneEvidence } from "./IAutoMovieSceneEvidence";

/**
 * One discovered character, faction, or location grounded in scene evidence.
 *
 * @evidence contracts/common.md#principled-implementation String identity, scene citations and closed binding kinds represent an authored catalog entry; the arrays may be empty and referenced identities are not resolved by this type.
 * @evidence contracts/common.md#clear-and-simple-design Separates story identity from reusable shared design, allowing different productions to bind the same design differently without making model convenience the screenplay's ontology.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All entries share one binding union without section-specific exceptions; matching a binding kind to its catalog section and checking target existence remain consumer obligations.
 * @evidence contracts/common.md#meaningful-documentation Defines stable id, canonical name, scene evidence and production-scoped design joins with section-specific families.
 * @author Samchon
 */
export interface IAutoMovieScreenplayCatalogEntry {
  /** Stable catalog identity consumed by downstream design. */
  id: string;

  /** Human-readable canonical name. */
  name: string;

  /** At least one authored scene proving this subject exists in the film. */
  evidence: IAutoMovieSceneEvidence[];

  /**
   * Production-scoped joins to shared downstream design.
   *
   * Character entries bind model recipes, faction entries bind formations, and location entries bind world landmarks. Keeping these joins in the screenplay index lets two productions cast the same shared design differently.
   */
  bindings: Array<{
    /** Downstream design family allowed by this catalog section. */
    kind: "model" | "formation" | "world-landmark";

    /** Existing shared design identity. */
    id: string;
  }>;
}
