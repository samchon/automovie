import type { IAutoMovieHumanFaceRegionalRelief } from "../IAutoMovieHumanFaceRegionalRelief";

/** Source-landmark courses, independent of raw skin-condition observations.
 *
 * @author Samchon
 */
export interface Regions {
  /** Horizontal forehead course above source glabella; explicit length/elevation in mm, independent rest/fold traits, omitted for no added relief. */
  forehead?: IAutoMovieHumanFaceRegionalRelief;

  /** Superior glabellar course from source glabella with explicit mm length; rest offset and performed fold remain independent. */
  glabellar?: IAutoMovieHumanFaceRegionalRelief;

  /** Anatomical-left cheilion-to-gnathion authored course on the connected anterior skin; omission adds no left relief. */
  marionetteLeft?: IAutoMovieHumanFaceRegionalRelief;

  /** Anatomical-right cheilion-to-gnathion authored course, independently omitted or performed from the left. */
  marionetteRight?: IAutoMovieHumanFaceRegionalRelief;

  /** Left source crista-philtri-to-subnasale course, confined to anatomical +X; authored mm relief is separate from clinical grades. */
  philtralLeft?: IAutoMovieHumanFaceRegionalRelief;

  /** Right source crista-philtri-to-subnasale course, confined to anatomical -X; neither identity nor performance inherits the left. */
  philtralRight?: IAutoMovieHumanFaceRegionalRelief;

  /** Cheilion-to-labiale-superius-to-cheilion source course; independent mm identity/fold support holds the registered lip margin. */
  perioralUpper?: IAutoMovieHumanFaceRegionalRelief;

  /** Cheilion-to-labiale-inferius-to-cheilion source course; independent lower mm identity/fold support, omitted for no added relief. */
  perioralLower?: IAutoMovieHumanFaceRegionalRelief;
}
