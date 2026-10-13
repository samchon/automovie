import { ViolationCollector } from "../validation/ViolationCollector";
import { IAutoMovieAnalysisSolid } from "./IAutoMovieAnalysisSolid";
import { validateSolidPlanes } from "./validateSolidPlanes";

/**
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
