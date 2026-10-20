import { IAutoMovieHeightRule, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Structural height input shared by scene, world and prepared support faces.
 *
 * @evidence contracts/common.md#principled-implementation surfaceHeightAt prioritizes an explicit constant, plane or bilinear heightfield rule; otherwise anchors define a flat or extrapolating ramp plane, and absence of both reads zero.
 * @evidence contracts/common.md#clear-and-simple-design Optional structural fields let scene/world records and derived prop support faces share the same height owner without importing either complete record shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Height queries ignore footprint and use existing fallback policies for absent rules, degenerate ramp axes and missing lattice samples; validation must distinguish malformed authored surfaces before use.
 * @evidence contracts/common.md#meaningful-documentation Documents rule precedence and optional anchor/null ramp spelling; this is a height function input, not a region or an admission result.
 * @evidence contracts/performance.md#efficient-algorithms Constant/plane/anchor queries take constant scalar work; heightfields read four samples per query and retain their authored O(columns*rows) sample storage through the optional rule.
 * @evidence contracts/performance.md#reuse-equivalent-work One height function serves standing, support and terrain consumers; the structural view borrows the same rule rather than deriving a separate height grid.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This record retains its supplied rule/anchor references without deep copying, caches or handles; the source owner controls their lifetime and mutation.
 */
export interface IAutoMovieHeightSurface {
  /** The general ground rule, when the surface states one. */
  readonly height?: IAutoMovieHeightRule | undefined;

  /** First height anchor of the two-anchor spelling. */
  readonly anchor?: IAutoMovieVector3 | undefined;

  /** Second height anchor of the two-anchor spelling; `null` when flat. */
  readonly rampTo?: IAutoMovieVector3 | null | undefined;
}
