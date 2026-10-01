import { blendPortraitSkin } from "@automovie/human/face/anatomy/skin/blendPortraitSkin";
import { TestValidator } from "@nestia/e2e";

import {
  alternatePortraitEye,
  alternatePortraitNose,
  portraitComponentsFor,
  portraitEyeShape,
  portraitNoseShape,
} from "../../subjects/generated-korean-girl-01/configuration";
import { referenceControlNet } from "../../subjects/generated-korean-girl-01/controlNet";

/**
 * Replace one eye and the nose through the same host protocol. The unchanged eye
 * stays pinned, neighbouring skin adapts, and the assembled skin retains exactly
 * its intended two eye openings, mouth opening and lower neck crop.
 *
 * Scenarios:
 * 1. Fit baseline and changed left-eye/nose attachments on the same host.
 *    Both variants retain their exact component constraints before refinement.
 * 2. The right eye stays unchanged, skin adjacent to the edited parts changes,
 *    and the distant chin remains fixed. The edited eye recalculates its skin
 *    reservation while unrelated component cut identities remain stable.
 * The assembled cage's seam topology is pinned by
 * `test_subject_component_replacement_seam`.
 */
export const test_subject_component_replacement = (): void => {
  const sampling = { eyeColumns: 12, eyeRows: 6, irisColumns: 16, irisRows: 4 };
  const eye = { ...portraitEyeShape, browFibres: 6, upperLashes: 3, sampling };
  const alternate = {
    ...alternatePortraitEye,
    browFibres: 6,
    upperLashes: 3,
    sampling,
  };
  const host = {
    positions: referenceControlNet.positions,
    indices: referenceControlNet.indices,
    viewRay: referenceControlNet.viewRay,
  };
  const baselineParts = portraitComponentsFor(eye, eye, portraitNoseShape);
  const replacementParts = portraitComponentsFor(
    eye,
    alternate,
    alternatePortraitNose,
  );
  const basePlans = baselineParts.map((part) => part.fit(host));
  const replacementPlans = replacementParts.map((part) => part.fit(host));
  TestValidator.equals(
    "unrelated cut identities stay stable",
    replacementPlans
      .filter((_plan, i) => baselineParts[i].id !== "left-eye")
      .map((plan) => plan.cutFaces),
    basePlans
      .filter((_plan, i) => baselineParts[i].id !== "left-eye")
      .map((plan) => plan.cutFaces),
  );
  const left = baselineParts.findIndex((part) => part.id === "left-eye");
  TestValidator.predicate(
    "replacement recalculates the required eye reservation",
    basePlans[left].cutFaces.length !== replacementPlans[left].cutFaces.length,
  );
  const baseline = {
    source: blendPortraitSkin(
      host.positions,
      host.indices,
      basePlans.flatMap((plan) => plan.constraints),
    ),
  };
  const replacement = {
    source: blendPortraitSkin(
      host.positions,
      host.indices,
      replacementPlans.flatMap((plan) => plan.constraints),
    ),
  };
  for (const constraint of replacementPlans.flatMap((plan) => plan.constraints))
    TestValidator.equals(
      "replacement owns its exact seam",
      replacement.source[constraint.vertex],
      constraint.target,
    );
  for (const constraint of basePlans[0].constraints)
    TestValidator.equals(
      "other eye is independently retained",
      replacement.source[constraint.vertex],
      baseline.source[constraint.vertex],
    );
  const pinned = new Set(
    replacementPlans.flatMap((plan) =>
      plan.constraints.map((constraint) => constraint.vertex),
    ),
  );
  TestValidator.predicate(
    "surrounding skin follows the new parts",
    replacement.source.some(
      (point, id) =>
        !pinned.has(id) &&
        point.some(
          (value, axis) => Math.abs(value - baseline.source[id][axis]) > 0.001,
        ),
    ),
  );
  TestValidator.equals(
    "distant chin is retained",
    replacement.source[152],
    host.positions[152],
  );
};
