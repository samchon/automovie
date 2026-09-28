import { createHumanFaceBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { prepareArticulatedBasis } from "../../../scripts/face-review/prepareArticulatedBasis";
import { articulatedBasisFixture } from "../internal/articulatedBasisFixture";
import { nclose, throwsError, vclose } from "../internal/predicates";

/**
 * The articulated preparation measures the joints from the source's own
 * endpoints, attaches the tissue, replays every expression and restamps.
 * Scenarios:
 * 1. The opening screw decomposes under the coupling into the analytic axis
 *    point, the translations come back, the gaze angle and axis come back,
 *    the implied skin weights are exactly the authored fractions, teeth and
 *    globe are attached with unit weight, and the carrier's correctives go.
 * 2. Every document and the control map are restamped; caller inputs stay
 *    unchanged; the receipt reports zero replay error.
 * 3. Refusals: a revision equal to the source, attachments from another
 *    basis, a wrong neutral digest, a translation endpoint that rotates, a
 *    gaze endpoint off its centre, an absent legacy group, a document naming
 *    another basis, and a shape channel named as a joint driver.
 */
export const test_subject_articulated_preparation = (): void => {
  const input = articulatedBasisFixture();
  const saved = structuredClone(input);
  const result = prepareArticulatedBasis(input);
  TestValidator.equals("inputs are not mutated", input, saved);
  const { jaw } = result.basis.articulation!;
  TestValidator.predicate(
    "the opening screw and coupling produce the analytic articulation",
    nclose(jaw.opening.degrees, 30, 1e-9) &&
      vclose(
        { x: jaw.axis[0], y: jaw.axis[1], z: jaw.axis[2] },
        { x: 1, y: 0, z: 0 },
        1e-9,
      ) &&
      vclose(
        {
          x: jaw.opening.translation[0],
          y: jaw.opening.translation[1],
          z: jaw.opening.translation[2],
        },
        { x: 0, y: -0.03, z: 0.06 },
        1e-12,
      ) &&
      vclose(
        {
          x: jaw.protrusion.translation[0],
          y: jaw.protrusion.translation[1],
          z: jaw.protrusion.translation[2],
        },
        { x: 0, y: 0, z: 0.4 },
        1e-12,
      ) &&
      nclose(jaw.laterotrusion.left.translation[0], 0.3, 1e-12) &&
      nclose(jaw.laterotrusion.right.translation[0], -0.3, 1e-12),
  );
  TestValidator.predicate(
    "the screw pivot is the landmark and the axis point is shifted by the coupling",
    vclose(
      {
        x: result.receipt.jaw.screwPivotMm[0],
        y: result.receipt.jaw.screwPivotMm[1],
        z: result.receipt.jaw.screwPivotMm[2],
      },
      { x: 0, y: 500, z: 200 },
      1e-6,
    ) && Math.hypot(...jaw.axisOffset) > 0.05,
  );
  const gaze = result.basis.articulation!.eyes[0].gaze[0];
  TestValidator.predicate(
    "the gaze fit returns the authored angle about the centre",
    nclose(gaze.degrees, 20, 1e-9) &&
      nclose(gaze.axis[1], 1, 1e-9) &&
      Math.hypot(...gaze.translation) < 1e-9,
  );
  TestValidator.equals(
    "implied skin weights are the authored fractions",
    result.basis.surfaces[0].attachments,
    [{ owner: "jaw", rows: [2, 0.5, 3, 1] }],
  );
  TestValidator.equals(
    "bone surfaces attach with unit weight",
    [
      result.basis.surfaces[1].attachments,
      result.basis.surfaces[2].attachments,
    ],
    [
      [{ owner: "jaw", rows: [0, 1, 1, 1, 2, 1, 3, 1] }],
      [{ owner: "leftEye", rows: [0, 1, 1, 1, 2, 1, 3, 1] }],
    ],
  );
  TestValidator.equals(
    "legacy groups are gone and the carrier keeps its own rows",
    [
      (result.basis.surfaces[1] as { rigidGroups?: unknown }).rigidGroups,
      result.basis.surfaces[0].targets.carryTarget,
    ],
    [undefined, [1, 0, 0, 0.09]],
  );
  TestValidator.equals(
    "restamped documents and map",
    [
      result.documents.map((d) => d.basis),
      result.controls.basis,
      result.basis.id,
    ],
    [
      ["analytic-articulated/1", "analytic-articulated/1"],
      "analytic-articulated/1",
      "analytic-articulated/1",
    ],
  );
  TestValidator.predicate(
    "the receipt reports exact replay",
    Object.values(result.receipt.replayWorstMm).every((mm) => mm === 0),
  );
  TestValidator.predicate(
    "the prepared basis admits and builds a restamped document",
    createHumanFaceBasisBuilder(result.basis)(result.documents[0]).parts
      .length === 3,
  );
  const refusals: [
    string,
    (input: ReturnType<typeof articulatedBasisFixture>) => void,
    string,
  ][] = [
    ["same revision", (i) => (i.revision = i.basis.id), "distinct revision"],
    [
      "foreign attachments",
      (i) => (i.attachments.basis = "other"),
      "source basis",
    ],
    [
      "wrong digest",
      (i) => (i.attachments.neutralFloat64LESha256 = "0"),
      "different neutral",
    ],
    [
      "rotating translation endpoint",
      (i) =>
        (i.basis.surfaces[1].targets.forwardTarget =
          i.basis.surfaces[1].targets.openTarget),
      "must not rotate",
    ],
    [
      "gaze off centre",
      (i) => (i.attachments.landmarks.positions[3] = 2.5),
      "off its centre",
    ],
    [
      "absent legacy group",
      (i) => (i.jaw.group = "missing"),
      "legacy rigid group",
    ],
    [
      "document on another basis",
      (i) => (i.documents[1].basis = "elsewhere"),
      "another basis",
    ],
    [
      "shape channel as driver",
      (i) => (i.jaw.protrusion = "width"),
      "expression channel",
    ],
  ];
  for (const [title, mutate, fragment] of refusals) {
    const mutated = articulatedBasisFixture();
    mutate(mutated);
    TestValidator.predicate(
      title + " refuses",
      throwsError(() => prepareArticulatedBasis(mutated), fragment),
    );
  }
};
