import { AquaticCrew } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `AquaticCrew.bear` writes a contact window a body part holds on a craft: its
 * part, kind, shares and region, supported by the craft as a prop.
 *
 * Scenarios:
 *
 * 1. The seat borne on the hull over the whole action names the hull as its
 *    support, with its region.
 * 2. Without a region the window carries none.
 */
export function test_unit_motions_sport_aquatic_crew_bear(): void {
  TestValidator.equals(
    "the borne windows",
    [
      AquaticCrew.bear("scull", "hips", "bear", 0, 1, "seat"),
      AquaticCrew.bear("scull", "leftFoot", "plant", 0.25, 0.75).region,
    ],
    [
      {
        part: "hips",
        kind: "bear",
        from: 0,
        to: 1,
        region: "seat",
        support: { kind: "prop", subject: "scull" },
      },
      undefined,
    ],
  );
}
