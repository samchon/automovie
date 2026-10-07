import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieHumanBodySourceAxis } from "./AutoMovieHumanBodySourceAxis";
import type { AutoMovieHumanBodySourceDriver } from "./AutoMovieHumanBodySourceDriver";
import type { IAutoMovieHumanBodySourceMotionKnot } from "./IAutoMovieHumanBodySourceMotionKnot";

/** One ordered source joint coordinate with its own direction, admission and driver. */
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
