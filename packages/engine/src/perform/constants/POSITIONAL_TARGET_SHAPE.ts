/**
 * What a positional target may be, stated once so every verb's refusal, on
 * every rung, teaches the same vocabulary. Cameras belong in the list because
 * the shared placement table (`scenePlacements`) resolves them (#1294).
 *
 * @evidence requirements/staging/interactions-and-choreography.md#staging-interaction-refusal States the positional vocabulary authors must correct when a choreography target cannot resolve.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-interaction-choreography-role Defines the actionable target boundary used by interaction refusal.
 * @author Samchon
 */
export const POSITIONAL_TARGET_SHAPE =
  "a node/bone/point/group, whose ids name placed actors, set pieces, or cameras, and whose group may also name the formations a camera frames";
