import type { IAutoMovieHumanFaceLidSectionDisplacement } from "./IAutoMovieHumanFaceLidSectionDisplacement";

/** Independent persistent identity of upper and lower lid sections on one eye.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceLidSections {
  /** Margin-to-crease skin section; no global fold-grade to millimetre inference. */
  upperPretarsal?: IAutoMovieHumanFaceLidSectionDisplacement;
  /** Upper crease bank on the actual host cage. */
  upperCrease?: IAutoMovieHumanFaceLidSectionDisplacement;
  /** Overlying upper hood, independent of crease elevation and projection. */
  upperHood?: IAutoMovieHumanFaceLidSectionDisplacement;
  /** Upper preseptal section, with the outer orbital attachment held. */
  upperPreseptal?: IAutoMovieHumanFaceLidSectionDisplacement;
  /** Lower pretarsal section, independent of upper identity. */
  lowerPretarsal?: IAutoMovieHumanFaceLidSectionDisplacement;
  /** Lower subtarsal transition represented by the lower crease station. */
  lowerSubtarsal?: IAutoMovieHumanFaceLidSectionDisplacement;
  /** Lower preseptal section, with the outer orbital attachment held. */
  lowerPreseptal?: IAutoMovieHumanFaceLidSectionDisplacement;
}
