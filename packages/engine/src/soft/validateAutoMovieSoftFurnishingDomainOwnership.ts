import {
  IAutoMovieSoftFurnishing,
  IAutoMovieValidation,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";

/**
 * Refuse two furnishings that draw the same world-space soft-body domain.
 *
 * The ownership check is independent of building grouping. A domain is one
 * panel in world coordinates, so binding it into a second environment still
 * draws the same cloth twice. Domains and furnishing ids are processed in
 * code-unit order; input array order can change only the reported source index,
 * never which furnishing is the deterministic owner or how findings are
 * ordered.
 *
 * @author Samchon
 */
export const validateAutoMovieSoftFurnishingDomainOwnership = (
  furnishings: readonly IAutoMovieSoftFurnishing[],
): IAutoMovieValidation => {
  const byDomain = new Map<
    string,
    { furnishing: IAutoMovieSoftFurnishing; index: number }[]
  >();
  furnishings.forEach((furnishing, index) => {
    const owners = byDomain.get(furnishing.domain) ?? [];
    owners.push({ furnishing, index });
    byDomain.set(furnishing.domain, owners);
  });
  const out = new ViolationCollector();
  for (const domain of [...byDomain.keys()].sort(compareCodeUnits)) {
    const owners = byDomain.get(domain)!.sort((left, right) => {
      const compared = compareCodeUnits(
        left.furnishing.id,
        right.furnishing.id,
      );
      return compared !== 0 ? compared : left.index - right.index;
    });
    const owner = owners[0]!;
    for (const duplicate of owners.slice(1))
      out.push(
        "type",
        `$input.furnishings[${duplicate.index}].domain`,
        `soft body domain "${domain}" is already drawn by furnishing "${owner.furnishing.id}"`,
        domain,
      );
  }
  return out.toValidation();
};

/** Code-unit order without locale-dependent collation. */
const compareCodeUnits = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;
