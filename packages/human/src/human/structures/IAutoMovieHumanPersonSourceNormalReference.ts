import type { IAutoMovieHumanPersonPerformedSkin } from "./IAutoMovieHumanPersonPerformedSkin";

/**
 * The final mouthClose-zero reference skin normal transport starts from: a
 * performed skin of the same shape, pose and body build, labelled with the
 * source generation it was evaluated under.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceNormalReference extends IAutoMovieHumanPersonPerformedSkin {
  /** Source generation the reference skin was evaluated under. */
  generation: string;
}
