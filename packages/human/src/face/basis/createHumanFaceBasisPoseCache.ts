import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import { humanFaceBasisWeights } from "./humanFaceBasisWeights";

/**
 * Retain one posed foundation across appearance-only edits. The channel list
 * fixes comparison order; omission and an explicit zero describe the same
 * rest pose. Corrective activation, joint motion and contact are functions of
 * these admitted weights, so any changed weight replaces the retained result.
 * The evaluator receives the shape record because reference aperture closure
 * measures the same identity; it may cache only outputs that downstream
 * appearance, hair, observer and renderer consumers treat as read-only.
 */
export function createHumanFaceBasisPoseCache<T>(
  channels: readonly Pick<IAutoMovieHumanFaceBasis["channels"][number], "id">[],
  evaluate: (
    state: ReturnType<typeof humanFaceBasisWeights>,
    shape: IAutoMovieHumanFaceBasisDocument["shape"],
  ) => T,
): (
  state: ReturnType<typeof humanFaceBasisWeights>,
  shape: IAutoMovieHumanFaceBasisDocument["shape"],
) => T {
  const ids = channels.map((channel) => channel.id);
  let last: { weights: number[]; result: T } | undefined;
  return (state, shape) => {
    const weights = ids.map((id) => state.weights.get(id) ?? 0);
    if (
      last === undefined ||
      last.weights.some((weight, index) => weight !== weights[index])
    )
      last = { weights, result: evaluate(state, shape) };
    return last.result;
  };
}
