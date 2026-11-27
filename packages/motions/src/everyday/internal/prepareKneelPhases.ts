import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { kneelKeys } from "./kneelKeys";
import { prepareKneelFoot } from "./prepareKneelFoot";

/**
 * Prepare the two foot courses and fixed root line or seated-back arc for each
 * existing kneeling phase. The clock and body solves retain their owners.
 *
 * @param body The unchanged body used by every phase.
 * @param keys The immutable solved authored keys.
 * @param phases Ordered intervals indexing those keys.
 * @param clearance The original swinging-foot clearance, metres.
 * @param pivot The fixed knee pivot for seated-back arcs, world metres.
 * @param sitBack Whether the route includes the seated-back key at index four.
 * @returns Geometry readers in the same phase order, with no time state.
 */
export function prepareKneelPhases(
  body: IAutoMovieMotionHumanBody,
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
        phase.from !== phase.to && phase.from + phase.to <= 3
          ? undefined
          : sitBack && Math.max(phase.from, phase.to) === 4
            ? kneelKeys.prepareTurn(pivot, from.root, to.root)
            : Vector3.prepareLerp(from.root, to.root),
    };
  });
}

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
  feet: Record<AutoMovieHumanSide, ReturnType<typeof prepareKneelFoot>>;

  /**
   * The fixed line or seated-back arc, absent while the dynamic balance course
   * owns the root.
   */
  root?: (share: number) => IAutoMovieVector3;
}
