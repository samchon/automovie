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
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHairFall {
  /** Positive arc length in metres over which the combed direction decays to 1/e of its weight. */
  reach: number;
}
