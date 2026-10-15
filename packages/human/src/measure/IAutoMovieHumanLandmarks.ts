import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Palpable bony landmarks of one person and a few soft-tissue points that anthropometry measures from, as semantic coordinates on the skeleton.
 *
 * Each landmark names the bone it rides, so a posed skeleton carries it along, and its position in the model frame in millimetres (+Y up, +Z to the person's front, +X to the person's left, origin on the standing surface). Names follow the 2012 US Army Anthropometric Survey (ANSUR II; Gordon et al. 2014, NATICK/TR-15/007) for the body and the Farkas nomenclature of the 3D Facial Norms (Weinberg et al. 2016, Cleft Palate Craniofac J 53(6):e185-e197) for the head. Later parts place their surfaces through these points, and measuring them in the anthropometric posture returns the identity's measurements (see `measureAutoMovieHumanLandmarks`).
 *
 * @author Samchon
 */
export interface IAutoMovieHumanLandmarks {
  /** Highest point of the head in the Frankfort plane. */
  vertex: IAutoMovieHumanLandmarks.ILandmark;

  /** Most prominent midline point between the brows, on the frontal bone. */
  glabella: IAutoMovieHumanLandmarks.ILandmark;

  /** Midline point over the nasofrontal suture. */
  nasion: IAutoMovieHumanLandmarks.ILandmark;

  /** Most posterior midline point of the vault. */
  opisthocranion: IAutoMovieHumanLandmarks.ILandmark;

  /** Midline of the closed lips, the level of the incisal edges. */
  stomion: IAutoMovieHumanLandmarks.ILandmark;

  /** Lowest midline point of the chin; this skeleton places gnathion at it. */
  menton: IAutoMovieHumanLandmarks.ILandmark;

  /** Most prominent spinous process of the seventh cervical vertebra. */
  cervicale: IAutoMovieHumanLandmarks.ILandmark;

  /** Jugular notch at the top of the sternum. */
  suprasternale: IAutoMovieHumanLandmarks.ILandmark;

  /**
   * Level of the sitting surface under the ischial tuberosities: stature minus sitting height, the definition of subischial leg length.
   */
  ischialSeat: IAutoMovieHumanLandmarks.ILandmark;

  /** Landmarks of the person's left side. */
  left: IAutoMovieHumanLandmarks.ISide;

  /** Landmarks of the person's right side. */
  right: IAutoMovieHumanLandmarks.ISide;
}
export namespace IAutoMovieHumanLandmarks {
  /**
   * One landmark: where it is at rest and which bone carries it.
   *
   * @author Samchon
   */
  export interface ILandmark {
    /** Bone the landmark moves with. */
    bone: AutoMovieHumanoidBone;

    /** Position, millimetres, model frame. */
    position: IAutoMovieVector3;
  }

  /**
   * Landmarks of one side of the body.
   *
   * @author Samchon
   */
  export interface ISide {
    /** Most lateral point of the vault above the ear. */
    eurion: ILandmark;

    /** Most lateral point of the zygomatic arch. */
    zygion: ILandmark;

    /** Deepest point of the temporal crest of the frontal bone. */
    frontotemporale: ILandmark;

    /** Most lateral, inferior and posterior point of the mandibular angle. */
    gonion: ILandmark;

    /** Notch above the tragus of the ear, level with the ear canal. */
    tragion: ILandmark;

    /** Sternal end of the clavicle at the sternoclavicular joint. */
    clavicale: ILandmark;

    /** Lateral border of the acromial process, the point of the shoulder. */
    acromion: ILandmark;

    /** Upper palpable edge of the radial head. */
    radiale: ILandmark;

    /** Tip of the radial styloid process. */
    stylion: ILandmark;

    /** Tip of the middle finger. */
    dactylion: ILandmark;

    /** Radial side of the head of the second metacarpal. */
    metacarpaleII: ILandmark;

    /** Ulnar side of the head of the fifth metacarpal. */
    metacarpaleV: ILandmark;

    /** Palmar crease at the base of the middle finger, where palm length ends. */
    middleFingerCrease: ILandmark;

    /** Crease at the base of the thumb, over its metacarpophalangeal joint. */
    thumbCrease: ILandmark;

    /** Tip of the thumb. */
    thumbTip: ILandmark;

    /** Highest palpable point of the iliac crest. */
    iliocristale: ILandmark;

    /** Anterior superior iliac spine. */
    iliospinale: ILandmark;

    /** Top of the greater trochanter. */
    trochanterion: ILandmark;

    /** Middle of the patella. */
    patella: ILandmark;

    /** Upper palpable edge of the medial tibial condyle. */
    tibiale: ILandmark;

    /** Tip of the medial malleolus. */
    sphyrion: ILandmark;

    /** Lowest point of the lateral malleolus. */
    lateralMalleolus: ILandmark;

    /** Most posterior point of the heel. */
    pternion: ILandmark;

    /** Medial side of the head of the first metatarsal. */
    metatarsaleI: ILandmark;

    /** Lateral side of the head of the fifth metatarsal. */
    metatarsaleV: ILandmark;

    /** Tip of the longest toe. */
    acropodion: ILandmark;
  }
}
