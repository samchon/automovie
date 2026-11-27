import {
  type IAutoMovieAnalysisSolid,
  IAutoMovieConstraintViolation,
  IAutoMovieValidation,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { AutoMovieEngineViolationCollector } from "../../validation/AutoMovieEngineViolationCollector";
import { validateSolidPlanes } from "./validateSolidPlanes";

/*
 * Refuse malformed blocker identifiers and half-space fields.
 *
 * The rule is validateSolidPlanes, raised to a throw: an adapter reading
 * an authored shading solid has no honest result to return for a solid with no
 * faces, so it stops rather than producing one. Sharing the rule is what keeps
 * a neighbour's mass and the building's own canopy held to one standard.
 *
 * Throws an `Error` at the first id repeated within `solids`, or the first
 * plane violation of a solid, naming that solid and the violation path. `label`
 * names the kind of solid in every message and path, and ids need to be unique
 * only within this one list.
 *
 * Plane count and finite fields do not prove the intersection bounded or
 * nonempty; validateSolidPlanes deliberately leaves those geometric properties
 * unchecked.
 * Parameter solids: Authored convex blockers, checked in list order.
 * Parameter label: Kind of solid named in messages and paths, such as `shading
 * solid`.
 */
export function assertAnalysisSolids(
  solids: readonly IAutoMovieAnalysisSolid[],
  label: string,
): void {
  const seen: Set<string> = new Set<string>();
  for (const solid of solids) {
    if (seen.has(solid.id))
      throw new Error(`${label} id "${solid.id}" is declared twice`);
    seen.add(solid.id);
    const out: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
    validateSolidPlanes(solid.planes, `${label}.planes`, label, out);
    const validated: IAutoMovieValidation = out.toValidation();
    if (validated.success === false) {
      const first: IAutoMovieConstraintViolation = validated.violations[0]!;
      throw new Error(
        `${label} "${solid.id}" is malformed at ${first.path}: ${first.expected}`,
      );
    }
  }
}
