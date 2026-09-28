import {
  type IAutoMovieHumanFaceBasis,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  decomposeExpressionResiduals,
  denseRows,
  sparseRows,
} from "../../../scripts/face-review/articulatedResiduals";
import { articulatedBasisFixture } from "../internal/articulatedBasisFixture";
import { humanFaceArticulationFixture } from "../internal/humanFaceArticulationFixture";
import { nclose } from "../internal/predicates";

/**
 * Expression endpoints and correctives become rest-space residuals over the
 * articulation, bone publishes none, and a carrier loses what it carried.
 * Scenarios:
 * 1. Sparse and dense row conversion round-trips and drops rows that round
 *    to zero.
 * 2. On the analytic fixture, the opening endpoint of a fully attached arch
 *    is dropped with its magnitude, the skin's opening residual is exactly the
 *    authored tissue offset, and an unattached-surface channel keeps its rows.
 * 3. The carrier's residual, taken at the carried joint state minus the
 *    carried residual, is its own row alone; a corrective driven by other
 *    channels is kept.
 * 4. A corrective is rewritten so that the real builder reproduces the
 *    authored combined pose at its drivers' peaks.
 */
export const test_subject_articulated_residuals = (): void => {
  const dense = denseRows(3, [1, 0.5, 0, 0.00000004]);
  TestValidator.equals(
    "dense to sparse rounds and omits zero rows",
    sparseRows(dense, 7),
    [1, 0.5, 0, 0],
  );
  const input = articulatedBasisFixture();
  const basis = structuredClone(input.basis) as IAutoMovieHumanFaceBasis;
  for (const surface of basis.surfaces)
    delete (surface as { rigidGroups?: unknown }).rigidGroups;
  basis.landmarks = input.attachments.landmarks;
  basis.articulation = {
    jaw: {
      pivot: "joint-mouth",
      axisOffset: [0, 0, 0],
      axis: [1, 0, 0],
      opening: { channel: "open", degrees: 30, translation: [0, 0, 0] },
      protrusion: { channel: "forward", translation: [0, 0, 0.4] },
      laterotrusion: {
        left: { channel: "left", translation: [0.3, 0, 0] },
        right: { channel: "right", translation: [-0.3, 0, 0] },
      },
      translationLimitMetres: 0.5,
    },
    eyes: [
      {
        id: "leftEye",
        center: "joint-l-eye",
        gaze: [
          {
            channel: "gazeIn",
            axis: [0, 1, 0],
            degrees: 20,
            translation: [0, 0, 0],
          },
        ],
      },
    ],
  };
  basis.surfaces[0].attachments = [{ owner: "jaw", rows: [2, 0.5, 3, 1] }];
  basis.surfaces[1].attachments = [
    { owner: "jaw", rows: [0, 1, 1, 1, 2, 1, 3, 1] },
  ];
  basis.surfaces[2].attachments = [
    { owner: "leftEye", rows: [0, 1, 1, 1, 2, 1, 3, 1] },
  ];
  const authoredSkin = structuredClone(basis.surfaces[0].targets);
  const result = decomposeExpressionResiduals({
    basis,
    boneSurfaces: new Set(["arch", "globe"]),
    carriers: [{ channel: "carry", carried: "open" }],
    decimals: 9,
  });
  const droppedOpen = result.dropped.find(
    (d) => d.surface === "arch" && d.endpoint === "openTarget",
  );
  TestValidator.predicate(
    "the arch's opening rows are dropped with their magnitude",
    droppedOpen !== undefined &&
      droppedOpen.maxMetres > 0.3 &&
      basis.surfaces[1].targets.openTarget === undefined,
  );
  TestValidator.equals(
    "the skin's opening residual is the authored tissue offset",
    basis.surfaces[0].targets.openTarget,
    [0, 0, 0, 0.07],
  );
  TestValidator.equals(
    "an unarticulated endpoint keeps its rows",
    basis.surfaces[0].targets.gazeInTarget,
    authoredSkin.gazeInTarget,
  );
  TestValidator.equals(
    "the carrier keeps only its own rows",
    basis.surfaces[0].targets.carryTarget,
    [1, 0, 0, 0.09],
  );
  TestValidator.equals(
    "a corrective the carrier does not drive survives",
    result.removedCorrectives,
    [],
  );
  // The corrective must reproduce the authored combined pose through the
  // real builder: neutral + open + forward + corrective on the skin.
  const build = createHumanFaceBasisBuilder(basis);
  const model = build({
    id: "x",
    name: "x",
    basis: basis.id,
    shape: {},
    expression: { open: 1, forward: 1 },
  });
  const skin = model.parts.find((p) => p.id === "skin/all")!;
  const positions =
    skin.geometry.type === "mesh" ? skin.geometry.mesh.positions : [];
  const source = input.basis.surfaces[0];
  const expected = denseRows(4, source.targets.openTarget);
  for (const name of ["forwardTarget", "openForwardTarget"]) {
    const rows = denseRows(4, source.targets[name]);
    for (let i = 0; i < expected.length; i++) expected[i] += rows[i];
  }
  const mesh = skin.geometry.type === "mesh" ? skin.geometry.mesh : null;
  let worst = 0;
  source.regions[0].indices.forEach((sourceVertex, corner) => {
    const gathered = mesh!.indices![corner];
    for (let axis = 0; axis < 3; axis++)
      worst = Math.max(
        worst,
        Math.abs(
          positions[3 * gathered + axis] -
            source.positions[3 * sourceVertex + axis] -
            expected[3 * sourceVertex + axis],
        ),
      );
  });
  TestValidator.predicate(
    "the rewritten corrective replays the authored combined pose",
    nclose(worst, 0, 1e-8),
  );
  const plain = humanFaceArticulationFixture().basis;
  TestValidator.equals(
    "no correctives and no carriers leave nothing removed",
    decomposeExpressionResiduals({
      basis: plain,
      boneSurfaces: new Set(),
      carriers: [],
      decimals: 7,
    }).removedCorrectives,
    [],
  );
};
