import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyBasisBuilder,
  createHumanBodySegmenter,
} from "@automovie/human";

import {
  type IBodyCorrectiveState,
  bodyCorrectiveDocument,
} from "./bodyCorrectiveState";
import { createBodyCorrectiveWorld } from "./bodyCorrectiveWorld";
import {
  type IBodyContactPair,
  readBodyContacts,
} from "./readBodyContacts";

/** A state whose posed body crosses itself. */
export interface IBodyCrossingFinding {
  name: string;
  document: {
    shape: Record<string, number>;
    pose: IBodyCorrectiveState["pose"];
  };

  /** The crossing pairs and how many triangles of each side they pierce. */
  pairs: IBodyContactPair[];
}

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
): { findings: IBodyCrossingFinding[]; refused: { name: string; reason: string }[] } {
  const world = createBodyCorrectiveWorld(basis);
  const build = createHumanBodyBasisBuilder(basis);
  const segment = createHumanBodySegmenter(basis);
  const findings: IBodyCrossingFinding[] = [];
  const refused: { name: string; reason: string }[] = [];
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
        document: { shape: state.shape, pose: state.pose },
        pairs,
      });
  }
  return { findings, refused };
}
