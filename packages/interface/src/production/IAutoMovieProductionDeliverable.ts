import { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";

/**
 * One authored output obligation the production renders and verifies.
 *
 * @evidence contracts/development/design.md#principled-representation A unique deliverable id, output kind and required flag establish the declared delivery population; guide-pass selection adds its structural pass and final validation reopens the actual files for that obligation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record selects an output class without embedding renderer settings or byte receipts, which belong to production render configuration and delivered-file records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Legacy guide records alone may omit pass and retain pose; current contracts name one pass explicitly, and required outputs cannot be discharged by another deliverable kind.
 * @evidence contracts/development/common.md#meaningful-documentation Defines unique identity, output class, required completion and structural-pass ownership with the legacy pose default.
 */
export interface IAutoMovieProductionDeliverable {
  /** Non-blank id, unique within this production. */
  id: string;

  /** Output class. */
  kind: "preview" | "feature" | "guide-pass" | "captions" | "audio-mix";

  /**
   * Structural render pass owned by a guide-pass deliverable.
   *
   * Omitted only for legacy production records, which retain the pose default. New production contracts declare one pass per guide deliverable so depth, normal, mask, outline, and pose outputs have distinct typed ownership.
   */
  pass?: Exclude<AutoMovieGuidePass, "beauty">;

  /** Whether final compilation requires the deliverable. */
  required: boolean;
}
