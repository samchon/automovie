/**
 * Review-facing formation behavior vocabulary.
 *
 * The builder does not infer or restrict source motion from these labels. Observable shot predicates and review evidence remain authoritative.
 *
 * @evidence contracts/common.md#principled-implementation Six locomotion labels describe formation intent for review, while compiled motion and observable predicates establish actual movement; declaring charge alone does not produce acceleration or contact.
 * @evidence contracts/common.md#clear-and-simple-design A closed vocabulary annotates formation design without becoming another motion-command language or duplicating the authored motion segments.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Capability labels never substitute for measured source behavior, and no formation name selects a movement preset or bypasses review evidence.
 * @evidence contracts/common.md#meaningful-documentation Explicitly identifies review-facing intent and states that builder admission does not infer or restrict source motion from those labels.
 * @author Samchon
 */
export type AutoMovieFormationCapability =
  | "hold"
  | "advance"
  | "wheel"
  | "charge"
  | "break"
  | "retreat";
