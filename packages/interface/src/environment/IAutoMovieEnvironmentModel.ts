import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMoviePropSpec } from "../harness/IAutoMoviePropSpec";
import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieSpace } from "../scene/IAutoMovieSpace";

/** A supplied model with optional source-local attachment and support records. */
export interface IAutoMovieEnvironmentModel {
  /** Supplied model, including any authored or external geometry references. */
  model: IAutoMovieModel;

  /** Optional rigid frames in model-local metres, keyed by local anchor path. */
  anchors?: Readonly<Record<string, IAutoMovieTransform>>;

  /** Optional model-local support patches. Omission makes no support claim. */
  space?: IAutoMovieSpace;

  /**
   * Optional prop registration, with scoped model and node supplied on
   * placement.
   */
  prop?: Omit<IAutoMoviePropSpec, "node" | "model">;
}
