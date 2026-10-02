import {
  type IAutoMovieHumanFaceContactSummary,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { nclose } from "../internal/predicates";

/**
 * The displayed lip separation describes final geometry after tissue contact.
 *
 * Scenarios:
 * 1. Pressing the lower seam into the analytic dental crown invokes contact;
 *    the reported gap equals the exported seam and differs from the preliminary
 *    0.3 metre gap. Closure scaling remains its separate preliminary quantity.
 */
export const test_subject_human_contact_final_aperture = (): void => {
  const { basis, document } = humanFaceContactFixture();
  basis.surfaces.find((surface) => surface.id === "mouth")!.targets.pressTarget = [3, 0, -0.2, -0.35];
  let summary: IAutoMovieHumanFaceContactSummary | null = null;
  const build = createHumanFaceBasisBuilder(basis, { observe: (value) => { summary = value; } });
  const model = build({ ...document, expression: { press: 1 } });
  const mouth = model.parts.find((part) => part.id === "mouth/all")!;
  if (mouth.geometry.type !== "mesh") throw new Error("mesh expected");
  const positions = mouth.geometry.mesh.positions;
  const gap = positions[1] - positions[10];
  TestValidator.predicate("contact really changed the seam", summary!.resolved[0].vertices > 0 && !nclose(gap, 0.3));
  TestValidator.predicate("reported aperture is the exported aperture", nclose(summary!.interlabialMetres, gap));
  // Rest gap 0.1 m, reference gap 1.45 m, preliminary pressed gap 0.3 m:
  // (0.3 - 0.1) / (1.45 - 0.1) = 4/27, before contact narrows the seam.
  TestValidator.predicate("closure retains its preliminary aperture ratio", nclose(summary!.closureRatio, 4 / 27));
};
