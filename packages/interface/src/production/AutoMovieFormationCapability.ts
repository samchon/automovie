/**
 * Review-facing formation behavior vocabulary.
 *
 * The engine does not infer or restrict source motion from these labels. Observable shot predicates and review evidence remain authoritative.
 *
 * @evidence contracts/development/design.md#principled-representation Six locomotion labels describe formation intent for review, while compiled motion and observable predicates establish actual movement; declaring charge alone does not produce acceleration or contact.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A closed vocabulary annotates formation design without becoming another motion-command language or duplicating the authored motion segments.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Capability labels never substitute for measured source behavior, and no formation name selects a movement preset or bypasses review evidence.
 * @evidence contracts/development/common.md#meaningful-documentation Explicitly identifies review-facing intent and states that the labels do not infer or restrict source motion.
 */
export type AutoMovieFormationCapability =
  | "hold"
  | "advance"
  | "wheel"
  | "charge"
  | "break"
  | "retreat";
