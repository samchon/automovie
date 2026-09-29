import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyRibMeasurements } from "./IAutoMovieHumanBodyRibMeasurements";

/**
 * Twelve numbered ribs on one anatomical side of a thoracic cage.
 *
 * The first seven are true ribs, the next three have indirect sternal
 * cartilage links, and the last two float; neither a combined chest girth
 * nor one rib volume can locate all their joint/cartilage boundaries.
 * @author Samchon
 */
export type IAutoMovieHumanBodyRibsMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Numbered rib 1 on this anatomical side. */
    rib1?: IAutoMovieHumanBodyRibMeasurements;
    /** Numbered rib 2 on this anatomical side. */
    rib2?: IAutoMovieHumanBodyRibMeasurements;
    /** Numbered rib 3 on this anatomical side. */
    rib3?: IAutoMovieHumanBodyRibMeasurements;
    /** Numbered rib 4 on this anatomical side. */
    rib4?: IAutoMovieHumanBodyRibMeasurements;
    /** Numbered rib 5 on this anatomical side. */
    rib5?: IAutoMovieHumanBodyRibMeasurements;
    /** Numbered rib 6 on this anatomical side. */
    rib6?: IAutoMovieHumanBodyRibMeasurements;
    /** Numbered rib 7 on this anatomical side. */
    rib7?: IAutoMovieHumanBodyRibMeasurements;
    /** Numbered rib 8 on this anatomical side. */
    rib8?: IAutoMovieHumanBodyRibMeasurements;
    /** Numbered rib 9 on this anatomical side. */
    rib9?: IAutoMovieHumanBodyRibMeasurements;
    /** Numbered rib 10 on this anatomical side. */
    rib10?: IAutoMovieHumanBodyRibMeasurements;
    /** Numbered rib 11 on this anatomical side. */
    rib11?: IAutoMovieHumanBodyRibMeasurements;
    /** Numbered rib 12 on this anatomical side. */
    rib12?: IAutoMovieHumanBodyRibMeasurements;
  }>;
