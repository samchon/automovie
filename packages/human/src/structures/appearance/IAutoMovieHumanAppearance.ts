import { IAutoMovieHumanBrowAppearance } from "./IAutoMovieHumanBrowAppearance";
import { IAutoMovieHumanEyelash } from "./IAutoMovieHumanEyelash";
import { IAutoMovieHumanPair } from "../common/IAutoMovieHumanPair";
import { IAutoMovieHumanScalpHair } from "./IAutoMovieHumanScalpHair";
import { IAutoMovieHumanSkinAppearance } from "./IAutoMovieHumanSkinAppearance";
import { IAutoMovieHumanUnderwear } from "./IAutoMovieHumanUnderwear";

/**
 * How a person looks on the surface beyond who they are: skin finish, scalp hair, brows, lashes and underwear.
 *
 * Appearance is separate from {@link IAutoMovieHumanIdentity} because it changes without changing the person: hair is cut and dyed, underwear is changed. Constitutive pigmentation and every form stay in the identity. The fields are closed choices and named quantities; textures, strand curves and card layouts are generated from them.
 *
 * Clothing beyond basic underwear is out of scope, because the product renders prototypes that a diffusion lane may repaint; it reopens if the product contract admits garments with ease and drape.
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
