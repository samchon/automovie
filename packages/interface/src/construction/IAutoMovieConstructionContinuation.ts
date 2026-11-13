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
 * @evidence contracts/development/design.md#principled-representation One owner publishes the shared section and its station jets and the neighbour copies them, so the two chains are C2 across the ring by the station rule both use.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two faces and their ends are the whole record; the shared ring needs no curve, rail or blend.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Equal-order boundaries use the explicit whole-field replacement; different-order native boundaries require original full scalar2/frame2/lift2 equivalence and a sufficient regularity certificate, preserving all rows and intervals without fitting or coarsening.
 * @evidence contracts/development/common.md#meaningful-documentation States the meeting, what is copied and in which direction, the shared ring, the failure effects and the admission.
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

  /**
   * A band between the two ends in place of the shared ring, for faces whose sections cannot share one: a part whose sections carry
   * another layout than the host's (more conics, an inflection the host has not) has another order, and an equal-order continuation
   * refuses it. With a band the part keeps its own sections; its end is left open at `rail` inside it, and a band spans from the host's
   * end ring to that rail, matched column by column, G2 to the host along its end and G2 to the part along the rail, as a split's
   * bands are (`IAutoMovieConstructionSplit`). Absent, the ends share one ring.
   */
  band?: IAutoMovieConstructionContinuation.IBand;
}

export namespace IAutoMovieConstructionContinuation {
  /**
   * The band that joins two unequal ends.
   *
   * Engine admission: `rail` positive and finite and inside the part's domain; `count` a multiple of 4 of at least 8; `rows` a positive
   * integer.
   *
   * @evidence contracts/development/design.md#principled-representation The band is the split's join strip between each side's own 2-jet across its ring (Hartmann 2001, parametric G^n blending), here with one stretch round the whole ring and no seam, so two faces of any orders meet G2 without either being re-expressed in the other's sections.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A rail depth, the columns, the rows and how the rail is matched: the strip's existing inputs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The rail is an authored depth, not searched; a rail outside the part's domain is a diagnostic, never clamped.
   * @evidence contracts/development/common.md#meaningful-documentation States each field, its unit and its admission.
   */
  export interface IBand {
    /** The rail's distance from the part's end into the part along its station, metres, positive: the part keeps the stations beyond it. */
    rail: number;

    /** Columns of the band round the ring, a multiple of 4 of at least 8. */
    count: number;

    /** Grid stations of the band across its span, at least 1. */
    rows: number;

    /** How the part's rail is matched to the host's ring (`IAutoMovieConstructionSplit.IChild.correspondence`); absent, by length. */
    correspondence?: "angle" | "length";
  }
}
