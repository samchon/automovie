import type { AutoMovieConstructionContinuity } from "./AutoMovieConstructionContinuity";
import type { AutoMovieConstructionJoinKind } from "./AutoMovieConstructionJoinKind";
import type { IAutoMovieConstructionNode } from "./IAutoMovieConstructionNode";
import type { IAutoMovieConstructionParameter } from "./IAutoMovieConstructionParameter";
import type { IAutoMovieConstructionPortLoop } from "./IAutoMovieConstructionPortLoop";
import type { IAutoMovieConstructionSeed } from "./IAutoMovieConstructionSeed";
import type { IAutoMovieConstructionWidth } from "./IAutoMovieConstructionWidth";

/**
 * A part joined onto a host: a merge (the union of the two solids) or a diff
 * (the part cut from the host), along the curve where their surfaces meet, with
 * a blend of declared continuity between a rail on each.
 *
 * The host is everything its subtree builds, as faces that share their
 * boundaries; the part is its own subtree, of which one face (`seed.partFace`)
 * meets the host. The engine traces the curve from the seed by the declared
 * parameter, crossing from one host face to the next where the curve does;
 * places each rail the declared chord from the curve on its kept side (a merge
 * keeps the part outside the host and the host outside the part, a diff the
 * part inside the host); spans the rails by the blend; and trims every face the
 * host rail runs over. A join that cannot keep these premises (no closed loop
 * near the seed, a tangential contact, a rail that cannot be placed or crosses
 * itself, a folded blend) is left out with its diagnostics and the host stands
 * as it was.
 *
 * A mixed join declares `loop`: the contact is then that closed curve on
 * `seed.hostFace`'s chart, the boundary both surfaces share by one owner, and
 * nothing is traced. Round it the part may run on from the host where the two
 * are tangent (a mound's upper pole, a shoulder cap, an ear's root) and cross
 * it elsewhere (the fold under a mound, the cleft under an arm, the groove
 * round a nostril's wing). No arc is declared: at each point of the loop the
 * turn `beta` between the two surfaces' outward normals is read from the
 * surfaces, a `fold` width with a `reach` gives each rail its chord
 * `hypot(reach, radius tan(beta / 2))`, and the kept sides come from the
 * normals where the surfaces cross by more than `grazing` and from the loop
 * where they do not (the host outside the loop, the part running on from the
 * host across it). The fold's width therefore runs out to the reach as the
 * crossing closes, with the blend G2 to both surfaces along both rails all
 * round; a changed part size or a turned part frame moves every arc with the
 * surfaces.
 *
 * Engine admission: `seed.partFace` a view part of the part's subtree and
 * `seed.hostFace` a face of the host's; a diff's part a view part, since only
 * the cutter's wall inside the host is kept; `count` a positive multiple of 4
 * of at least 8; `rows` a positive integer; `tolerance` and `grazing` positive.
 * With `loop`: the loop as `IAutoMovieConstructionPortLoop` admits it; every
 * point of it within `tolerance` of the part's face (`shared loop`); the part's
 * kept side the same all round (`one kept side`: a part that passes under its
 * host along an arc is no mound); each width positive at every point, so a
 * `fold` width carries its `reach`; a fold's radius within both surfaces' radii
 * of curvature toward the fold (`fold radius`).
 */
export interface IAutoMovieConstructionJoin {
  /** Discriminator. */
  type: "join";

  /** A merge or a diff. */
  kind: AutoMovieConstructionJoinKind;

  /** The join's name, unique in its tree: it names the blend's chain and face. */
  name: string;

  /**
   * The solid the part joins: its whole subtree, whose faces the curve may
   * cross.
   */
  host: IAutoMovieConstructionNode;

  /**
   * The joined solid: its whole subtree, of which `seed.partFace` meets the
   * host.
   */
  part: IAutoMovieConstructionNode;

  /** Where the trace starts, from the landmarks that locate the contact. */
  seed: IAutoMovieConstructionSeed;

  /**
   * The curve's parameter: how one turn of the loop is measured. Not read with
   * `loop`, whose clock measures the turn.
   */
  parameter: IAutoMovieConstructionParameter;

  /**
   * The contact as a declared closed curve on `seed.hostFace`'s chart, in place
   * of a trace: the loop one owner supplies to both surfaces, such as the
   * host's skin cut by a surface fixed in its frame, through which the part's
   * face passes all round. It admits a contact that is tangential over part of
   * its turn, which no trace can follow. The seed then names the two faces and,
   * as a `point` seed, the part's chart point near the loop's clock 0; nothing
   * is searched along the curve. Absent, the curve is traced from the seed.
   */
  loop?: IAutoMovieConstructionPortLoop;

  /**
   * Chord from the curve to the part's rail, as a function of the curve's
   * parameter.
   */
  partWidth: IAutoMovieConstructionWidth;

  /** Chord from the curve to the host's rail; a `station` width is refused here. */
  hostWidth: IAutoMovieConstructionWidth;

  /** The continuity the blend keeps across both rails. */
  continuity: AutoMovieConstructionContinuity;

  /**
   * Points of the trace per turn and columns of the published blend, at uniform
   * curve parameters, a positive multiple of 4 of at least 8; between columns
   * the blend leaves the surfaces' tangent planes by about `(spacing / R)^2 /
   * 8`, `R` the smaller radius of curvature.
   */
  count: number;

  /** Rows of the blend's tessellation between its rails, a positive integer. */
  rows: number;

  /**
   * Largest distance accepted between the two surfaces at a traced point,
   * metres, positive.
   */
  tolerance: number;

  /**
   * Least angle between the two tangent planes along the curve, radians,
   * positive; under it the contact is reported as tangential.
   */
  grazing: number;

  /**
   * The width, metres, of the band about the blend over which the drawn skin is
   * faired: every vertex whose path along the mesh from the nearest of the
   * blend's own vertices is shorter than it, the blend's included, moves to the
   * thin-plate fill its two outer rings hold, G1 to the skin round it (Botsch
   * and Kobbelt 2004). A blend only as wide as the narrow seam it spans leaves
   * a notch wherever the trace turns tightly, as at a thumb's root beside the
   * web. Positive and finite; absent, the blend stays as drawn.
   */
  fair?: number;
}
