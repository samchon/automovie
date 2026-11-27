import {
  IAutoMovieSoftFurnishing,
  IAutoMovieValidation,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { AutoMovieEngineText } from "../../text/AutoMovieEngineText";
import { AutoMovieEngineViolationCollector } from "../../validation/AutoMovieEngineViolationCollector";

/*
 * Refuse duplicate typed furnishing bindings to the same world-space cloth
 * domain, independently of building grouping. Domain and furnishing ids use
 * code-unit order; source indices still identify the original conflicting
 * rows.
 */
export function validateSoftFurnishingDomainOwnership(
  furnishings: readonly IAutoMovieSoftFurnishing[],
): IAutoMovieValidation {
  const byDomain: Map<
    string,
    { furnishing: IAutoMovieSoftFurnishing; index: number }[]
  > = new Map<
    string,
    { furnishing: IAutoMovieSoftFurnishing; index: number }[]
  >();
  furnishings.forEach(
    (furnishing: IAutoMovieSoftFurnishing, index: number): void => {
      const owners: { furnishing: IAutoMovieSoftFurnishing; index: number }[] =
        byDomain.get(furnishing.domain) ?? [];
      owners.push({ furnishing, index });
      byDomain.set(furnishing.domain, owners);
    },
  );
  const out: IAutoMovieViolationCollector =
    new AutoMovieEngineViolationCollector();
  for (const domain of [...byDomain.keys()].sort(
    AutoMovieEngineText.compareCodeUnits,
  )) {
    const owners: { furnishing: IAutoMovieSoftFurnishing; index: number }[] =
      byDomain
        .get(domain)!
        .sort(
          (
            left: { furnishing: IAutoMovieSoftFurnishing; index: number },
            right: { furnishing: IAutoMovieSoftFurnishing; index: number },
          ): number => {
            const compared: number = AutoMovieEngineText.compareCodeUnits(
              left.furnishing.id,
              right.furnishing.id,
            );
            return compared !== 0 ? compared : left.index - right.index;
          },
        );
    const owner: { furnishing: IAutoMovieSoftFurnishing; index: number } =
      owners[0]!;
    for (const duplicate of owners.slice(1))
      out.push(
        "type",
        `$input.furnishings[${duplicate.index}].domain`,
        `soft body domain "${domain}" is already drawn by furnishing "${owner.furnishing.id}"`,
        domain,
      );
  }
  return out.toValidation();
}
