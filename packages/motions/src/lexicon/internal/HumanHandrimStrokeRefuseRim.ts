import type { AutoMovieHumanSide } from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/*
 * Refuse a wheel selection without a usable circumferential material point.
 */
export function HumanHandrimStrokeRefuseRim(
  on: string,
  rim: string,
  side: AutoMovieHumanSide,
): never {
  throw new HumanRefusal({
    kind: "affordance",
    axis: `rims.${side}`,
    value: rim,
    feasible: null,
    reason: `${on} has no eligible moving contact on rim ${rim}`,
    fix: "name a distinct wheel rim with a radial material-point reader",
  });
}
