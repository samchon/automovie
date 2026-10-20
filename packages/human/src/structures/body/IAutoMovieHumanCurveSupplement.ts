import type { IAutoMovieHumanArmSupplement } from "./IAutoMovieHumanArmSupplement";
import type { IAutoMovieHumanFaceSupplement } from "../head/IAutoMovieHumanFaceSupplement";
import type { IAutoMovieHumanFootSupplement } from "./IAutoMovieHumanFootSupplement";
import type { IAutoMovieHumanHandSupplement } from "./IAutoMovieHumanHandSupplement";
import type { IAutoMovieHumanLegSupplement } from "./IAutoMovieHumanLegSupplement";
import type { IAutoMovieHumanPair } from "../common/IAutoMovieHumanPair";
import type { IAutoMovieHumanPelvisSupplement } from "./IAutoMovieHumanPelvisSupplement";
import type { IAutoMovieHumanTorsoSupplement } from "./IAutoMovieHumanTorsoSupplement";

/** Additional measured dimensions of the unloaded neutral rest body. Lengths are millimetres, angles degrees except fields ending Rad, and ratios dimensionless. Standing heights share the same standing-surface datum. Each field records a supplied physical dimension; no shape coefficients or control points are stored here.
 */
export interface IAutoMovieHumanCurveSupplement {
  /** Additional head, neck and facial dimensions. */
  face: IAutoMovieHumanFaceSupplement;

  /** Relaxed trunk dimensions and explicit T-rest shoulder conventions, independent of generated skin. */
  torso: IAutoMovieHumanTorsoSupplement;

  /** Independent left and right palm thickness. */
  handPair: IAutoMovieHumanPair<IAutoMovieHumanHandSupplement>;

  /** Left and right transverse dimensions supplementing the actual mechanical segment lengths. */
  armPair: IAutoMovieHumanPair<IAutoMovieHumanArmSupplement>;

  /** Additional pelvic section dimensions. */
  pelvis: IAutoMovieHumanPelvisSupplement;

  /** Independent left and right leg section dimensions. */
  legPair: IAutoMovieHumanPair<IAutoMovieHumanLegSupplement>;

  /** Independent left and right heel, arch, pad and toe measurements in each foot chart. */
  footPair: IAutoMovieHumanPair<IAutoMovieHumanFootSupplement>;
}
