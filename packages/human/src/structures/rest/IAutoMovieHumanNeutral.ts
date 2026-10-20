import { IAutoMovieHumanNeutralAxial } from "./IAutoMovieHumanNeutralAxial";
import { IAutoMovieHumanNeutralNeck } from "./IAutoMovieHumanNeutralNeck";
import { IAutoMovieHumanNeutralOffset } from "./IAutoMovieHumanNeutralOffset";
import { IAutoMovieHumanNeutralSide } from "./IAutoMovieHumanNeutralSide";
import { IAutoMovieHumanNeutralTrunk } from "./IAutoMovieHumanNeutralTrunk";
import { IAutoMovieHumanPair } from "../common/IAutoMovieHumanPair";

/**
 * Physical measurements of one neutral figure, without a clinical-identity
 * conversion. Lengths and offsets are millimetres, mechanical directions use
 * degrees, +X is subject-left, +Y up and +Z anterior. The retained root
 * datum need not lie on the lowest exported vertex. A source-neutral A posture
 * is a rest configuration, not an observed tissue conversion to T posture.
 *
 * Inputs name mechanical supports, measurement sites and envelope dimensions;
 * they contain no mesh, curve, patch, fitted specimen controls or source indices.
 * Clinical stature, palpable landmarks, body composition and demographic traits
 * are not inferred from these geometric observations.
 */
export interface IAutoMovieHumanNeutral {
  /** The posture used for these measurements. */
  posture: "neutral-A";

  /** Root mechanical support above the unchanged model datum. */
  pelvis: IAutoMovieHumanNeutralOffset;

  /** Ordered axial chords, retaining their measured lengths and directions. */
  axial: IAutoMovieHumanNeutralAxial;

  /** Independent side-specific mechanical chains and section measurements. */
  limbPair: IAutoMovieHumanPair<IAutoMovieHumanNeutralSide>;

  /** Horizontal geometric stations, not renamed clinical chest/waist/hip sites. */
  trunk: IAutoMovieHumanNeutralTrunk;

  /** Simple bone-normal neck observations at the declared chord fractions. */
  neck: IAutoMovieHumanNeutralNeck;
}
