import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMoviePropSpec } from "../harness/IAutoMoviePropSpec";
import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieSpace } from "../scene/IAutoMovieSpace";

/**
 * A supplied model with optional source-local attachment and support records.
 *
 * @evidence contracts/development/design.md#principled-representation Geometry and anchors use the model's local metres. Optional support has its own explicit footprints and height rules in the same frame. The placed occurrence receives separate staged and model identities through the composer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Existing model, space and prop contracts provide the appearance and performance facts. The producer supplies model and node keys for optional prop registration.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The model alone supplies no support, space or interaction targets. An authored support requires an upright pose, and a sampled heightfield additionally requires translation without a turn.
 * @evidence contracts/development/common.md#meaningful-documentation States model-local units, the optional appearance and interaction contract, placement bounds and absent-value behavior.
 */
export interface IAutoMovieEnvironmentModel {
  /** Supplied model, including any authored or external geometry references. */
  model: IAutoMovieModel;

  /** Optional rigid frames in model-local metres, keyed by local anchor path. */
  anchors?: Readonly<Record<string, IAutoMovieTransform>>;

  /** Optional model-local support patches. Omission makes no support claim. */
  space?: IAutoMovieSpace;

  /** Optional prop registration, with scoped model and node supplied on placement. */
  prop?: Omit<IAutoMoviePropSpec, "node" | "model">;
}
