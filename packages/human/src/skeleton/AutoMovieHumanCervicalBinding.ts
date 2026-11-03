import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";

/**
 * The cervical region: the cut between the chest and the neck, whose segment
 * runs up to the head's joint.
 *
 * The neck's skin is read a third of the way up (the girth radius), since
 * lower it flares into the shoulders and higher it meets the jaw. Its
 * segment's end is the head's joint, not a child of its own: the atlas folds
 * into the neck bone, so the neck's capsule reaches to the skull's base.
 */
export namespace AutoMovieHumanCervicalBinding {
  /** The region of the `neck` joint. */
  export const region: IAutoMovieHumanBindingRegion = {
    name: "cervical",
    bones: /^neck$/,
    end: (input: IAutoMovieHumanBindingRegion.IEndInput) => input.at("head"),
  };
}
