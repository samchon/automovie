import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Chin traits of an {@link IAutoMovieFace}'s jaw: signed morph weights in `[-2,
 * 2]`, `0`/omitted meaning the template's chin unchanged. The leaves project
 * onto the unsided `chinLength` and `chinProtrusion` morph targets.
 *
 * @author Samchon
 */
export interface IAutoMovieFaceChin {
  /** Vertical reach of the chin tip: `+` a longer chin, `-` a short one. */
  length?: AutoMovieFaceWeight;

  /** Forward projection of the chin: `+` protrudes, `-` recedes. */
  protrusion?: AutoMovieFaceWeight;
}
