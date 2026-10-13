import { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";

/** One deliverable the production must eventually materialize. */
export interface IAutoMovieProductionDeliverable {
  /** Non-blank id, unique within this production. */
  id: string;

  /** Output class. */
  kind: "preview" | "feature" | "guide-pass" | "captions" | "audio-mix";

  /**
   * Structural render pass owned by a guide-pass deliverable.
   *
   * Omitted only for legacy production records, which retain the pose default.
   * New production contracts declare one pass per guide deliverable so depth,
   * normal, mask, outline, and pose outputs have distinct typed ownership.
   */
  pass?: Exclude<AutoMovieGuidePass, "beauty">;

  /** Whether final compilation requires the deliverable. */
  required: boolean;
}
