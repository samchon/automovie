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
 * @evidence contracts/common.md#principled-implementation An exponential hand-over from one unit direction to another along arc length is the same form the layer's lift and parting already decay by, so the field stays one continuous kinematic field with one more term.
 * @evidence contracts/common.md#clear-and-simple-design One number; omission keeps every existing hairstyle bit for bit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record names no style or subject and does not move a lock after integration.
 * @evidence contracts/common.md#meaningful-documentation States the formula, what happens on the scalp, and what the convention does not model.
 * @evidence contracts/modeling.md#parameter-channels `reach` varies one trait, how far along a lock the combed direction persists; larger keeps the comb longer and omission keeps it forever.
 * @evidence contracts/modeling.md#spatial-conventions Metres of centreline arc length; the hanging direction is -Y of the neutral head frame.
 * @evidence contracts/anatomy.md#anatomical-source No value is carried; the hold of styled hair was not read from any measurement and the field is an authored styling control.
 * @evidence contracts/anatomy.md#permitted-range The hairstyle admission requires a positive finite reach; no physiological bound exists for a styling convention.
 * @evidence contracts/anatomy.md#parametric-authority A named styling length chosen by the author; it addresses no strand, vertex or curve.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHairFall {
  /** Positive arc length in metres over which the combed direction decays to 1/e of its weight. */
  reach: number;
}
