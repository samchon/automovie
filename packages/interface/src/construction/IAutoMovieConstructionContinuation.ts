import type { AutoMovieConstructionNode } from "./AutoMovieConstructionNode";

/**
 * A part continued from a host's end: the part face's end section is the host face's end section, so the two faces share one ring and the skin runs across it C2 (a neck rising from a trunk's top, a stem from a pot's rim).
 *
 * Where a join meets a host along a curve on its side, a continuation meets it end to end. Equal-order sections copy the host's whole endpoint and both station derivatives into the part, signed into its station direction. Different output orders can retain both original chains when their actual native whole boundary, physical frame2 and absent or phase-constant lift2 already agree. That path admits a nonturning boundary plane with nonzero transverse station speed; it changes no original interval or compatibility row and does not approximate a conic by a spline. Other unequal-order families are refused.
 *
 * Both faces draw on one shared ring, whose sample count is independent of section order. The author's endpoints must be regular and open. A selected pole, an end cut away or consumed by either subtree, an unavailable actual derivative, or an unsupported boundary correspondence leaves the continuation out with its diagnostic and the host unchanged. Phase correspondence is identity for opposite end kinds and reflection for matching kinds; first station derivatives receive the same sign and second derivatives keep theirs. Arbitrary phase offsets or station scales are not declared by this node.
 *
 * Engine admission: `hostFace` a view part of the host's subtree and `partFace` one of the part's; `name` unique in the tree.
 *
 * @evidence contracts/common.md#principled-implementation One owner publishes the shared section and its station jets and the neighbour copies them, so the two chains are C2 across the ring by the station rule both use.
 * @evidence contracts/common.md#clear-and-simple-design Two faces and their ends are the whole record; the shared ring needs no curve, rail or blend.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal-order boundaries use the explicit whole-field replacement; different-order native boundaries require original full scalar2/frame2/lift2 equivalence and a sufficient regularity certificate, preserving all rows and intervals without fitting or coarsening.
 * @evidence contracts/common.md#meaningful-documentation States the meeting, what is copied and in which direction, the shared ring, the failure effects and the admission.
 */
export interface IAutoMovieConstructionContinuation {
  /** Discriminator. */
  type: "continue";

  /** The continuation's name, unique in its tree, named in diagnostics. */
  name: string;

  /** The solid whose face's end the part continues. */
  host: AutoMovieConstructionNode;

  /** The host face whose end is shared: a view part's name in the host's subtree. */
  hostFace: string;

  /** Which end of the host face: its first station's (`bottom`) or its last's (`top`). */
  hostEnd: "bottom" | "top";

  /** The continuing solid. */
  part: AutoMovieConstructionNode;

  /** The part face that continues the host's: a view part's name in the part's subtree. */
  partFace: string;

  /** Which end of the part face takes the host's section. */
  partEnd: "bottom" | "top";
}
