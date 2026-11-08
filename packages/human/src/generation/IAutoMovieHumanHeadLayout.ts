import { AutoMovieNaturalSpline } from "@automovie/engine";
import type { IAutoMovieHumanHeadEyeOpening } from "./IAutoMovieHumanHeadEyeOpening";
import type { IAutoMovieHumanHeadLandmarks } from "./IAutoMovieHumanHeadLandmarks";
import type { IAutoMovieHumanHeadMandible } from "./IAutoMovieHumanHeadMandible";
import type { IAutoMovieHumanHeadNeck } from "./IAutoMovieHumanHeadNeck";

/**
 * Stations and sizes of one person, calibration millimetres.
 *
 * @evidence contracts/common.md#principled-implementation Keeps public chords, shared datums, original neck sources and explicitly separate shape priors available to actual source authors.
 * @evidence contracts/common.md#clear-and-simple-design One layout feeds head mass and regional builders before any tree realization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Data does not certify reference fit, actual tape closure, internal overlap or final join success.
 * @evidence contracts/common.md#meaningful-documentation Fields state calibration units and distinguish border direction, bulk relief, measurements and retained conventions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data interface performs no calculation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Producers own each original preparation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns numeric records and call-owned source closures; no global figure is retained.
 */
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

  /** Actual-tape cranial diagonal-transfer power; affects native fullness above nasion only, preserving lower face/neck and all four original guides. */
  cranialTapePower?: number;

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

  /** Separate normal bulk shape priors, calibration mm; neither chord directions nor individual peak targets. */
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
