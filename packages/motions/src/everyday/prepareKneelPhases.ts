import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { kneelKeys } from "./kneelKeys";
import { prepareKneelFoot } from "./prepareKneelFoot";

/** Fixed key indices for one existing kneeling clock interval. */
interface IPair {
  /** The starting key's index. */
  from: number;

  /** The destination key's index. */
  to: number;
}

/** Body-derived geometry prepared for one kneeling interval. */
interface IPhase {
  /** Each foot's unchanged pivot/arc owner. */
  feet: Record<"left" | "right", ReturnType<typeof prepareKneelFoot>>;

  /** The seated-back root arc, absent for the original linear/root-course phases. */
  root?: ReturnType<typeof kneelKeys.prepareTurn>;
}

/**
 * Prepare the two foot courses and optional seated-back root arc for each
 * existing kneeling phase. The clock and body solves retain their owners.
 *
 * @param body The unchanged body used by every phase.
 * @param keys The immutable solved authored keys.
 * @param phases Ordered intervals indexing those keys.
 * @param clearance The original swinging-foot clearance, metres.
 * @param pivot The fixed knee pivot for seated-back arcs, world metres.
 * @param sitBack Whether the route includes the seated-back key at index four.
 * @returns Geometry readers in the same phase order, with no time state.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed inputs, world-metre geometry, index-four route premise and ordered phase readers, leaving clocks and solves with their owners.
 * @evidence contracts/development/implementation.md#principled-implementation Delegates unchanged foot movement classification/pivots/arcs to prepareKneelFoot and the original max(from,to)===4 seated-back root arc to kneelKeys.prepareTurn.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass prepares each existing phase's two feet and only its demanded root arc.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No phase, key, movement threshold, contact rule, root condition, clearance or progress is changed; other root courses remain in the kneeling law.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(N) bounded geometry preparation for N phases removes fixed foot/arc work from time queries; each query retains the two original foot evaluations and its actual root interpolation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Body, authored key records, pivot and clearance remain fixed for this plan, so their geometry is equivalent throughout each interval; time and output poses remain independent inputs.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns N two-foot readers and only its seated-back arc readers until release; no query history, solver workspace or fitted pose is retained here.
 */
export function prepareKneelPhases(
  body: IHumanBody,
  keys: readonly kneelKeys.IKey[],
  phases: readonly IPair[],
  clearance: number,
  pivot: IAutoMovieVector3,
  sitBack: boolean,
): IPhase[] {
  return phases.map((phase: IPair): IPhase => {
    const from: kneelKeys.IKey = keys[phase.from]!;
    const to: kneelKeys.IKey = keys[phase.to]!;
    return {
      feet: {
        left: prepareKneelFoot(
          body,
          "left",
          from.feet.left,
          to.feet.left,
          clearance,
        ),
        right: prepareKneelFoot(
          body,
          "right",
          from.feet.right,
          to.feet.right,
          clearance,
        ),
      },
      root:
        sitBack && Math.max(phase.from, phase.to) === 4
          ? kneelKeys.prepareTurn(pivot, from.root, to.root)
          : undefined,
    };
  });
}
