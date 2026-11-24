import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPropReader,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/** A named affordance of a kind on the prop, or a refusal. */
export function lieOnSurfaceSite(
  reader: IAutoMovieMotionHumanPropReader,
  id: string,
  kind: IAutoMovieAffordance["kind"],
): IAutoMovieAffordance {
  const found: IAutoMovieAffordance | undefined = reader.prop.affordances?.find(
    (a: IAutoMovieAffordance): boolean => a.id === id && a.kind === kind,
  );
  if (found === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: kind === "seat" ? "edge" : "surface",
      value: id,
      reason: `the prop declares no ${kind} named ${id}`,
      fix:
        kind === "seat"
          ? "name the bed's leftSide or rightSide edge"
          : "name the bed's lying surface",
    });
  return found;
}
