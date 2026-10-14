import { TestValidator } from "@nestia/e2e";

import { createFormationOverlapScenario } from "../internal/createFormationOverlapScenario";

/**
 * The original 5000-member witness retains the unchanged 4096-member measurement cap.
 *
 * Scenarios:
 * 1. Keep the original 5000-member host and put the sentry on its unmeasured slot 4500.
 * 2. Preserve the stated cap resolution without inventing a sampled member.
 *
 * @evidence contracts/testing.md#behavioral-verification Places a sentry at slot4500 of the existing5000-member host and requires no finding, pinning omission beyond the declared measured prefix rather than asserting physical clearance.
 * @evidence contracts/testing.md#independent-expectations Centered-row arithmetic makes sentry and slot4500 coincide, but the gate's4096-member prefix excludes that slot; the expected absence documents a sampling limit rather than a safe placement.
 * @evidence contracts/testing.md#distinguishing-cases The outside-prefix collision contrasts with slot100 refusal and clean-host acceptance. It does not directly exercise slots4095/4096 or establish collision freedom of the unmeasured suffix.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_production_formation_overlap_member_cap_unmeasured runs the real portable sampled gate synchronously through the existing compact formation fixture, without creating a native crowd or rendering it.
 */
export function test_production_formation_overlap_member_cap_unmeasured(): void {
  const scenario: ReturnType<typeof createFormationOverlapScenario> = createFormationOverlapScenario();
  const { post, row, host, hostSlotX, codes }: typeof scenario = scenario;
  const wide: ReturnType<typeof post> = post({ id: "post", radius: 0.4 });

  // 16. only the first measured members of an enormous unit are measured.
  const HOST_COUNT: number = 5_000;
  const UNMEASURED_SLOT: number = 4_500;
  const sentry: (x: number) => ReturnType<typeof row> = (x: number): ReturnType<typeof row> =>
    row({ id: "sentry", count: 1, spacing: 1, anchor: { x, y: 0, z: 0 } });
  TestValidator.equals(
    "pastTheCap preserves the original 5000-member cap witness",
    codes({ models: [wide], formations: [host(HOST_COUNT), sentry(hostSlotX(HOST_COUNT, UNMEASURED_SLOT))] }).length,
    0,
  );
}
