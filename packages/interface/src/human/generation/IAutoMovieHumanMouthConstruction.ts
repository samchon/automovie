import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanOralAnatomy } from "./IAutoMovieHumanOralAnatomy";

/**
 * Mouth construction inputs and the combined oral-anatomy/aperture result.
 *
 * The interface package owns these declarations; AutoMovieHumanMouth in Human
 * supplies their runtime values.
 */
export namespace IAutoMovieHumanMouthConstruction {
  /** What the head hands the mouth. */
  export interface IInputs {
    /** Height of the stomion. */
    stomion: number;

    /** Half the mouth's width, midline to cheilion. */
    width: number;

    /** Upper vermilion height. */
    upper: number;

    /** Lower vermilion height. */
    lower: number;

    /** Rest gap of the lips. */
    gap: number;

    /** Height of the subnasale. */
    subnasale: number;

    /** Height of the menton. */
    menton: number;

    /** Masculine (-1) to feminine (1). */
    sex: number;

    /** Forward place of the mandible's angles, the gonia. */
    gonion: number;

    /**
     * Height of the lips' contact line at a share of the half width from the
     * midline.
     */
    contact(u: number): number;

    /** Forward coordinate of the skin at a height and a lateral place. */
    front(y: number, z: number): number;
  }

  /** Mouth and the fissure cut into the skin. */
  export interface IOutput {
    /** The mouth. */
    mouth: IAutoMovieHumanOralAnatomy;

    /** The slit along the contact line, cut by position like the nostrils. */
    aperture: IAutoMovieHumanLoftAperture;
  }
}
