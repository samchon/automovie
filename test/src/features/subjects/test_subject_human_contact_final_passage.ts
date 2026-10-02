import { type IAutoMovieHumanFaceContactSummary, createHumanFaceBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Passage admission follows contact's final lip separation, not the earlier
 * aperture used by closure. The two cases differ only in tongue height.
 *
 * Scenarios:
 * 1. The analytic lower seam is pressed inside a dental crown. Contact narrows
 *    its preliminary 0.3 metre lip gap; a 0.28 metre tongue that fitted the
 *    preliminary gap must refuse the final lips despite ample incisal space.
 * 2. A 0.26 metre tongue passes the same corrected aperture, the adjacent
 *    negative twin that rules out unconditional refusal of this pose.
 */
export const test_subject_human_contact_final_passage = (): void => {
  for (const thickness of [0.28, 0.26]) {
    const { basis, document } = humanFaceContactFixture();
    // The analytic crown's top and the lower crown's top define a 0.6 m
    // aperture; the teeth are fixed, so this test isolates the lip condition.
    basis.contact!.incisors.upper = 2;
    basis.surfaces.find((surface) => surface.id === "mouth")!.targets.pressTarget = [3, 0, -0.2, -0.35];
    const tongue = basis.surfaces.find((surface) => surface.id === "tongue")!;
    tongue.positions[10] = -0.3 + thickness;
    let summary: IAutoMovieHumanFaceContactSummary | null = null;
    const build = createHumanFaceBasisBuilder(basis, { observe: (value) => { summary = value; } });
    build({ ...document, expression: { press: 1 } });
    // The seam's L1 crown deficit is 0.1 m. Projection onto its face moves
    // Y by 0.1/3, narrowing 0.3 to 0.3 - 0.1/3 = 0.8/3 m.
    TestValidator.predicate(
      "the intended corrected aperture was arranged",
      summary!.resolved[0].vertices > 0 && nclose(summary!.interlabialMetres, 0.8 / 3) && summary!.passage === null,
    );
    const pose = { ...document, expression: { press: 1, out: 1 } };
    if (thickness === 0.28)
      TestValidator.predicate("contact's narrowed lips refuse the tongue", throwsError(() => build(pose), "cannot pass the lips"));
    else {
      const model = build(pose);
      TestValidator.predicate("the adjacent thinner tongue passes", model.parts.length > 0 && summary!.passage !== null && nclose(summary!.passage.thicknessMetres, thickness));
    }
  }
};
