import type { IAutoMovieHumanPair } from "../IAutoMovieHumanPair";
import type { IAutoMovieHumanBrowAppearance } from "./IAutoMovieHumanBrowAppearance";
import type { IAutoMovieHumanEyelash } from "./IAutoMovieHumanEyelash";
import type { IAutoMovieHumanScalpHair } from "./IAutoMovieHumanScalpHair";
import type { IAutoMovieHumanSkinAppearance } from "./IAutoMovieHumanSkinAppearance";
import type { IAutoMovieHumanUnderwear } from "./IAutoMovieHumanUnderwear";

/**
 * How a person looks on the surface beyond who they are: skin finish, scalp
 * hair, brows, lashes and underwear.
 *
 * Appearance is separate from {@link IAutoMovieHumanIdentity} because it changes
 * without changing the person: hair is cut and dyed, underwear is changed.
 * Constitutive pigmentation and anatomical form stay in the identity. These
 * fields describe surface choices and quantities rather than textures, strand
 * curves or card layouts.
 *
 * Clothing beyond basic underwear is out of scope, because the product renders
 * prototypes that a diffusion lane may repaint; it reopens if the product
 * contract admits garments with ease and drape.
 */
export interface IAutoMovieHumanAppearance {
  /** Skin surface finish. */
  skin: IAutoMovieHumanSkinAppearance;

  /** Scalp hair. */
  hair: IAutoMovieHumanScalpHair;

  /** Eyebrows. */
  browPair: IAutoMovieHumanPair<IAutoMovieHumanBrowAppearance>;

  /** Eyelashes. */
  lashPair: IAutoMovieHumanPair<IAutoMovieHumanEyelash>;

  /** Underwear. */
  underwear: IAutoMovieHumanUnderwear;
}
