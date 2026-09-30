import { bodyAnatomyReading } from "@automovie/playground/src/human/body/bodyAnatomyReading";
import { packHumanBodyHumeralHeadReading } from "@automovie/playground/src/human/body/packHumanBodyHumeralHeadReading";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

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
    bodyAnatomyReading({
      status: "unavailable",
      reason: "ct-domain",
    })!.includes("18–79 years"),
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
        source: "target",
        centerInside: false,
        nearestMetres: 0.005,
        clearanceMetres: -0.0284,
      },
      {
        bone: "leftUpperArm",
        radiusMetres: 0.024,
        source: "observed",
        observation: {
          kind: "observed",
          millimetres: 24,
          modality: "mri",
          acquisitionPosture: "supine",
        },
        centerInside: true,
        nearestMetres: 0.03,
        clearanceMetres: 0.006,
      },
    ],
  })!;
  TestValidator.predicate(
    "contained head room",
    text.includes("left adult CT estimate radius 23.4 mm, skin room 22.8 mm"),
  );
  TestValidator.predicate(
    "head protrusion",
    text.includes(
      "right entered measurement radius 23.4 mm, skin protrusion 3.4 mm",
    ),
  );
  TestValidator.predicate(
    "centre already outside",
    text.includes("centre outside skin by 5.0 mm"),
  );
  TestValidator.predicate(
    "target is not called an imaging observation",
    text.includes("right anatomical target radius 23.4 mm"),
  );
  TestValidator.predicate(
    "MRI acquisition is retained in the reading",
    text.includes("left MRI observation radius 24.0 mm"),
  );
  TestValidator.predicate(
    "only head claimed",
    text.startsWith("Humeral heads only:"),
  );
  const observed = packHumanBodyHumeralHeadReading(
    [
      {
        bone: "leftUpperArm",
        center: { x: -0.2, y: 1, z: 0 },
        radiusMetres: 0.024,
        source: "observed",
        observation: {
          kind: "observed",
          millimetres: 24,
          modality: "mri",
          acquisitionPosture: "supine",
        },
      },
      {
        bone: "rightUpperArm",
        center: { x: 0.2, y: 1, z: 0 },
        radiusMetres: 0.022,
        source: "target",
      },
    ],
    [
      {
        id: "rightUpperArm",
        centerInside: true,
        nearestMetres: 0.03,
        clearanceMetres: 0.008,
      },
      {
        id: "leftUpperArm",
        centerInside: true,
        nearestMetres: 0.03,
        clearanceMetres: 0.006,
      },
    ],
  );
  TestValidator.equals(
    "worker preview retains observed MRI method",
    observed.heads[0].source === "observed"
      ? observed.heads[0].observation.modality
      : null,
    "mri",
  );
  TestValidator.equals(
    "worker pairs clearances by bone ID despite reversed order",
    observed.heads.map((head) => head.clearanceMetres),
    [0.006, 0.008],
  );
  TestValidator.predicate(
    "worker requires matching clearances",
    throwsError(() =>
      packHumanBodyHumeralHeadReading(
        [],
        [
          {
            id: "leftUpperArm",
            centerInside: true,
            nearestMetres: 0.03,
            clearanceMetres: 0.006,
          },
        ],
      ),
    ),
  );
  const observedHead = {
    bone: "leftUpperArm" as const,
    center: { x: -0.2, y: 1, z: 0 },
    radiusMetres: 0.024,
    source: "target" as const,
  };
  TestValidator.predicate(
    "worker refuses clearance from another bone",
    throwsError(() =>
      packHumanBodyHumeralHeadReading(
        [observedHead],
        [
          {
            id: "rightUpperArm",
            centerInside: true,
            nearestMetres: 0.03,
            clearanceMetres: 0.006,
          },
        ],
      ),
    ),
  );
  TestValidator.predicate(
    "worker refuses duplicate clearance IDs",
    throwsError(() =>
      packHumanBodyHumeralHeadReading(
        [observedHead, observedHead],
        [
          {
            id: "leftUpperArm",
            centerInside: true,
            nearestMetres: 0.03,
            clearanceMetres: 0.006,
          },
          {
            id: "leftUpperArm",
            centerInside: true,
            nearestMetres: 0.03,
            clearanceMetres: 0.006,
          },
        ],
      ),
    ),
  );
  TestValidator.predicate(
    "worker refuses duplicate heads",
    throwsError(() =>
      packHumanBodyHumeralHeadReading(
        [observedHead, observedHead],
        [
          {
            id: "leftUpperArm",
            centerInside: true,
            nearestMetres: 0.03,
            clearanceMetres: 0.006,
          },
          {
            id: "rightUpperArm",
            centerInside: true,
            nearestMetres: 0.03,
            clearanceMetres: 0.006,
          },
        ],
      ),
    ),
  );
};
