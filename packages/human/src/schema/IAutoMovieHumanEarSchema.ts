import type { IAutoMovieHumanEar } from "@automovie/interface";
import type { tags } from "typia";

/**
 * One external ear's measurements for typia validation, in millimetres.
 * Measure length along the auricle, breadth across that axis and protrusion
 * from the scalp at tragus height.
 */
export type IAutoMovieHumanEarSchema = IAutoMovieHumanEar & {
  /**
   * Ear length: superaurale, the highest point of the helix, to subaurale, the lowest point of the lobule, millimetres. This line is the auricle's long axis.
   */
  length: number & tags.Minimum<15> & tags.Maximum<110>;

  /**
   * Ear breadth: otobasion superius, where the helix leaves the scalp, to the most posterior point of the helix, perpendicular to the long axis, millimetres.
   */
  breadth: number & tags.Minimum<10> & tags.Maximum<70>;

  /**
   * Protrusion: distance of the helix rim from the scalp behind it at the level of the tragus, millimetres.
   */
  protrusion: number & tags.Minimum<0> & tags.Maximum<50>;
};
