import type {
  IAutoMovieGait,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieModelPartPoints,
} from "@automovie/interface";

import { autoMovieModelGaits } from "../internal/autoMovieModelGaits";
import { autoMovieModelPartMatrices } from "../internal/autoMovieModelPartMatrices";
import { autoMovieModelPartPoints } from "../internal/autoMovieModelPartPoints";

/** Reads the motion repertoire and rest-frame geometry of an admitted model. */
export namespace AutoMovieEngineModel {
  /**
   * The gaits one runtime model can perform, in the order its profiles declare
   * them.
   *
   * The first profile that declares any owns the repertoire, which keeps the
   * choice in the model, where an author already orders them, instead of in
   * whichever consumer asked first. It lives here rather than beside the bake
   * because two consumers need the same answer for opposite reasons: the viewer
   * bakes a table per declared gait, and the formation-motion validator refuses a
   * cue calling for a gait that is not among them. Two spellings of "what can
   * this figure do" is how a production compiles clean and then fails to draw.
   *
   * Returns the profile's own `gaits` array, not a copy, so callers must not
   * mutate it. A model with no profiles, or whose profiles declare no gaits,
   * yields an empty array. Later profiles' gaits are ignored even when they
   * declare different ones.
   *
   * @param model Runtime model whose profiles are read.
   * @returns The first non-empty profile gait list, or an empty array.
   */
  export function gaits(
    model: Pick<IAutoMovieModel, "profiles">,
  ): readonly IAutoMovieGait[] {
    return autoMovieModelGaits(model);
  }

  /**
   * The column-major matrix that carries each part's local geometry into the
   * model's own frame, or `null` for a part already authored in it.
   *
   * A part's own transform is applied first; a part attached to a bone the
   * skeleton's rest pose resolves is then carried by that bone's world rest
   * placement (position and rotation, unit scale). A bone the rest pose does not
   * resolve leaves its part unattached. `null` marks a part with no transform and
   * no resolved bone, so a caller can keep its coordinates bit for bit instead of
   * multiplying by an identity. The rest pose is resolved at most once, and only
   * when some part is attached. Units are model metres.
   *
   * @param model Model whose parts are placed.
   * @returns One entry per part object of `model.parts`, in part order.
   */
  export function partMatrices(
    model: IAutoMovieModel,
  ): Map<IAutoMovieModelPart, number[] | null> {
    return autoMovieModelPartMatrices(model);
  }

  /**
   * Every vertex of every part of one model, placed in the model's own frame.
   *
   * A primitive part is tessellated by the engine's kernel and a mesh part read
   * as stated; each vertex is moved by the part's own transform and, for a part
   * attached to a bone of the model's skeleton, then by that bone's world rest
   * placement (position and rotation, unit scale). A bone the rest pose does not
   * resolve leaves its parts unattached. Positions are read as whole `x, y, z`
   * triples and a trailing partial triple is ignored. Units are model metres.
   *
   * The rest pose is resolved at most once per call, on the first attached part.
   * `parts` is keyed by the part objects of `model.parts`, in part order, and
   * `all` holds every part's points concatenated in that order.
   *
   * @param model Model whose parts are placed.
   * @returns Each part's model-frame points, and all of them together.
   */
  export function partPoints(model: IAutoMovieModel): IAutoMovieModelPartPoints.IResult {
    return autoMovieModelPartPoints(model);
  }
}
