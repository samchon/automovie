import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A bilateral pair of head points a rule found on one skin, right (-X) and
 * left (+X).
 *
 * @evidence contracts/common.md#principled-implementation Bilateral rules return both sides together so a breadth reads one pair.
 * @evidence contracts/common.md#clear-and-simple-design Two points.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both sides are found; neither is mirrored from the other.
 * @evidence contracts/common.md#meaningful-documentation States the side convention.
 * @evidence contracts/modeling.md#spatial-conventions Right is -X of the head frame; metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rule that fills it cites its definition.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record converts no input.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanHeadPair {
  /** The right-side point (-X), metres. */
  right: IAutoMovieVector3;

  /** The left-side point (+X), metres. */
  left: IAutoMovieVector3;
}
