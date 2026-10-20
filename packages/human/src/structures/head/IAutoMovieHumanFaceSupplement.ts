import type { IAutoMovieHumanEarSupplement } from "./IAutoMovieHumanEarSupplement";
import type { IAutoMovieHumanEyeSupplement } from "./IAutoMovieHumanEyeSupplement";
import type { IAutoMovieHumanJawSupplement } from "./IAutoMovieHumanJawSupplement";
import type { IAutoMovieHumanMouthSupplement } from "./IAutoMovieHumanMouthSupplement";
import type { IAutoMovieHumanNeckSupplement } from "./IAutoMovieHumanNeckSupplement";
import type { IAutoMovieHumanNoseSupplement } from "./IAutoMovieHumanNoseSupplement";
import type { IAutoMovieHumanPair } from "../common/IAutoMovieHumanPair";

/** Supplemental head, neck and facial dimensions. */
export interface IAutoMovieHumanFaceSupplement {
  /** Unloaded neck section dimensions. */
  neck: IAutoMovieHumanNeckSupplement;

  /** Relative chin and sublabial dimensions in the head measurement chart, not world landmarks. */
  jaw: IAutoMovieHumanJawSupplement;

  /** Independent nasal section dimensions. */
  nose: IAutoMovieHumanNoseSupplement;

  /** Relative lip and philtrum dimensions. */
  mouth: IAutoMovieHumanMouthSupplement;

  /** Independent eyelid support dimensions for the left and right sides. */
  eyePair: IAutoMovieHumanPair<IAutoMovieHumanEyeSupplement>;

  /** Anterior radius of the medial eye support, mm. */
  eyeSupportAnteriorRadiusMm: number;

  /** Independent auricular dimensions; rotations use the head measurement chart. */
  earPair: IAutoMovieHumanPair<IAutoMovieHumanEarSupplement>;
}
