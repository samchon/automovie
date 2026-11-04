import { AutoMovieSolidJoin } from "./AutoMovieSolidJoin";

/**
 * The solid merge: one lofted part attached to its host by the curve where
 * their surfaces meet and a G2 blend along it, the union of the two solids.
 *
 * The part is built whole in its own frame and runs into the host (an arm tube
 * into the trunk past the axilla, a leg into the pelvis, a finger into the
 * palm, the neck into the head); the host is built as if the part did not
 * exist. The merge finds their intersection curve
 * (`AutoMovieSolidIntersection`), trims the part back to a rail on its
 * outside part and the host back to a rail outside the part
 * (`AutoMovieSolidRail`), and spans the two rails by the quintic blend
 * that copies both surfaces' 2-jets (`AutoMovieSolidBlend`), so the
 * merged skin is G2 across both rails. What the two solids leave is the
 * union: a branch (one loop becoming two) and an overhang need no special
 * case, because neither surface is a graph over the other.
 *
 * The width laws are the consumer's: chords on the part and on the host as
 * functions of the part's phase, derived from the parts' own sizes and inputs
 * (construction.md: a blend width derived from the piece's own size), never a
 * reference's shape. A part that is a graph over its host's chart (a relief)
 * does not need this operator: `AutoMovieHumanSeamUnion` merges it G2 already.
 *
 * Where two merges onto one host come close (the crotch's two legs, the
 * webs), their host rails must not cross; the caller caps each width at half
 * the gap between the curves, and a corner past that is a setback closed by
 * `AutoMovieHumanSeamPatch`.
 */
export namespace AutoMovieSolidMerge {
  /**
   * Merge a part onto its host.
   *
   * @param input The part (periodic phase), the host, the seed from the
   *   contact's landmarks, the trace's limits and the width laws.
   * @returns The join, the part kept outside the host, or null with the
   *   diagnostics of every broken premise (no single transversal loop, a rail
   *   that cannot be placed, a rail that crosses itself, a folded blend).
   */
  export function create(input: AutoMovieSolidJoin.IInput): AutoMovieSolidJoin.IResult {
    return AutoMovieSolidJoin.create(input, "outside");
  }
}
