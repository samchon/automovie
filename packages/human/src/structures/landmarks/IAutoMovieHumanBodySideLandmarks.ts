import { IAutoMovieHumanLandmark } from "./IAutoMovieHumanLandmark";

/**
 * Landmarks of one side of the body.
 */
export interface IAutoMovieHumanBodySideLandmarks {
  /** Most lateral point of the vault above the ear. */
  eurion: IAutoMovieHumanLandmark;

  /** Most lateral point of the zygomatic arch. */
  zygion: IAutoMovieHumanLandmark;

  /** Deepest point of the temporal crest of the frontal bone. */
  frontotemporale: IAutoMovieHumanLandmark;

  /** Most lateral, inferior and posterior point of the mandibular angle. */
  gonion: IAutoMovieHumanLandmark;

  /** Notch above the tragus of the ear, level with the ear canal. */
  tragion: IAutoMovieHumanLandmark;

  /** Sternal end of the clavicle at the sternoclavicular joint. */
  clavicale: IAutoMovieHumanLandmark;

  /** Lateral border of the acromial process, the point of the shoulder. */
  acromion: IAutoMovieHumanLandmark;

  /** Upper palpable edge of the radial head. */
  radiale: IAutoMovieHumanLandmark;

  /** Tip of the radial styloid process. */
  stylion: IAutoMovieHumanLandmark;

  /** Tip of the middle finger. */
  dactylion: IAutoMovieHumanLandmark;

  /** Radial side of the head of the second metacarpal. */
  metacarpaleII: IAutoMovieHumanLandmark;

  /** Ulnar side of the head of the fifth metacarpal. */
  metacarpaleV: IAutoMovieHumanLandmark;

  /** Palmar crease at the base of the middle finger, where palm length ends. */
  middleFingerCrease: IAutoMovieHumanLandmark;

  /** Crease at the base of the thumb, over its metacarpophalangeal joint. */
  thumbCrease: IAutoMovieHumanLandmark;

  /** Tip of the thumb. */
  thumbTip: IAutoMovieHumanLandmark;

  /** Highest palpable point of the iliac crest. */
  iliocristale: IAutoMovieHumanLandmark;

  /** Anterior superior iliac spine. */
  iliospinale: IAutoMovieHumanLandmark;

  /** Top of the greater trochanter. */
  trochanterion: IAutoMovieHumanLandmark;

  /** Middle of the patella. */
  patella: IAutoMovieHumanLandmark;

  /** Upper palpable edge of the medial tibial condyle. */
  tibiale: IAutoMovieHumanLandmark;

  /** Tip of the medial malleolus. */
  sphyrion: IAutoMovieHumanLandmark;

  /** Lowest point of the lateral malleolus. */
  lateralMalleolus: IAutoMovieHumanLandmark;

  /** Most posterior point of the heel. */
  pternion: IAutoMovieHumanLandmark;

  /** Medial side of the head of the first metatarsal. */
  metatarsaleI: IAutoMovieHumanLandmark;

  /** Lateral side of the head of the fifth metatarsal. */
  metatarsaleV: IAutoMovieHumanLandmark;

  /** Tip of the longest toe. */
  acropodion: IAutoMovieHumanLandmark;
}
