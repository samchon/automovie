import { TestValidator } from "@nestia/e2e";

import { createFormationOverlapScenario } from "../internal/createFormationOverlapScenario";

/**
 * The original 5000-member witness retains the unchanged 4096-member measurement cap.
 *
 * Scenarios:
 * 1. Keep the original 5000-member host and put the sentry on its measured slot 100.
 * 2. Refuse that overlap within the unchanged member cap.
 *
 * @evidence contracts/testing.md#behavioral-verification Places a singleton sentry at slot100 of the existing5000-member host and requires one overlap finding, catching omission of a known member inside the supported measured prefix.
 * @evidence contracts/testing.md#independent-expectations The authored centered row places slot i at i-(count-1)/2; sentry and slot100 therefore share a center and their positive filled cores overlap independently of the detector's grid.
 * @evidence contracts/testing.md#distinguishing-cases The inside-cap collision contrasts with the clean host and slot4500 omission controls; the exact4096 boundary is not directly exercised by this interior witness.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_production_formation_overlap_member_cap_measured owns one synchronous portable gate case using existing fixture providers, without a renderer, native artifact or dynamically registered population.
 */
export function test_production_formation_overlap_member_cap_measured(): void {
  const scenario: ReturnType<typeof createFormationOverlapScenario> = createFormationOverlapScenario();
  const { post, row, host, hostSlotX, codes }: typeof scenario = scenario;
  const wide: ReturnType<typeof post> = post({ id: "post", radius: 0.4 });

  // 16. only the first measured members of an enormous unit are measured.
  const HOST_COUNT: number = 5_000;
  const MEASURED_SLOT: number = 100;
  const sentry: (x: number) => ReturnType<typeof row> = (x: number): ReturnType<typeof row> =>
    row({ id: "sentry", count: 1, spacing: 1, anchor: { x, y: 0, z: 0 } });
  TestValidator.equals(
    "withinTheCap preserves the original 5000-member cap witness",
    codes({ models: [wide], formations: [host(HOST_COUNT), sentry(hostSlotX(HOST_COUNT, MEASURED_SLOT))] }).length,
    1,
  );
}
