import type { IAutoMovieHumanBodyBuild } from "@automovie/human/body/structures/IAutoMovieHumanBodyBuild";

import { bodyCorrectiveDocument } from "./bodyCorrectiveDocument";
import type { IBodyCorrectiveSampleInput } from "./IBodyCorrectiveSampleInput";
import { readBodyCorrectiveShoulderRest } from "./readBodyCorrectiveShoulderRest";

/**
 * Build a corrective sample with the current shape's rest authority.
 * The actual solver calls this owner. Fractional TT samples first read a
 * native-rest build at the same shape fraction through the same compiled
 * builder, then pass those rests to the complete-orientation document owner.
 * Endpoints and non-TT states need no extra build. A refused rest/sample is
 * propagated, never replaced with a clear geometry result.
 *
 * @evidence contracts/common.md#principled-implementation Current shape, compiled candidate and rest readout remain one source for fractional TT goals.
 * @evidence contracts/common.md#clear-and-simple-design One conditional separates endpoint/legacy construction from two-stage TT sampling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/refused shaped rest is not replaced by fixed metadata or an empty collision list.
 * @evidence contracts/common.md#meaningful-documentation Identifies the actual solver caller, extra build cost, ownership and refusal behavior.
 */
export function buildBodyCorrectiveSample(input: IBodyCorrectiveSampleInput): IAutoMovieHumanBodyBuild {
  const rest = input.state.shoulders !== undefined && input.state.shoulders.length > 0 && input.t !== 0 && input.t !== 1
    ? readBodyCorrectiveShoulderRest(input.build(bodyCorrectiveDocument(input.world, input.state, 0, input.u, input.basis)))
    : [];
  return input.build(bodyCorrectiveDocument(input.world, input.state, input.t, input.u, input.basis, rest));
}
