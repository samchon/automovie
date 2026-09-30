import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Midline sternum with manubrium, body and xiphoid as one bony complex.
 *
 * Its anterior surface anchors pectoralis major and its costal articulations
 * help orient the rib cage. A measured whole-bone length or volume does not
 * yield all costal cartilage junctions or an anterior thorax skin contour.
 * @author Samchon
 */
export type IAutoMovieHumanBodySternumMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Superior manubrial to inferior xiphoid osseous span. */
    maximumLength?: IAutoMovieHumanBodyAnatomicalLength;
    /** Sternum alone, excluding ribs and costal cartilages. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  }>;
