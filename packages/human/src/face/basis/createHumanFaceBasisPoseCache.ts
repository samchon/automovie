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
 * It consumes the admitted channel weights; the basis and weight admission
 * stage retain the channel identities, ranges and dependencies. Comparing
 * these values does not certify independent anatomical traits or their ranges.
 *
 * @evidence contracts/common.md#principled-implementation The pose is a pure function of the admitted weights (shape channels included), so retaining the last result and replacing it whenever any weight in channel order changes is exact memoization; omission and an explicit zero compare equal because both read as 0.
 * @evidence contracts/common.md#clear-and-simple-design One retained entry keyed by the ordered weight vector; no eviction policy or option.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No test-only or subject-specific logic; a changed weight always recomputes.
 * @evidence contracts/common.md#meaningful-documentation States the key, why omission equals zero, and that cached outputs must be treated as read-only.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping createHumanFaceBasisPoseCache is a pure computation and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry createHumanFaceBasisPoseCache decides no primitive population of a form.
 * @evidenceExclude contracts/modeling.md#shared-boundaries createHumanFaceBasisPoseCache constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation createHumanFaceBasisPoseCache owns no part, group or joint that a viewer displays; its consumers own the observation.
 * @evidenceExclude contracts/modeling.md#spatial-conventions createHumanFaceBasisPoseCache keeps the caller's unit and frame and converts nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source createHumanFaceBasisPoseCache carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range createHumanFaceBasisPoseCache admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority createHumanFaceBasisPoseCache defines no input through which a caller shapes a human form.
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
