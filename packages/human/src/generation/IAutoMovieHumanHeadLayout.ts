import { AutoMovieNaturalSpline } from "@automovie/engine";
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

  /** Neck section's mean height, distinct from its posterior C7 point. */
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

  /** Retained cranial axis ahead of the origin; the chosen g/op chord need not place it at their midpoint. */
  centre: number;

  /** Head length, glabella to opisthocranion. */
  length: number;

  /** Head breadth, eurion to eurion. */
  breadth: number;

  /** Face height. */
  faceHeight: number;

  /** Target half face width at the generating zygion, resolved from the public zy-zy caliper. */
  faceWidth: number;

  /** Target half mandibular width at the generating gonion; source emission is checked independently. */
  mandibularWidth: number;

  /** Half the minimum frontal width. */
  frontalWidth: number;

  /**
   * Exponent of the retained horizontal Lame proxy at glabella, solved by
   * AutoMovieHumanHeadVault.closing. Its conic conversion and the public
   * oblique maximum tape are separate, unfinished closure contracts.
   */
  vault: number;

  /** Public head-tape target, calibration mm, with the retired correction. */
  tape: number;

  /** Retained posterior reach; chosen-point chord closure is not a maximum-caliper certificate. */
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

  /** Retained multiple of maximum incisal mouth-opening capacity; unused by the resting source, not a rest lip gap. */
  gap: number;

  /** Retained multiple of lateral incisal excursion capacity; unused by the resting source, not measured joint fullness. */
  joint: number;

  /** Left eye. */
  left: IAutoMovieHumanHeadEyeOpening;

  /** Right eye. */
  right: IAutoMovieHumanHeadEyeOpening;

  /** Station map. */
  station: AutoMovieNaturalSpline.ISpline;

  /** Columella's rise above the horizontal, radians. */
  columella: number;

  /** Rounding radius of the nose's base into the lip, mm: the nose's own blend width (`AutoMovieHumanSeamUnion.width`). */
  round: number;

  /** The landmarks. */
  landmarks: IAutoMovieHumanHeadLandmarks;

  /** The midline profile's departure from the vault's ellipse along the height. */
  profile: AutoMovieNaturalSpline.ISpline;

  /** The jaw, once the chin and the ears are placed. */
  mandible?: IAutoMovieHumanHeadMandible;
}
