import type { stageScene } from "@automovie/engine";
import type {
  IAutoMovieStageLight,
  IAutoMovieValidation,
} from "@automovie/interface";

/**
 * Existing staging and refusal readers carried into the light boundary assertion group; runtime malformed writes reach the product validator through the owning entry's explicit ingress cast.
 *
 * @author Samchon
 */
export interface IFilmStageLightBoundaryInputs {
  /** Stage the original duel with the supplied light list. */
  stageLights(lights: IAutoMovieStageLight[]): ReturnType<typeof stageScene>;

  /** Read the same staging result as its original validation envelope. */
  failure(staged: ReturnType<typeof stageScene>): IAutoMovieValidation;
}
