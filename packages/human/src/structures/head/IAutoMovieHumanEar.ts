import { tags } from "typia";

/**
 * One auricle, measured on the living head held in the Frankfort plane.
 *
 * The definitions are those of the Korean multicentre survey of the external ear (Cho et al. 2025, J Korean Med Sci 40(22):e107): adult ears average 67 mm long and 29 mm broad in men and 64.5 and 27.4 mm in women. Ears keep lengthening through adulthood, from 63.9 mm in men in their twenties to 69.5 mm at 70 and over, while breadth and protrusion stay nearly constant.
 */
export interface IAutoMovieHumanEar {
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
}
