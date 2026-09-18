import { IAutoMovieSoftFurnishing, IAutoMovieValidation } from "@automovie/interface";
import { ViolationCollector } from "../validation/ViolationCollector";
import { compareCodeUnits } from "../text/compareCodeUnits";

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
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-collision-clearance Refuses multiple furnishing bindings that would draw and charge one soft domain more than once.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Enforces one production-wide furnishing owner for each world-space soft-body domain.
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
