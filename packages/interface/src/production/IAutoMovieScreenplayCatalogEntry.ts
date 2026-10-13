import { IAutoMovieSceneEvidence } from "./IAutoMovieSceneEvidence";

/**
 * One discovered character, faction, or location grounded in scene evidence.
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
   * Character entries bind model recipes, faction entries bind formations, and
   * location entries bind world landmarks. Keeping these joins in the
   * screenplay index lets two productions cast the same shared design
   * differently.
   */
  bindings: Array<{
    /** Downstream design family allowed by this catalog section. */
    kind: "model" | "formation" | "world-landmark";

    /** Existing shared design identity. */
    id: string;
  }>;
}
