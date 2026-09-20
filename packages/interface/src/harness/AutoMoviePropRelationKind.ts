/**
 * The closed set of contact semantics a prop placement can assert.
 *
 * @evidence requirements/staging/interactions-and-choreography.md#staging-interaction-contact-contract Exposes `AutoMoviePropRelationKind` as the portable data boundary for the staging interaction contact contract requirement.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Types `AutoMoviePropRelationKind` for the performance interaction attachment object handoff system contract.
 */
export type AutoMoviePropRelationKind =
  | "in-space"
  | "on-support"
  | "against-boundary"
  | "fill-opening"
  | "attached"
  | "suspended";
