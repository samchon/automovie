import {
  type IAutoMovieHumanFaceBasis,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceArticulationFixture } from "../internal/humanFaceArticulationFixture";
import { throwsError } from "../internal/predicates";

/**
 * Landmarks, articulation and attachments are admitted structurally before
 * any document builds; one defect each refuses, and the valid fixture builds.
 * Scenarios:
 * 1. Landmark defects: duplicate ids, misaligned positions, rows on an
 *    undeclared endpoint, an all-zero row, a descending row.
 * 2. Articulation defects: absent pivot landmark, non-unit axis, zero
 *    opening, a limit below the full opening translation, a shape channel as
 *    driver, one channel driving two joints, an absent eye centre, a zero
 *    gaze angle, a nonfinite gaze translation, a duplicate owner.
 * 3. Attachment defects: an undeclared owner, an owner twice on one surface,
 *    empty rows, a weight above one, a per-vertex sum above one, descending
 *    vertices, and any attachment on a basis without articulation.
 * 4. The untouched fixture admits and its neutral is the rest geometry.
 * 5. A joint-driving channel whose endpoint reaches no surface admits, while
 *    an ordinary expression endpoint that reaches no surface still refuses.
 */
export const test_subject_human_articulation_admission = (): void => {
  type Basis = IAutoMovieHumanFaceBasis;
  const defects: [string, (basis: Basis) => void][] = [
    ["duplicate landmark", (b) => (b.landmarks!.ids[1] = "joint-mouth")],
    ["misaligned positions", (b) => b.landmarks!.positions.push(0)],
    [
      "row on undeclared endpoint",
      (b) => (b.landmarks!.targets.absent = [0, 1, 0, 0]),
    ],
    ["zero row", (b) => (b.landmarks!.targets.spaced = [1, 0, 0, 0])],
    [
      "descending rows",
      (b) => (b.landmarks!.targets.spaced = [1, 1, 0, 0, 0, 1, 0, 0]),
    ],
    ["absent pivot", (b) => (b.articulation!.jaw.pivot = "nowhere")],
    ["non-unit axis", (b) => (b.articulation!.jaw.axis = [1, 1, 0])],
    ["zero opening", (b) => (b.articulation!.jaw.opening.degrees = 0)],
    [
      "limit below full opening",
      (b) => (b.articulation!.jaw.translationLimitMetres = 0.05),
    ],
    [
      "shape channel drives",
      (b) => (b.articulation!.jaw.protrusion.channel = "spacing"),
    ],
    [
      "one channel drives two joints",
      (b) => (b.articulation!.eyes[0].gaze[0].channel = "open"),
    ],
    ["absent eye centre", (b) => (b.articulation!.eyes[0].center = "nowhere")],
    ["zero gaze", (b) => (b.articulation!.eyes[0].gaze[0].degrees = 0)],
    [
      "nonfinite gaze translation",
      (b) => (b.articulation!.eyes[0].gaze[0].translation = [0, NaN, 0]),
    ],
    [
      "duplicate owner",
      (b) =>
        b.articulation!.eyes.push({ ...b.articulation!.eyes[0], gaze: [] }),
    ],
    [
      "undeclared owner",
      (b) => (b.surfaces[1].attachments![0].owner = "tongue"),
    ],
    [
      "owner twice",
      (b) => b.surfaces[1].attachments!.push({ owner: "jaw", rows: [0, 1] }),
    ],
    ["empty rows", (b) => (b.surfaces[1].attachments![0].rows = [])],
    [
      "weight above one",
      (b) => (b.surfaces[0].attachments![0].rows = [2, 1.5]),
    ],
    [
      "sum above one",
      (b) =>
        b.surfaces[0].attachments!.push({ owner: "leftEye", rows: [3, 0.5] }),
    ],
    [
      "descending vertices",
      (b) => (b.surfaces[0].attachments![0].rows = [3, 1, 2, 0.5]),
    ],
    [
      "attachment without articulation",
      (b) => {
        delete b.articulation;
      },
    ],
  ];
  for (const [title, defect] of defects) {
    const { basis } = humanFaceArticulationFixture();
    defect(basis);
    TestValidator.predicate(
      title + " refuses",
      throwsError(() => createHumanFaceBasisBuilder(basis)),
    );
  }
  const { basis, document } = humanFaceArticulationFixture();
  const model = createHumanFaceBasisBuilder(basis)(document);
  const arch = model.parts.find((part) => part.id === "arch/all")!;
  TestValidator.equals(
    "neutral is the rest geometry",
    arch.geometry.type === "mesh" ? arch.geometry.mesh.positions : [],
    basis.surfaces[1].positions,
  );
  const driven = humanFaceArticulationFixture().basis;
  delete driven.surfaces[0].targets.forwardTarget;
  TestValidator.predicate(
    "a joint-driving endpoint may reach no surface",
    createHumanFaceBasisBuilder(driven)(document).parts.length === 3,
  );
  const silent = humanFaceArticulationFixture().basis;
  silent.channels.push({
    id: "hum",
    kind: "expression",
    minimum: 0,
    maximum: 1,
    positive: "humTarget",
    negative: null,
  });
  TestValidator.predicate(
    "an ordinary endpoint that reaches nothing refuses",
    throwsError(() => createHumanFaceBasisBuilder(silent), "drive a joint"),
  );
  const bare = humanFaceArticulationFixture().basis;
  delete bare.articulation;
  for (const surface of bare.surfaces) delete surface.attachments;
  TestValidator.predicate(
    "landmarks without articulation still admit",
    createHumanFaceBasisBuilder(bare)(document).parts.length === 3,
  );
};
