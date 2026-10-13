import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieHumanBodySourceAxis } from "./AutoMovieHumanBodySourceAxis";
import type { AutoMovieHumanBodySourceDriver } from "./AutoMovieHumanBodySourceDriver";
import type { IAutoMovieHumanBodySourceMotionKnot } from "./IAutoMovieHumanBodySourceMotionKnot";

/**
 * One ordered source joint coordinate with its own direction, admission and driver.
 *
 * @evidence contracts/common.md#principled-implementation A named coordinate pairs rotation or translation with a unit direction, optional local pivot, supported interval and sole registered driver.
 * @evidence contracts/common.md#clear-and-simple-design One axis record owns motion representation, bounds and profile provenance so ordered joints consume the same coordinate definition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source account and qualification distinguish supported authored intervals from clinical validation; profile omission does not invent extrapolated motion.
 * @evidence contracts/common.md#meaningful-documentation Comments specify degrees versus metres, joint-local frame, origin omission, neutral, inclusive range and piecewise profile coverage.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Axis data describes mapping and admission requirements while profile readers choose the interpolation strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A profile array is source input rather than an owned cache of evaluated driver coordinates.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Direction, pivot and knot references create no live articulation or resource-release duty in the type declaration.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceJointAxis {
  /** Named physiological/source motion coordinate on this anatomical bone. */
  id: AutoMovieHumanBodySourceAxis;

  /** Rotation is degrees; translation is metres along the declared joint-frame direction. */
  kind: "rotation" | "translation";

  /** Unit direction in the source joint's rest-local frame. */
  direction: IAutoMovieVector3;

  /** Optional axis pivot in joint-rest-local metres; omission means the joint origin. Distinct CMC axes need not share a pivot. */
  origin?: IAutoMovieVector3;

  /** Absolute source coordinate at the shared neutral; no clinical zero is inferred. */
  neutral: number;

  /** Supported source-coordinate interval [minimum, maximum], with actual grounds in account. */
  range: readonly [number, number];

  /** Sole source-defined public or internal coordinate that drives this axis. */
  driver: AutoMovieHumanBodySourceDriver;

  /** Optional source-defined piecewise-linear mapping; no extrapolation beyond its input coverage. */
  profile?: readonly IAutoMovieHumanBodySourceMotionKnot[];

  /** Read source, quantity, acquisition/authoring conditions and supported scope. */
  account: string;

  /** Anatomical/author-created approximation limits, not a successful clinical validation flag. */
  qualification: string;
}
