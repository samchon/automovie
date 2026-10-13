import { ViolationCollector } from "../validation/ViolationCollector";
import { IAutoMovieAnalysisSolid } from "./IAutoMovieAnalysisSolid";
import { validateSolidPlanes } from "./validateSolidPlanes";

/**
 *
 * Refuse a blocker that cannot bound anything.
 *
 * The rule is {@link validateSolidPlanes}, raised to a throw: an adapter reading
 * an authored shading solid has no honest result to return for a solid with no
 * faces, so it stops rather than producing one. Sharing the rule is what keeps
 * a neighbour's mass and the building's own canopy held to one standard.
 *
 * Throws an `Error` at the first blank id, the first id repeated within
 * `solids`, or the first plane violation of a solid, naming that solid and the
 * violation path. `label` names the kind of solid in every message and path, and
 * ids need to be unique only within this one list.
 *
 * @evidence contracts/common.md#principled-implementation Delegates plane checks to `validateSolidPlanes` and turns the first collected violation into an `Error`, so the context validator and the daylight adapter apply one rule in two failure styles.
 * @evidence contracts/common.md#clear-and-simple-design A throwing wrapper over the collecting validator plus an id set, because an analysis adapter has no partial result to return for a malformed shade.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reports only the first violation of the first malformed solid and drops the rest, since the throw ends the study either way; no solid id or label is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the shared rule, why it throws, which faults stop it, how `label` is used, and that uniqueness is per list.
 * @evidence contracts/performance.md#cost-and-resources Linear in solids plus their planes with one `Set` of ids; a fresh `ViolationCollector` per solid keeps each solid's first violation separate. Validates one list once per study, and no verdict is cached because each study passes its own shades. The id set and the per-solid collectors live only for the call.
 * @author Samchon
 */
export const assertAutoMovieAnalysisSolids = (
  solids: readonly IAutoMovieAnalysisSolid[],
  label: string,
): void => {
  const seen = new Set<string>();
  for (const solid of solids) {
    if (solid.id.trim().length === 0)
      throw new Error(`every ${label} must carry a non-blank id`);
    if (seen.has(solid.id))
      throw new Error(`${label} id "${solid.id}" is declared twice`);
    seen.add(solid.id);
    const out = new ViolationCollector();
    validateSolidPlanes(solid.planes, `${label}.planes`, label, out);
    const validated = out.toValidation();
    if (validated.success === false) {
      const first = validated.violations[0]!;
      throw new Error(
        `${label} "${solid.id}" is malformed at ${first.path}: ${first.expected}`,
      );
    }
  }
};
