import type { AutoMovieConstructionNode } from "./AutoMovieConstructionNode";

/**
 * A part continued from a host's end: the part face's end section is the host face's end section, so the two faces share one ring and the skin runs across it C2 (a neck rising from a trunk's top, a stem from a pot's rim).
 *
 * Where a join meets a host along a curve on its side, a continuation meets it end to end: the engine copies the host face's end layer, its section and both station derivatives, into the part face's end layer, signed into the part's station direction, and draws the two faces on one shared ring. The part's axis still sets where its other sections run, so its author ends that axis at the host's end; the copy moves only the end layer. A host or part face whose end section is closed by a pole, a host end already cut away by a join or a trim, or two ends whose sections differ in their number of control points, is one diagnostic and the continuation is left out.
 *
 * Engine admission: `hostFace` a view part of the host's subtree and `partFace` one of the part's; `name` unique in the tree.
 *
 * @evidence contracts/common.md#principled-implementation One owner publishes the shared section and its station jets and the neighbour copies them, so the two chains are C2 across the ring by the station rule both use.
 * @evidence contracts/common.md#clear-and-simple-design Two faces and their ends are the whole record; the shared ring needs no curve, rail or blend.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The part's own end section is replaced by the host's, never blended or faded toward it; a mismatch of control points is refused.
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
