import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The eye supplies its final refined lid curves and resident ocular support.
 * X increases on both sides; anatomical left has its medial corner at minimum X.
 * Upper and lower curves share endpoints and return millimetre head coordinates.
 * @author Samchon
 */
export interface IPortraitOcularTissueBoundary {
  /** Anatomical side determining which canthus is medial. */
  side: "left" | "right";

  /** Smaller canthal X in head millimetres. */
  minimumX: number;

  /** Larger canthal X in head millimetres, strictly above minimumX. */
  maximumX: number;

  /** Final upper-lid point at head X, in millimetres. */
  upper: (x: number) => IAutoMovieVector3;

  /** Final lower-lid point at head X, in millimetres. */
  lower: (x: number) => IAutoMovieVector3;

  /** Support height in mm. The eye may include its raised cornea as well as sclera. */
  globe: (x: number, y: number) => number;
}
