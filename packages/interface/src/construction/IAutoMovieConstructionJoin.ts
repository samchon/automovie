import type { AutoMovieConstructionContinuity } from "./AutoMovieConstructionContinuity";
import type { AutoMovieConstructionJoinKind } from "./AutoMovieConstructionJoinKind";
import type { AutoMovieConstructionNode } from "./AutoMovieConstructionNode";
import type { AutoMovieConstructionParameter } from "./AutoMovieConstructionParameter";
import type { AutoMovieConstructionSeed } from "./AutoMovieConstructionSeed";
import type { AutoMovieConstructionWidth } from "./AutoMovieConstructionWidth";

/**
 * A part joined onto a host: a merge (the union of the two solids) or a diff (the part cut from the host), along the curve where their surfaces meet, with a blend of declared continuity between a rail on each.
 *
 * The host is everything its subtree builds, as faces that share their boundaries; the part is its own subtree, of which one face (`seed.partFace`) meets the host. The engine traces the curve from the seed by the declared parameter, crossing from one host face to the next where the curve does; places each rail the declared chord from the curve on its kept side (a merge keeps the part outside the host and the host outside the part, a diff the part inside the host); spans the rails by the blend; and trims every face the host rail runs over. A join that cannot keep these premises (no closed loop near the seed, a tangential contact, a rail that cannot be placed or crosses itself, a folded blend) is left out with its diagnostics and the host stands as it was.
 *
 * Engine admission: `seed.partFace` a view part of the part's subtree and `seed.hostFace` a face of the host's; a diff's part a view part, since only the cutter's wall inside the host is kept; `count` a positive multiple of 4 of at least 8; `rows` a positive integer; `tolerance` and `grazing` positive.
 *
 * @evidence contracts/development/design.md#principled-representation The surface-surface intersection is traced as a function of a declared parameter by Newton's method with exact jets from the implicit function theorem, and the blend is the quintic Hermite between both surfaces' 2-jets along their rails, G2 by construction (Patrikalakis, Maekawa and Cho, Shape Interrogation, ch. 5; Vida, Martin and Varady, A survey of blending methods, 1994).
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record serves the merge and the diff, which differ only in the kept sides; the host as a subtree covers branches, overhangs, corners where two blends meet, and parts merged at both ends without special cases.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No join is made along a section's rays, by a distance field or on a mesh; a failed premise leaves the join out with a diagnostic instead of a fallback shape.
 * @evidence contracts/development/common.md#meaningful-documentation States both kinds, the roles of host and part, what the engine computes, the kept sides, the failure effect and the admission rules.
 */
export interface IAutoMovieConstructionJoin {
  /** Discriminator. */
  type: "join";

  /** A merge or a diff. */
  kind: AutoMovieConstructionJoinKind;

  /** The join's name, unique in its tree: it names the blend's chain and face. */
  name: string;

  /** The solid the part joins: its whole subtree, whose faces the curve may cross. */
  host: AutoMovieConstructionNode;

  /** The joined solid: its whole subtree, of which `seed.partFace` meets the host. */
  part: AutoMovieConstructionNode;

  /** Where the trace starts, from the landmarks that locate the contact. */
  seed: AutoMovieConstructionSeed;

  /** The curve's parameter: how one turn of the loop is measured. */
  parameter: AutoMovieConstructionParameter;

  /** Chord from the curve to the part's rail, as a function of the curve's parameter. */
  partWidth: AutoMovieConstructionWidth;

  /** Chord from the curve to the host's rail; a `station` width is refused here. */
  hostWidth: AutoMovieConstructionWidth;

  /** The continuity the blend keeps across both rails. */
  continuity: AutoMovieConstructionContinuity;

  /** Points of the trace per turn and columns of the published blend, at uniform curve parameters, a positive multiple of 4 of at least 8; between columns the blend leaves the surfaces' tangent planes by about `(spacing / R)^2 / 8`, `R` the smaller radius of curvature. */
  count: number;

  /** Rows of the blend's tessellation between its rails, a positive integer. */
  rows: number;

  /** Largest distance accepted between the two surfaces at a traced point, metres, positive. */
  tolerance: number;

  /** Least angle between the two tangent planes along the curve, radians, positive; under it the contact is reported as tangential. */
  grazing: number;

  /**
   * The width, metres, of the band about the blend over which the drawn skin is faired: every vertex whose path along the mesh from the
   * nearest of the blend's own vertices is shorter than it, the blend's included, moves to the thin-plate fill its two outer rings hold,
   * G1 to the skin round it (Botsch and Kobbelt 2004). A blend only as wide as the narrow seam it spans leaves a notch wherever the trace
   * turns tightly, as at a thumb's root beside the web. Positive and finite; absent, the blend stays as drawn.
   */
  fair?: number;
}
