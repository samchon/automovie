import type { IEvidenceReference } from "@wrtnlabs/evidence";

import type { AuthoredPass } from "../../AuthoredPass";
import { referenceLocation } from "../utilities/referenceLocation";

/**
 * Creates a reference to the treatment units a partitioned layer realizes.
 *
 * Event units and release units are different axes: one event may run across
 * several episodes, and one episode may braid several events. The relation is
 * therefore many-to-many, and neither direction may be constrained to one.
 *
 * `noEvidenceExclude` keeps every treatment unit cited, so a dropped event
 * fails the build. That is what the bijection was really protecting, and this
 * relation proves it directly: nothing was lost, rather than the structures
 * match.
 *
 * It proves only that. Ordinary coverage cannot require a host to cite
 * anything, and the one per-host count the engine offers is exactly one, which
 * a unit realizing two events would fail. Attribution is therefore a contract
 * duty rather than a cardinality: a unit with no parent cannot answer
 * its selected parent-realization principle truthfully.
 */
export function createCoverageReference(
  files: string[],
  symbol: "file" | "h2",
  pass: AuthoredPass = "draft",
): IEvidenceReference {
  return {
    type: "markdown",
    ...referenceLocation(files, pass, symbol),
    symbol,
    noEvidenceExclude: true,
  };
}
