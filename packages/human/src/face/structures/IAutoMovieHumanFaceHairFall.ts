/**
 * How a lock gives up its combed direction and hangs.
 *
 * A layer's `flow` is the direction the hair is combed in. Without this
 * record a lock keeps that direction for its whole length, also where it has
 * left the head, so long hair combed backward stands out behind the head.
 * With it, the combed direction decays along the lock and the direction of
 * hanging takes its place: at arc length `d` from the root the comb keeps the
 * weight `exp(-d / reach)` and the downward head axis takes the rest. A lock
 * that still lies on the head at that point slides down along the scalp,
 * because the direction field removes the part of any direction that points
 * into the skin.
 *
 * This is a static styling convention, as the rest of the hairstyle document
 * is: it is no gravity simulation, it knows no stiffness, mass or contact
 * between locks, and "down" is the head frame's -Y, which is the direction of
 * gravity only for an upright head. No hold length of combed or styled hair
 * was read from a measurement; `reach` is authored.
 *
 * @evidence contracts/common.md#principled-implementation evaluateHumanFaceHairDirection exponentially hands the normalized comb direction to head-frame -Y by centreline arc length, then removes inward skin-directed components.
 * @evidence contracts/common.md#clear-and-simple-design One positive metre reach controls the static hand-over without a second path, hold-length threshold or gravity solver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Head -Y is not world gravity for a rotated head; the field provides no mass, stiffness, lock-to-lock contact or measured styling endurance.
 * @evidence contracts/common.md#meaningful-documentation The exact exponential weight, omission behavior and upright-head limitation identify the actual kinematic approximation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The reach declaration does not evaluate or integrate the direction field.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It carries a scalar without caching arc-length evaluations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No curve, query, task or physical simulation state is created.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHairFall {
  /** Positive arc length in metres over which the combed direction decays to 1/e of its weight. */
  reach: number;
}
