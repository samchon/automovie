import type { IAutoMovieHumanPair } from "../structures/common/IAutoMovieHumanPair";

/**
 * Body facts that Human appearance consumes from the neutral body
 * generator: where each eye globe sits. Appearance never measures or moves
 * the body itself; the body generator owns these frames, and every
 * appearance part is placed from them.
 *
 * Positions are model units (metres) in the registered frame (forward +X,
 * up +Y, lateral +Z toward the person's left), after the body's stature
 * scale, so appearance parts land on the body exactly as rendered.
 */
export interface IAutoMovieHumanAppearanceBody {
  /**
   * Globe frame of each eye. The lids and the eye opening of the head skin
   * are expected to wrap the globe that {@link IAutoMovieHumanAppearanceBody.IEye}
   * places, sized by `AutoMovieHumanEyeball.dimensions`.
   */
  eyePair: IAutoMovieHumanPair<IAutoMovieHumanAppearanceBody.IEye>;
}

export namespace IAutoMovieHumanAppearanceBody {
  /** Rest frame of one eye globe. */
  export interface IEye {
    /** Centre of the globe (the centre of its scleral ellipsoid), metres. */
    centre: [number, number, number];

    /** Unit primary-gaze direction; the corneal apex lies along it. */
    forward: [number, number, number];

    /** Unit vertical direction of the globe, orthogonal to `forward`. */
    up: [number, number, number];
  }
}
