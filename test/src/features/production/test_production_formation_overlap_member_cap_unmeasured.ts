import { TestValidator } from "@nestia/e2e";

import { createFormationOverlapScenario } from "../internal/createFormationOverlapScenario";
import type { IFormationOverlapScenario } from "../internal/IFormationOverlapScenario";

/**
 * The original 5000-member witness retains the unchanged 4096-member measurement cap.
 *
 * Scenarios:
 * 1. Keep the original 5000-member host and put the sentry on its unmeasured slot 4500.
 * 2. Preserve the stated cap resolution without inventing a sampled member.
 */
export const test_production_formation_overlap_member_cap_unmeasured = (): void => {
  const scenario = createFormationOverlapScenario();
  const { post, row, host, hostSlotX, codes } = scenario;
  const wide = post({ id: "post", radius: 0.4 });

  // 16. only the first measured members of an enormous unit are measured.
  const HOST_COUNT = 5_000;
  const UNMEASURED_SLOT = 4_500;
  const sentry = (x: number): ReturnType<IFormationOverlapScenario["row"]> =>
    row({ id: "sentry", count: 1, spacing: 1, anchor: { x, y: 0, z: 0 } });
  TestValidator.equals(
    "pastTheCap preserves the original 5000-member cap witness",
    codes({ models: [wide], formations: [host(HOST_COUNT), sentry(hostSlotX(HOST_COUNT, UNMEASURED_SLOT))] }).length,
    0,
  );
};
