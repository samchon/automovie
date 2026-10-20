import {
  IAutoMovieConstraintViolation,
  IAutoMovieValidation,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { IAutoMovieAnalysisSolid } from "./IAutoMovieAnalysisSolid";
import { validateSolidPlanes } from "./validateSolidPlanes";

/**
 * Refuse malformed blocker identifiers and half-space fields.
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
 * Plane count and finite fields do not prove the intersection bounded or nonempty; validateSolidPlanes deliberately leaves those geometric properties unchecked.
 *
 * @param solids Authored convex blockers, checked in list order.
 * @param label Kind of solid named in messages and paths, such as `shading solid`.
 *
 * @evidence contracts/common.md#principled-implementation Checks id blankness and uniqueness with a `Set`, delegates the plane rule to `validateSolidPlanes` with a fresh collector per solid, and turns that solid's first violation into an `Error`, so the context validator and the daylight request apply one rule in two failure styles.
 * @evidence contracts/common.md#clear-and-simple-design A thin throwing adapter over the accumulating rule; the plane checks stay in `validateSolidPlanes`, and only the id rules, which a context validator states separately for occluders, live here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reports only the first violation of the first malformed solid because the throw ends the study either way, and no solid id or label is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the shared rule and why it throws, the three throwing faults and what the message names, how `label` is used, and that uniqueness is per list.
 * @evidence contracts/performance.md#efficient-algorithms Linear in solids N plus their planes P with one `Set` of ids, O(N + ΣP); the per-solid collector keeps each solid's violations separate so the first one names the right solid.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Validates one caller list once per study; no verdict is cached because each study passes its own shades.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The id set holds at most N ids and each collector lives for one solid's iteration; all are released when the call returns or throws, and nothing is retained.
 */
export const assertAutoMovieAnalysisSolids: (
  solids: readonly IAutoMovieAnalysisSolid[],
  label: string,
) => void = (
  solids: readonly IAutoMovieAnalysisSolid[],
  label: string,
): void => {
  const seen: Set<string> = new Set<string>();
  for (const solid of solids) {
    if (solid.id.trim().length === 0)
      throw new Error(`every ${label} must carry a non-blank id`);
    if (seen.has(solid.id))
      throw new Error(`${label} id "${solid.id}" is declared twice`);
    seen.add(solid.id);
    const out: ViolationCollector = new ViolationCollector();
    validateSolidPlanes(solid.planes, `${label}.planes`, label, out);
    const validated: IAutoMovieValidation = out.toValidation();
    if (validated.success === false) {
      const first: IAutoMovieConstraintViolation = validated.violations[0]!;
      throw new Error(
        `${label} "${solid.id}" is malformed at ${first.path}: ${first.expected}`,
      );
    }
  }
};
