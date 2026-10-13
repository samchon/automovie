import type { AutoMovieProductionContractClaim } from "./AutoMovieProductionContractClaim";
import type { IAutoMovieProductionContractClaimProps } from "./IAutoMovieProductionContractClaimProps";
import type { ITtscEvidenceGraphReference, TtscEvidenceGraphMarkdownSymbol } from "@ttsc/evidence";

import { createAutoMovieProductionContractClaim } from "./createAutoMovieProductionContractClaim";

/**
 * Creates one production-local principle claim.
 *
 * Every selected host answers every H2 item for itself. An exclusion cannot discharge an answer, and completed-stage answers retain their actual citations without companion rows or fingerprints. Draft and disabled hosts carry no evidence tags, so their local contract claim remains declared but disabled alongside the shared graph.
 *
 * @evidence contracts/common.md#principled-implementation Only H2, H3 or H4 host units can create a checklist where every host answers every contract target.
 * @evidence contracts/common.md#clear-and-simple-design Symbol cardinality is admitted at this entry point before the shared local contract constructor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty or unsupported symbol populations throw rather than falling back to distributed obligation coverage.
 * @evidence contracts/common.md#meaningful-documentation The returned binding follows the owning authored stage and preserves complete target duties without companion prose rows.
 * @evidence contracts/performance.md#efficient-algorithms Symbol validation is linear in selected depths; host and document validation in the shared constructor dominates for larger selectors.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared constructor owns equivalent path and stage checks for both local claim families.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result is caller-owned and all temporary symbol arrays are released after return or rejection.
 */
export function createAutoMovieProductionPrincipleClaim(
  props: IAutoMovieProductionContractClaimProps,
): AutoMovieProductionContractClaim {
  requireSymbol(props.symbol);
  return createAutoMovieProductionContractClaim(props, true);
}

/** Refuse a layer/symbol combination that changes claim cardinality. */
function requireSymbol(symbol: Extract<ITtscEvidenceGraphReference, { type: "markdown" }>["symbol"]): void {
  const symbols: (TtscEvidenceGraphMarkdownSymbol | undefined)[] = Array.isArray(symbol) ? [...symbol] : [symbol];
  const accepted: string[] = ["h2", "h3", "h4"];
  if (
    symbols.length === 0 ||
    symbols.some((candidate: TtscEvidenceGraphMarkdownSymbol | undefined): boolean => !accepted.includes(candidate as string))
  )
    throw new Error(
      "A production-local principle claim selects only H2, H3, or H4 authored units.",
    );
}
