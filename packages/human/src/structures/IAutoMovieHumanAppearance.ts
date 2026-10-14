import { tags } from "typia";

import { AutoMovieHumanHairColor } from "./AutoMovieHumanHairColor";

/**
 * How a person looks on the surface beyond who they are: skin finish, scalp hair, brows, lashes and underwear.
 *
 * Appearance is separate from {@link IAutoMovieHumanIdentity} because it changes without changing the person: hair is cut and dyed, underwear is changed. Constitutive pigmentation and every form stay in the identity. The fields are closed choices and named quantities; textures, strand curves and card layouts are generated from them.
 *
 * Clothing beyond basic underwear is out of scope, because the product renders prototypes that a diffusion lane may repaint; it reopens if the product contract admits garments with ease and drape.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanAppearance {
  /** Document version. Saved documents of another version are not migrated. */
  version: 1;

  /** Skin surface finish. */
  skin: IAutoMovieHumanAppearance.ISkin;

  /** Scalp hair. */
  hair: IAutoMovieHumanAppearance.IHair;

  /** Eyebrows. */
  brows: IAutoMovieHumanAppearance.IBrows;

  /** Eyelashes. */
  lashes: IAutoMovieHumanAppearance.ILashes;

  /** Underwear. */
  underwear: IAutoMovieHumanAppearance.IUnderwear;
}
export namespace IAutoMovieHumanAppearance {
  /**
   * Skin surface finish on top of the identity's pigmentation.
   *
   * @author Samchon
   */
  export interface ISkin {
    /**
     * Surface oil, from dry (0) to oily (1), dimensionless; it weights the specular sheen of the skin, after the oiliness parameter of Donner and Jensen (2006, Eurographics Symposium on Rendering).
     */
    oiliness: number & tags.Minimum<0> & tags.Maximum<1>;
  }

  /**
   * Scalp hair as length, curl, colour and hairline.
   *
   * @author Samchon
   */
  export interface IHair {
    /** Hair colour. */
    color: AutoMovieHumanHairColor;

    /**
     * Length of the longest scalp hair from the scalp to the tip, straightened, millimetres; zero is a shaved scalp.
     */
    length: number & tags.Minimum<0> & tags.Maximum<1500>;

    /**
     * Curl pattern as one of the eight L'Oréal types, from straight (I) to tightly coiled (VIII), defined by curve diameter, curl index, waves and twists (as reviewed by Callender et al. 2026, J Cosmet Dermatol 25(4):e70828).
     */
    curl: "I" | "II" | "III" | "IV" | "V" | "VI" | "VII" | "VIII";

    /**
     * Shape of the anterior hairline: `round` is a smooth concave contour; `mShaped` has marked recession at the temples; `rectangular` is a horizontal frontal margin with mild recession; `bellShaped` raises the midline point; `triangular` descends almost straight from the central forehead to the temples.
     */
    hairline: "round" | "mShaped" | "rectangular" | "bellShaped" | "triangular";
  }

  /**
   * Eyebrows; their position follows the brow ridge of the identity.
   *
   * @author Samchon
   */
  export interface IBrows {
    /** Brow hair colour. */
    color: AutoMovieHumanHairColor;
  }

  /**
   * Eyelashes along the lid margins.
   *
   * @author Samchon
   */
  export interface ILashes {
    /** Lash colour. */
    color: AutoMovieHumanHairColor;

    /**
     * Length of the longest upper lash, millimetres; natural lashes rarely exceed 12 mm (Aumond and Bitton 2018, J Optom 11(4):211-222).
     */
    length: number & tags.Minimum<0> & tags.Maximum<15>;
  }

  /**
   * Basic underwear, as a lower and an upper garment and one colour.
   *
   * A converter defaults it by sex: briefs for a male person, briefs and a bra for a female person. `none` on both is a package choice for inspection; the viewer offers styles and colours, not `none`.
   *
   * @author Samchon
   */
  export interface IUnderwear {
    /** Lower garment. */
    bottom: "none" | "briefs" | "boxerBriefs";

    /** Upper garment. */
    top: "none" | "bra";

    /** Garment colour as an sRGB hex `#RRGGBB`. */
    color: string & tags.Pattern<"^#[0-9A-Fa-f]{6}$">;
  }
}
