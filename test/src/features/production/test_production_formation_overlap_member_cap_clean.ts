import { TestValidator } from "@nestia/e2e";

import { createFormationOverlapScenario } from "../internal/createFormationOverlapScenario";

/**
 * The original 5000-member witness retains the unchanged 4096-member measurement cap.
 *
 * Scenarios:
 * 1. Keep the original 5000-member host and its one-metre member spacing.
 * 2. Accept the host on its own, proving the two cap witnesses do not report self-overlap.
 *
 * @evidence contracts/testing.md#behavioral-verification Validates the existing 5000-member host alone and requires no overlap finding, catching a cap implementation that creates a spurious pair in the measured prefix.
 * @evidence contracts/testing.md#independent-expectations One-metre center spacing exceeds the posts' authored0.8-metre outer diameter, so the host's measured members cannot overlap. This clean witness alone does not locate or prove the4096 cap.
 * @evidence contracts/testing.md#distinguishing-cases This entry supplies the clean large-population control for the measured-slot100 and unmeasured-slot4500 companion witnesses; malformed populations and continuous collision coverage are outside it.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_production_formation_overlap_member_cap_clean synchronously runs the actual portable overlap gate through the existing compact host fixture, without creating5000 rendered members or a real host.
 */
export function test_production_formation_overlap_member_cap_clean(): void {
  const scenario: ReturnType<typeof createFormationOverlapScenario> = createFormationOverlapScenario();
  const { post, host, codes }: typeof scenario = scenario;
  const wide: ReturnType<typeof post> = post({ id: "post", radius: 0.4 });

  // 16. only the first measured members of an enormous unit are measured.
  const HOST_COUNT: number = 5_000;
  TestValidator.equals(
    "theHostIsCleanOnItsOwn preserves the original 5000-member cap witness",
    codes({ models: [wide], formations: [host(HOST_COUNT)] }).length,
    0,
  );
}
