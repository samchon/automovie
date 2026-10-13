import { IAutoMovieSceneEvidence } from "./IAutoMovieSceneEvidence";

/**
 * One discovered character, faction, or location grounded in scene evidence.
 *
 * @evidence contracts/common.md#principled-implementation A canonical story identity and nonempty scene citations establish the catalog subject, while production-scoped typed bindings connect characters to models, factions to formations and locations to landmarks.
 * @evidence contracts/common.md#clear-and-simple-design Separates story identity from reusable shared design, allowing different productions to bind the same design differently without making model convenience the screenplay's ontology.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bindings must match their catalog section and resolve existing designs; an arbitrary asset name or unsupported binding family cannot replace scene-grounded identity.
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
