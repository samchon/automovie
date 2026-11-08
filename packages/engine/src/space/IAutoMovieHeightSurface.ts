import { IAutoMovieHeightRule, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Structural height input shared by scene, world and prepared support faces.
 *
 * @evidence contracts/development/design.md#principled-representation surfaceHeightAt prioritizes an explicit constant, plane or bilinear heightfield rule; otherwise anchors define a flat or extrapolating ramp plane, and absence of both reads zero.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Optional structural fields let scene/world records and derived prop support faces share the same height owner without importing either complete record shape.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Height queries ignore footprint and use existing fallback policies for absent rules, degenerate ramp axes and missing lattice samples; validation must distinguish malformed authored surfaces before use.
 * @evidence contracts/development/common.md#meaningful-documentation Documents rule precedence and optional anchor/null ramp spelling; this is a height function input, not a region or an admission result.
 */
export interface IAutoMovieHeightSurface {
  /** The general ground rule, when the surface states one. */
  readonly height?: IAutoMovieHeightRule | undefined;

  /** First height anchor of the two-anchor spelling. */
  readonly anchor?: IAutoMovieVector3 | undefined;

  /** Second height anchor of the two-anchor spelling; `null` when flat. */
  readonly rampTo?: IAutoMovieVector3 | null | undefined;
}
