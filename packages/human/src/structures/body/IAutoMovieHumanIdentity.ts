import { IAutoMovieHumanBodyIdentity } from "./IAutoMovieHumanBodyIdentity";
import { IAutoMovieHumanComposition } from "./IAutoMovieHumanComposition";
import { IAutoMovieHumanHeadIdentity } from "../head/IAutoMovieHumanHeadIdentity";
import { IAutoMovieHumanPigmentation } from "../appearance/IAutoMovieHumanPigmentation";

/**
 * Clinical anthropometric, craniofacial, joint-mobility, composition and pigmentation inputs.
 *
 * Lengths are millimetres. Standing body measurements use the anthropometric posture: erect, heels together, arms hanging, palms toward the thighs and head in the Frankfort plane. Individual fields retain their specified seated, mobility and other acquisition protocols. Body landmarks follow ANSUR II (Gordon et al. 2014, NATICK/TR-15/007); facial landmarks follow the Farkas nomenclature used by 3D Facial Norms (Weinberg et al. 2016, Cleft Palate Craniofac J 53(6):e185-e197). Left and right measurements remain independent.
 */
export interface IAutoMovieHumanIdentity {
  /** Trunk, limbs and body landmarks. */
  body: IAutoMovieHumanBodyIdentity;

  /** Cranial vault and face frame. */
  head: IAutoMovieHumanHeadIdentity;

  /** Fat and lean mass, which decide surface relief and where volume sits. */
  composition: IAutoMovieHumanComposition;

  /** Skin and iris pigmentation. */
  pigmentation: IAutoMovieHumanPigmentation;
}
