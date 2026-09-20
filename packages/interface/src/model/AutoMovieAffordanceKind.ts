/**
 * What an affordance point is **for**: the closed set of interaction semantics
 * an object can declare (D011: the geometry stays a crude proxy, the meaning is
 * rich data).
 *
 * The set is deliberately minimal, covering the interactions the pipeline
 * already computes with:
 *
 * - `"stack-top"`: a face another object can rest on (a crate lid, a table top).
 *   The only kind that carries an `extent`; its corners feed the #601
 *   support/topple judgment.
 * - `"handle"`: a grab point that seats a hand frame (a mug handle, a sword
 *   grip). Finger-level wrap IK is a later pass.
 * - `"socket"`: a receptacle another object's contact frame plugs into (a torch
 *   sconce, a peg hole, a bottle mouth).
 * - `"hook"`: a hanging point (a lantern ring, a coat peg).
 *
 * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary Exposes `AutoMovieAffordanceKind` as the portable data boundary for the motion object authored vocabulary requirement.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Types `AutoMovieAffordanceKind` for the performance interaction attachment object handoff system contract.
 * @author Samchon
 */
export type AutoMovieAffordanceKind =
  | "stack-top"
  | "handle"
  | "socket"
  | "hook";
