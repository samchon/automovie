import { createHumanBodyBasisBuilder } from "@automovie/human/body/basis/createHumanBodyBasisBuilder";
import { createHumanBodySegmenter } from "@automovie/human/body/measure/createHumanBodySegmenter";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import type { IBodyCorrectiveState } from "./IBodyCorrectiveState";
import type { IBodyCrossingFinding } from "./IBodyCrossingFinding";
import type { IBodyCrossingRefusal } from "./IBodyCrossingRefusal";
import type { IBodyCrossings } from "./IBodyCrossings";
import { bodyCorrectiveDocument } from "./bodyCorrectiveDocument";
import { createBodyCorrectiveWorld } from "./createBodyCorrectiveWorld";
import { type IBodyContactPair, readBodyContacts } from "./readBodyContacts";

/**
 * The census instrument for a list of states: pose each through the public
 * builder, split the skin into dominant-bone segments and keep the states
 * that cross.
 *
 * The rest pose of an admitted basis crosses on no pair (admission refuses a
 * neutral skin that crosses itself), so every crossing pair of a posed state
 * is one the pose made. A state the builder refuses (a pose past a range, a
 * shape past an envelope) is skipped and named in `refused` with the builder's
 * message: refusing is the builder's answer, not a crossing. `visit` sees
 * every state once with its pairs, or the refusal, for progress output.
 */
export function findBodyCrossings(
  basis: IAutoMovieHumanBodyBasis,
  states: IBodyCorrectiveState[],
  visit: (
    state: IBodyCorrectiveState,
    found: IBodyContactPair[] | string,
  ) => void = () => undefined,
): IBodyCrossings {
  const world = createBodyCorrectiveWorld(basis);
  const build = createHumanBodyBasisBuilder(basis);
  const segment = createHumanBodySegmenter(basis);
  const findings: IBodyCrossingFinding[] = [];
  const refused: IBodyCrossingRefusal[] = [];
  for (const state of states) {
    let pairs: IBodyContactPair[];
    try {
      pairs = readBodyContacts(
        segment(build(bodyCorrectiveDocument(world, state, 1, 1, basis.id))),
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      refused.push({ name: state.name, reason });
      visit(state, reason);
      continue;
    }
    visit(state, pairs);
    if (pairs.length > 0)
      findings.push({
        name: state.name,
        document: {
          shape: { ...state.shape },
          pose: state.pose.map((joint) => ({ ...joint })),
          ...(state.shoulders === undefined
            ? {}
            : { shoulders: state.shoulders.map((goal) => ({ ...goal })) }),
        },
        pairs,
      });
  }
  return { findings, refused };
}
