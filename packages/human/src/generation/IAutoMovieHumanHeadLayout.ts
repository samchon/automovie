import { AutoMovieHumanNaturalSpline } from "../lofting/AutoMovieHumanNaturalSpline";
import type { IAutoMovieHumanHeadEyeOpening } from "./IAutoMovieHumanHeadEyeOpening";
import type { IAutoMovieHumanHeadLandmarks } from "./IAutoMovieHumanHeadLandmarks";
import type { IAutoMovieHumanHeadMandible } from "./IAutoMovieHumanHeadMandible";
import type { IAutoMovieHumanHeadNeck } from "./IAutoMovieHumanHeadNeck";

/** Stations and sizes of one person, calibration millimetres. */
export interface IAutoMovieHumanHeadLayout {
  /** Calibration millimetres per world millimetre. */
  scale: number;

  /** Masculine-feminine control. */
  sex: number;

  /** Fat control. */
  fat: number;

  /** Neck ring's height. */
  y0: number;

  /** The neck ring. */
  neck: IAutoMovieHumanHeadNeck;

  /** Menton. */
  menton: number;

  /** Stomion. */
  stomion: number;

  /** Subnasale. */
  subnasale: number;

  /** Nose tip. */
  tip: number;

  /** Nasion. */
  nasion: number;

  /** Eye level: the fissures' centre. */
  eye: number;

  /** Vertex. */
  vertex: number;

  /** Skull centre ahead of the origin, midway from glabella to opisthocranion. */
  centre: number;

  /** Head length, glabella to opisthocranion. */
  length: number;

  /** Head breadth, eurion to eurion. */
  breadth: number;

  /** Face height. */
  faceHeight: number;

  /** Face's half width at the zygion, solved. */
  faceWidth: number;

  /** Half the mandibular width, solved at the gonion's skin. */
  mandibularWidth: number;

  /** Half the minimum frontal width. */
  frontalWidth: number;

  /** Exponent of the cranium's plan, which closes the head circumference. */
  vault: number;

  /** The vault's reach behind its centre at the opisthocranion, solved for g-op. */
  reach: number;

  /** Half nose width: the alar lobules' half span. */
  noseWidth: number;

  /** Tip's lead past the face. */
  noseLead: number;

  /** Height of the jaw's border at the midline, solved so the skin's lowest chin point is the menton. */
  border: number;

  /** Half mouth width. */
  mouthWidth: number;

  /** Upper vermilion height. */
  upperLip: number;

  /** Lower vermilion height. */
  lowerLip: number;

  /** Lips' forward leads over the face at the middles of their vermilions. */
  lips: [number, number];

  /** Rest gap of the lips. */
  gap: number;

  /** Fullness of the jaw joint in front of the ear. */
  joint: number;

  /** Left eye. */
  left: IAutoMovieHumanHeadEyeOpening;

  /** Right eye. */
  right: IAutoMovieHumanHeadEyeOpening;

  /** Station map. */
  station: AutoMovieHumanNaturalSpline.ISpline;

  /** Columella's rise above the horizontal, radians. */
  columella: number;

  /** Rounding radius of the nose's base into the lip, mm: the nose's own blend width (`AutoMovieHumanSeamUnion.width`). */
  round: number;

  /** The landmarks. */
  landmarks: IAutoMovieHumanHeadLandmarks;

  /** The midline profile's departure from the vault's ellipse along the height. */
  profile: AutoMovieHumanNaturalSpline.ISpline;

  /** The jaw, once the chin and the ears are placed. */
  mandible?: IAutoMovieHumanHeadMandible;
}
