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
 *
 * @evidence contracts/common.md#principled-implementation Treatment file/H2 references prohibit exclusions but permit many-to-many coverage, matching independent event and release partitions; host attribution remains a semantic contract because native cardinality cannot require an arbitrary positive count.
 * @evidence contracts/common.md#clear-and-simple-design This helper isolates coverage from strict lineage, preventing the one-parent rule from being reused for differently partitioned populations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts NoEvidenceExclude enforces retained treatment targets without a fixture-specific bijection; the documented native limitation is not hidden by a fabricated host count.
 * @evidence contracts/common.md#meaningful-documentation The prose explains partition independence, the exact guarantee and the remaining per-host attribution responsibility.
 * @evidence contracts/performance.md#efficient-algorithms The reference object is fixed size; referenceLocation copies/maps n selected paths for file references and reuses the supplied path array for H2 references, so work is O(n) path text or constant respectively.
 * @evidence contracts/performance.md#reuse-equivalent-work Address formation is shared with lineage references; H2 selectors retain the provided array while file selectors allocate qualified addresses, and no cross-call cache claims mutable selector equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned reference is caller-owned and may retain the input selector array; file-qualified strings scale with selector text, with no open handles or persistent registry.
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
