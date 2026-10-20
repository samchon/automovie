import { IAutoMovieHumanBodySideLandmarks } from "./IAutoMovieHumanBodySideLandmarks";
import { IAutoMovieHumanLandmark } from "./IAutoMovieHumanLandmark";
import { IAutoMovieHumanPair } from "../common/IAutoMovieHumanPair";

/**
 * Palpable bony landmarks of one person and a few soft-tissue points that anthropometry measures from, as semantic coordinates on the skeleton.
 *
 * Each landmark names a bone and a position in millimetres (+Y up, +Z to the person's front, +X to the person's left, origin on the standing surface). Names follow the 2012 US Army Anthropometric Survey (ANSUR II; Gordon et al. 2014, NATICK/TR-15/007) for the body and the Farkas nomenclature of the 3D Facial Norms (Weinberg et al. 2016, Cleft Palate Craniofac J 53(6):e185-e197) for the head. This is a measurement record; no current implementation positions or measures these landmarks.
 */
export interface IAutoMovieHumanLandmarks {
  /** Highest point of the head in the Frankfort plane. */
  vertex: IAutoMovieHumanLandmark;

  /** Most prominent midline point between the brows, on the frontal bone. */
  glabella: IAutoMovieHumanLandmark;

  /** Midline point over the nasofrontal suture. */
  nasion: IAutoMovieHumanLandmark;

  /** Most posterior midline point of the vault. */
  opisthocranion: IAutoMovieHumanLandmark;

  /** Midline of the closed lips, the level of the incisal edges. */
  stomion: IAutoMovieHumanLandmark;

  /** Lowest midline point of the chin. */
  menton: IAutoMovieHumanLandmark;

  /** Most prominent spinous process of the seventh cervical vertebra. */
  cervicale: IAutoMovieHumanLandmark;

  /** Jugular notch at the top of the sternum. */
  suprasternale: IAutoMovieHumanLandmark;

  /**
   * Level of the sitting surface under the ischial tuberosities: stature minus sitting height, the definition of subischial leg length.
   */
  ischialSeat: IAutoMovieHumanLandmark;

  /** Independently specified landmarks of the person's left and right sides. */
  sidePair: IAutoMovieHumanPair<IAutoMovieHumanBodySideLandmarks>;
}
