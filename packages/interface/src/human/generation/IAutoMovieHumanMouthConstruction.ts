import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanOralAnatomy } from "./IAutoMovieHumanOralAnatomy";

/**
 * Mouth construction inputs and the combined oral-anatomy/aperture result.
 *
 * The interface package owns these declarations; AutoMovieHumanMouth in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Mouth construction inputs and the combined oral-anatomy/aperture result. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IInputs, IOutput declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IInputs, IOutput separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanMouth exchanges the named IInputs, IOutput contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanMouthConstruction {
  /** What the head hands the mouth.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the head hands the mouth.
   * @evidence contracts/development/design.md#principled-representation `stomion`: Height of the stomion. `width`: Half the mouth's width, midline to cheilion. `upper`: Upper vermilion height.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanMouth.create, AutoMovieHumanMouth.aperture.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `stomion`, `width`, `upper`, `lower`, `gap`, `subnasale`, `menton`, `sex`, `gonion`; callers supply the complete record.
   */
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
     * Height of the lips' contact line at a share of the half width from the midline.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Height of the lips' contact line at a share of the half width from the midline.
     */
    contact(u: number): number;

    /**
     * Forward coordinate of the skin at a height and a lateral place.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Forward coordinate of the skin at a height and a lateral place.
     */
    front(y: number, z: number): number;
  }

  /** Mouth and the fissure cut into the skin.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Mouth and the fissure cut into the skin.
   * @evidence contracts/development/design.md#principled-representation `mouth`: The mouth. `aperture`: The slit along the contact line, cut by position like the nostrils.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanMouth.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `mouth`, `aperture`; callers supply the complete record.
   */
  export interface IOutput {
    /** The mouth. */
    mouth: IAutoMovieHumanOralAnatomy;

    /** The slit along the contact line, cut by position like the nostrils. */
    aperture: IAutoMovieHumanLoftAperture;
  }
}
