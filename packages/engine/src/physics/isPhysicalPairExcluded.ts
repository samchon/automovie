import type { IAutoMovieContactReceipt } from "@automovie/interface";

import type { AutoMoviePhysicalSimulation } from "./AutoMoviePhysicalSimulation";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { isPhysicalProfilePairExcluded } from "./isPhysicalProfilePairExcluded";

/** Resolve only provider-declared overlapping pivot neighbours, never all self contact. */
export function isPhysicalPairExcluded(
  input: AutoMoviePhysicalSimulation.IInput,
  bound: Bound,
  first: number,
  second: number,
): boolean {
  const a: IAutoMovieContactReceipt["a"] | undefined =
    bound.colliders.get(first);
  const b: IAutoMovieContactReceipt["a"] | undefined =
    bound.colliders.get(second);
  return (
    !!a &&
    !!b &&
    a.body === b.body &&
    isPhysicalProfilePairExcluded(
      input.bodies.find(
        (body: (typeof input.bodies)[number]): boolean => body.id === a.body,
      )!.profile,
      a.bone,
      b.bone,
    )
  );
}
