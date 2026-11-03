import type { IAutoMovieHumanHeadMandible } from "./IAutoMovieHumanHeadMandible";

/** One section's measures in its own plane. */
export interface IAutoMovieHumanHeadSection {
  /** Normalized station. */
  t: number;

  /** Tilt of the plane, radians. */
  tilt: number;

  /** Cranium's centre. */
  axis: number;

  /** Cranium's front apex. */
  crown: number;

  /** Cranium's back apex. */
  back: number;

  /** Cranium's half-width. */
  width: number;

  /** Cranium's exponent. */
  powerBack: number;

  /**
   * Taper of the cranium's front half (`AutoMovieHumanHeadVault.frontTaper`),
   * reaching its full value with the vault's exponent; 0 at the neck.
   */
  taper: number;

  /**
   * The cranium's share of the skin in front of the face's lateral boundary
   * Z, in [0, 1]: 1 over the glabella (the forehead is the vault's), 0 under
   * the nasion (the face alone), the quintic smoothstep between, the brow's
   * span.
   */
  brow: number;

  /**
   * The neck tube's share of the cranium, in [0, 1]: 1 under the jaw, where
   * the cranium is the neck's tube, falling to 0 as the skull's sizes take
   * over by the nose's base (`AutoMovieHumanHeadSection`). The face merges
   * onto the tube by adding volume in that share.
   */
  tube: number;

  /** Face's front apex, on the midline profile. */
  front: number;

  /** Face's widest place. */
  waist: number;

  /** Face's half-width. */
  face: number;

  /** Face's exponent. */
  powerFace: number;

  /** Width of the smooth maximum joining the cranium and the face. */
  union: number;

  /** Station: the plane's height on the vertical through the origin. */
  station: number;

  /** The jaw's volume, joined to the two bodies along each ray. */
  jaw?: IAutoMovieHumanHeadMandible;
}
