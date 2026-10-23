import type { IAutoMovieModelPart } from "@automovie/interface";

import type { IAutoMovieHumanPair } from "../structures/common/IAutoMovieHumanPair";

/**
 * Body facts that Human appearance consumes from the neutral body
 * generator: where each eye globe sits, and the generated parts whose head
 * skin scalp hair attaches to. Appearance never moves the body; it only
 * reads these frames and measures that skin.
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

  /**
   * Generated body parts in model metres, only read. Scalp hair reads the
   * head and ear skin (`human.skin.head/<k>`, `human.skin.head.<sub>/<k>`,
   * `human.skin.ear.<sub>/<k>`) to attach roots and keep strands outside it.
   */
  parts: IAutoMovieModelPart[];
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

    /**
     * Radius in metres of a sphere about `centre` fitted to the observed
     * anterior eye surface (sclera and cornea inside the eye opening), the
     * surface the lids were built against. Given, the biometric globe is
     * moved along `forward` until its anterior surface best matches that
     * sphere where the opening shows it, so the lid margins meet the globe;
     * `centre` is then the fitted sphere's centre, not the globe's.
     * Omitted, `centre` is the globe's own centre.
     */
    radius?: number;
  }
}
