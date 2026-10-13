import type { AutoMovieContractRuleStatus } from "./AutoMovieContractRuleStatus";
import type { AutoMovieContractRuleApplication } from "./AutoMovieContractRuleApplication";


/** Routing metadata attached to one optional structured contract rule.
 *
 * @evidence contracts/common.md#principled-implementation Stable ID, lifecycle, safe boundary, exact timing and source revision identify one optional structured route.
 * @evidence contracts/common.md#clear-and-simple-design Metadata stays separate from the anchored H2's path and title.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All routing facts are mandatory when a block exists; prose-only contract H2s remain a separate valid form.
 * @evidence contracts/common.md#meaningful-documentation Members state ID stability, lifecycle, timing and immutable source identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased five-field interface neither creates a metadata object nor retains its strings; validateMetadata returns an admitted JSON record and readAutoMovieContractRules transfers that record to the caller, which owns its lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieContractRuleMetadata {

  /** Stable lower-kebab identity independent of file movement. */
  id: string;

  /** Whether the rule is active, held for measurement, or rejected. */
  status: AutoMovieContractRuleStatus;

  /** Earliest operation at which applying the rule is safe. */
  safeApplication: AutoMovieContractRuleApplication;

  /** Exact authoring or review event at which the rule is evaluated. */
  timing: string;

  /** Immutable source or measurement revision that established the routing. */
  sourceIdentity: string;
}
