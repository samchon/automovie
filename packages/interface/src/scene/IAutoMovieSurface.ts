import { IAutoMovieHeightRule } from "../geometry/IAutoMovieHeightRule";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieSurfaceKind } from "./AutoMovieSurfaceKind";

/**
 * One standable surface patch of a space: the semantic ground the engine queries where it previously assumed a single scalar plane.
 *
 * One outer XZ ring with optional holes defines the footprint, and one height representation defines support over it. Visible set geometry remains a separately authored model; this surface states where feet and props can rest rather than prescribing that model's shape.
 *
 * **A surface states its ground exactly one way.** Either the general {@link height} rule, which is the same rule a production world's terrain carries, or the two-anchor spelling below, which says the same thing for the flat and single-plane cases and is what every space authored before relief existed says. Stating both, or neither, is refused by `validateSpace`: a patch with two heights is a patch whose feet and whose renderer can disagree, which is the whole failure this record exists to prevent.
 *
 * **The ground over a footprint is single-valued, and that is a stated limit rather than an omission.** An overhanging balcony soffit, a vertical face, and a ramp that spirals over its own lower flight all have two heights at one plan position, and no {@link height} rule can say two. They are not approximated into one patch here: the ground query answers the topmost patch over a plan point, so a lower patch directly beneath another is ground nothing can be placed on. Author the flights as separate spaces, and read multi-valued ground as unsupported rather than as relief that came out flat.
 *
 * @evidence contracts/common.md#principled-implementation A closed simple outer XZ ring with optional interior holes and exactly one height representation defines support; shared constant/plane/bilinear height laws and legacy anchors produce the same single-valued ground query.
 * @evidence contracts/common.md#clear-and-simple-design Semantic label remains independent from footprint and height, while explicit void rings express one slab without splitting its support ownership into neighbouring patches.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Conflicting or missing height statements refuse; hole rims belong to the closed slab and invalid rings refuse. The gate requires absolute double plan area above 1e-9 square metres and legacy squared ramp span at least 1e-9 square metres. Finite fields do not guarantee finite derived heights, and multi-valued ground and true curved footprints remain unsupported.
 * @evidence contracts/common.md#meaningful-documentation Defines XZ and ignored-y ownership, concavity and hole rules, mutually exclusive height/anchor spelling and single-valued-ground limitations.
 * @author Samchon
 */
export interface IAutoMovieSurface {
  /** Stable id; `IAutoMovieSpace.walkable` cites surfaces by this. */
  id: string;

  /** Discriminator-like semantic label (does not change the math). */
  kind: AutoMovieSurfaceKind;

  /**
   * Outer footprint ring on the ground plan, at least three non-collinear points. Only `x` and `z` are used: the vertical extent comes from the height statement, so `y` here is ignored (write `0`).
   *
   * The ring is a simple polygon and **may be concave**: an L-shaped floor plate keeps its notch, because the ground query classifies against the ring itself rather than against its convex hull. What it may not do is cross itself, because a self-crossing ring has no inside for a foot to be on, and `validateSpace` refuses one.
   *
   * A curved edge has no spelling here. Author it as chords and read it as exactly those chords: the footprint is never resampled, so what the ground query answers is what was written rather than a curve somebody assumed.
   */
  polygon: IAutoMovieVector3[];

  /**
   * Voids cut in the footprint: the atrium opening through a floor plate, a stairwell, a light well.
   *
   * This is what lets a slab with an atrium void be **one** support patch. Cut as a ring of separate patches instead, the void's edge becomes a seam between records that can be edited apart, and a foot planted on the seam asks two patches which ground it is on.
   *
   * Each hole is its own simple ring of at least three points, lying strictly inside {@link polygon} and disjoint from every other hole; `validateSpace` refuses anything else. A plan point strictly inside a hole is **off** the surface, exactly as a point outside the outer ring is, while a point on a hole's own rim is still on the slab: the rings bound a closed region.
   *
   * The rings say where the surface is, never how high it is. What stands under a hole is whatever other patch is authored there, or nothing.
   */
  holes?: IAutoMovieVector3[][];

  /**
   * The general ground rule: a `constant` level, a `plane` slope, or a `heightfield` lattice the surface interpolates bilinearly.
   *
   * Constant and plane rules cover level and tilted ground; a heightfield additionally describes sampled relief. World terrain and scene support share this evaluator, with the same interpolation and finite-derived-arithmetic limits.
   *
   * Present requires anchor to be absent and rampTo to be absent or null. Without this rule, an anchor is required and an optional nonnull rampTo defines its slope.
   */
  height?: IAutoMovieHeightRule;

  /**
   * Height anchor: standing at this point's `(x, z)`, the surface height is its `y`. For a flat patch this is the height everywhere on the polygon.
   *
   * The two-anchor spelling of {@link height}, and absent when that rule is given. Kept because it is what every authored space says and because two points are the plainest way to write a floor or a ramp.
   */
  anchor?: IAutoMovieVector3;

  /**
   * Second height anchor for a sloped surface. The query extrapolates linearly along the XZ anchor-to-ramp direction and is constant perpendicular to it. Admission requires squared XZ separation at least 1e-9 square metres; the direct evaluator treats smaller spans as flat. Null or omission means anchor.y everywhere.
   */
  rampTo?: IAutoMovieVector3 | null;
}
