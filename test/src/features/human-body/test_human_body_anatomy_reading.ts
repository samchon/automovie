import { bodyAnatomyReading } from "@automovie/playground/src/human/bodyAnatomyReading";
import { TestValidator } from "@nestia/e2e";

/**
 * Explicit internal-part status separates a measured adult head from
 * unavailable cohorts and from skin with no meaningful enclosed interior.
 *
 * Scenarios:
 * 1. No requested reading adds no status; crossed skin and an unsupported
 *    CT cohort state why no estimate is available.
 * 2. Contained, protruding and outside-centre spheres report distinct
 *    millimetre facts without claiming a whole-humerus or muscle result.
 */
export const test_human_body_anatomy_reading = (): void => {
  TestValidator.equals("not requested", bodyAnatomyReading(null), null);
  TestValidator.equals(
    "crossed skin has no anatomical inside",
    bodyAnatomyReading({ status: "unavailable", reason: "skin-crossing" }),
    "Humeral-head clearance unavailable: the posed skin crosses itself.",
  );
  TestValidator.predicate(
    "unsupported CT cohort is identified",
    bodyAnatomyReading({ status: "unavailable", reason: "ct-domain" })!.includes("18–79 years"),
  );
  const text = bodyAnatomyReading({
    status: "measured",
    heads: [
      {
        bone: "leftUpperArm",
        radiusMetres: 0.0234,
        source: "adult-ct-prior",
        centerInside: true,
        nearestMetres: 0.0462,
        clearanceMetres: 0.0228,
      },
      {
        bone: "rightUpperArm",
        radiusMetres: 0.0234,
        source: "measured",
        centerInside: true,
        nearestMetres: 0.02,
        clearanceMetres: -0.0034,
      },
      {
        bone: "rightUpperArm",
        radiusMetres: 0.0234,
        source: "measured",
        centerInside: false,
        nearestMetres: 0.005,
        clearanceMetres: -0.0284,
      },
    ],
  })!;
  TestValidator.predicate("contained head room", text.includes("left adult CT estimate radius 23.4 mm, skin room 22.8 mm"));
  TestValidator.predicate("head protrusion", text.includes("right entered measurement radius 23.4 mm, skin protrusion 3.4 mm"));
  TestValidator.predicate("centre already outside", text.includes("centre outside skin by 5.0 mm"));
  TestValidator.predicate("only head claimed", text.startsWith("Humeral heads only:"));
};
