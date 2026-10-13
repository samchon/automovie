import { TestValidator } from "@nestia/e2e";

import { createFormationOverlapScenario } from "../internal/createFormationOverlapScenario";

/**
 * The original 5000-member witness retains the unchanged 4096-member measurement cap.
 *
 * Scenarios:
 * 1. Keep the original 5000-member host and its one-metre member spacing.
 * 2. Accept the host on its own, proving the two cap witnesses do not report self-overlap.
 */
export const test_production_formation_overlap_member_cap_clean = (): void => {
  const scenario = createFormationOverlapScenario();
  const { post, host, codes } = scenario;
  const wide = post({ id: "post", radius: 0.4 });

  // 16. only the first measured members of an enormous unit are measured.
  const HOST_COUNT = 5_000;
  TestValidator.equals(
    "theHostIsCleanOnItsOwn preserves the original 5000-member cap witness",
    codes({ models: [wide], formations: [host(HOST_COUNT)] }).length,
    0,
  );
};
