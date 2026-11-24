import type { IMotionCaptureCase } from "@automovie/motions/internal";
import { FamilyCaseKit } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `FamilyCaseKit.band` passes a value inside its closed band and shows it in
 * its unit: metres as millimetres, degrees or seconds.
 *
 * Scenarios:
 *
 * 1. 5 mm inside a 0 to 10 mm band passes and reads in millimetres.
 * 2. 91 degrees outside a 0 to 90 degree band fails.
 * 3. A value on the bound in seconds passes.
 */
export function test_unit_motions_executable_family_case_kit_band(): void {
  TestValidator.equals(
    "inside, outside and on the bound",
    [
      FamilyCaseKit.band("gap", 0.005, 0, 0.01, "mm"),
      FamilyCaseKit.band("knee", 91, 0, 90, "deg"),
      FamilyCaseKit.band("late", 0.2, 0, 0.2, "s"),
    ],
    [
      { name: "gap", passed: true, detail: "5.0 mm (band 0.0 mm to 10.0 mm)" },
      {
        name: "knee",
        passed: false,
        detail: "91.00 deg (band 0.00 deg to 90.00 deg)",
      },
      {
        name: "late",
        passed: true,
        detail: "0.200 s (band 0.000 s to 0.200 s)",
      },
    ] satisfies IMotionCaptureCase.IVerdict[],
  );
}
