import { TestValidator } from "@nestia/e2e";

import { parseHumanViewerAddress } from "../../../scripts/human-viewer/parseHumanViewerAddress";
import { throwsError } from "../internal/predicates";

/**
 * Malformed light selections cannot silently choose a diagnostic direction.
 * Scenarios:
 * 1. Unknown names and short/long/empty tuples refuse structural admission.
 * 2. Empty, zero, nonfinite, malformed and overflowing norms refuse numeric admission.
 * 3. A repeated field refuses even when both individual vectors are valid.
 */
export function test_human_viewer_light_refusal(): void {
  for (const value of ["", "unknown,0,1,0", "rim,0,1", "rim,0,1,0,1"])
    TestValidator.predicate("closed tuple " + value, throwsError(() => parseHumanViewerAddress("light=" + value), "light requires key"));
  for (const value of ["rim,,1,0", "rim,0,0,0", "rim,NaN,1,0", "rim,Infinity,1,0", "rim,no,1,0", "rim,1.7e308,1.7e308,1.7e308"])
    TestValidator.predicate("finite vector " + value, throwsError(() => parseHumanViewerAddress("light=" + value), "finite nonzero direction"));
  TestValidator.predicate("repeated light", throwsError(() => parseHumanViewerAddress("light=key,0,1,0&light=rim,0,-1,0"), "Repeated display field: light"));
}
