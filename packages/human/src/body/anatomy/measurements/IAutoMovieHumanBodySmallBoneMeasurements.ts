import type { AutoMovieHumanBodyNonemptyMeasurements } from "./AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "./IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "./IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Named carpal, tarsal, metapodial or phalangeal bone scalar observations.
 *
 * The enclosing finger, toe or arch names the exact bone and side. Its
 * maximum length and segmented volume cannot establish an articular surface
 * or a 3D vertex path; one generator may reuse topology across homologous
 * digits while retaining independent person-specific dimensions.
 * @author Samchon
 */
export type IAutoMovieHumanBodySmallBoneMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Maximum osseous end-to-end length along the named bone. */
    maximumLength?: IAutoMovieHumanBodyAnatomicalLength;
    /** Segmented volume of only this bone, excluding cartilage. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  }>;
