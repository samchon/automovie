import type { AutoMovieHumanHairStyle } from "../typings/AutoMovieHumanHairStyle";
import type { AutoMovieHumanHairEnvelope } from "./AutoMovieHumanHairEnvelope";
import type { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import type { AutoMovieHumanShoulderField } from "./AutoMovieHumanShoulderField";
import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * What stays fixed while one guide is integrated: the head, the envelope,
 * the body, the style and this root's own length, cut level, step and
 * coefficients (`AutoMovieHumanHairGuideStart`).
 */
export interface IAutoMovieHumanHairGuideContext {
  /** Head chart. */
  field: AutoMovieHumanHeadField.IField;

  /** Smooth envelope of the hair mass. */
  envelope: AutoMovieHumanHairEnvelope.IEnvelope;

  /** Body surface heights under the head. */
  shoulders: AutoMovieHumanShoulderField.IField;

  /** Haircut. */
  style: AutoMovieHumanHairStyle;

  /** Unit root direction in the head chart's frame. */
  u: AutoMovieHumanSkinVector.Vec3;

  /** This root's length, millimetres. */
  length: number;

  /** Height of a bob's level cut at this root, model millimetres. */
  cut: number;

  /** Menton height, model millimetres: the head chart's lowest hold. */
  menton: number;

  /** Integration steps. */
  steps: number;

  /** Step length, millimetres. */
  step: number;

  /** Share of the way to the field's direction a step turns. */
  adherence: number;

  /** Share of the downward direction a step turns by at the strand's end. */
  gravity: number;

  /** Clearance growth per millimetre grown. */
  stack: number;

  /** Layer clearance of this root, millimetres. */
  layer: number;

  /** Whether the strand hangs (a bob) rather than lies on the head. */
  hang: boolean;

  /** Exit angle of this root over the scalp, radians (`AutoMovieHumanHairExitAngle`). */
  exit: number;

  /** The gravitational bending length of the fibre, millimetres (`AutoMovieHumanHairBending`). */
  bending: number;

  /**
   * The physical length of this root's hair, millimetres: its style's length
   * with the lock variation, before the hairline's feather shortens the
   * guide for the soft edge (a feathered edge is drawn short; the hair
   * itself is as long and as heavy as its neighbours').
   */
  reach: number;
}
