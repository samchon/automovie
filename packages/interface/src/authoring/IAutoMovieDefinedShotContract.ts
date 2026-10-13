import { IAutoMovieShotContract } from "../production/IAutoMovieShotContract";

/**
 * Contract fields embedded in a shot registration rather than its source
 * pointer.
 */
export type IAutoMovieDefinedShotContract = Omit<
  IAutoMovieShotContract,
  "id" | "source"
>;
