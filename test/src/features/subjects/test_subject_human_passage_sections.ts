import { evaluateHumanFacePassage } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Passage admission uses the continuous triangular section and both apertures.
 *
 * Scenarios:
 * 1. The analytic sparse triangle has 1.25 metres of slab thickness and
 *    passes exactly that aperture, retaining the caller's arrays and frame.
 * 2. An open incisal gap with a short lip gap refuses specifically on lips.
 * 3. A posterior tongue needs no passage; a protruding triangle disjoint from
 *    the slab refuses an unavailable thickness instead of passing with infinity.
 */
export const test_subject_human_passage_sections = (): void => {
  const { basis } = humanFaceContactFixture();
  const frame = {
    up: { x: 0, y: 1, z: 0 },
    forward: { x: 0, y: 0, z: 1 },
    lips: { gap: 1.25 },
    incisors: {
      upper: { x: 0, y: 1.25, z: 0 },
      lower: { x: 0, y: 0, z: 0 },
      gap: 1.25,
    },
  };
  const tongue = [0, -1, -2, 0, 1, 2, 1, -1, 2];
  const before = structuredClone({ tongue, frame });
  const section = evaluateHumanFacePassage(basis.contact!, tongue, frame, [0, 1, 2]);
  TestValidator.predicate(
    "an exactly sufficient aperture passes",
    section !== null && nclose(section.thicknessMetres, 1.25) && nclose(section.protrudingMetres, 2),
  );
  TestValidator.equals("measurement retains caller ownership", { tongue, frame }, before);
  TestValidator.predicate(
    "lips have their own refusal",
    throwsError(() => evaluateHumanFacePassage(basis.contact!, tongue, { ...frame, lips: { gap: 1 } }, [0, 1, 2]), "cannot pass the lips"),
  );
  TestValidator.equals(
    "posterior tongue has no passage",
    evaluateHumanFacePassage(basis.contact!, [0, -1, -2, 0, 1, -2, 1, -1, -2], frame, [0, 1, 2]),
    null,
  );
  TestValidator.predicate(
    "an unavailable protruding section refuses",
    throwsError(() => evaluateHumanFacePassage(basis.contact!, [0, -1, 2, 0, 1, 2, 1, -1, 2], frame, [0, 1, 2]), "no incisal slab section"),
  );
};
