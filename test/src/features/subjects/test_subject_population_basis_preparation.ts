import {
  type IAutoMovieHumanFaceBasis,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { faceShapeFitSurfacePositions } from "../../../scripts/face-review/faceShapeFitSurface";
import { preparePopulationBasis } from "../../../scripts/face-review/preparePopulationBasis";
import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The population revision on the analytic square basis.
 * Scenarios:
 * 1. An ancestry share moves vertex 3 by its endpoint row, and with the
 *    shape channel at its positive side the product corrective adds its own
 *    row: share 1 and width 1 move vertex 3 by 0.1 + 0.02, share 0.5 and
 *    width 0.5 by a quarter of the corrective.
 * 2. A document setting neither is unchanged; documents and controls name
 *    the new revision and the control map gains the ancestry group.
 * 3. A repeated revision, an existing channel id, an unknown driver, an
 *    unknown surface, a vertex outside its surface and a ragged row refuse.
 */
export const test_subject_population_basis_preparation = (): void => {
  const { basis, document } = humanFaceBasisFixture();
  const rows = {
    channels: [
      {
        id: "someAncestry",
        kind: "shape" as const,
        minimum: 0,
        maximum: 1,
        positive: "someAncestry.positive",
        negative: null,
      },
    ],
    correctives: [
      {
        id: "population.some.width",
        inputs: [
          { channel: "someAncestry", side: "positive" as const },
          { channel: "width", side: "positive" as const },
        ],
        weight: 1,
        target: "population.some.width",
      },
    ],
    rows: {
      "someAncestry.positive": { square: [3, 0, 0.1, 0] },
      "population.some.width": { square: [3, 0, 0.02, 0], attachment: [] },
    },
  };
  const base = {
    basis,
    documents: [document],
    controls: { basis: basis.id, groups: [] },
    rows,
    revision: "analytic-square/population",
  };
  const prepared = preparePopulationBasis(base);
  const build = createHumanFaceBasisBuilder(prepared.basis);
  const y3 = (shape: Record<string, number>) =>
    faceShapeFitSurfacePositions(
      prepared.basis,
      build({ ...document, basis: prepared.basis.id, shape }),
      "square",
    )[3 * 3 + 1]!;
  TestValidator.predicate(
    "endpoint and product",
    nclose(y3({ someAncestry: 1 }), 1.1) &&
      nclose(y3({ someAncestry: 1, width: 1 }), 1.12) &&
      nclose(y3({ someAncestry: 0.5, width: 0.5 }), 1.05 + 0.005) &&
      nclose(y3({ width: 1 }), 1),
  );
  TestValidator.equals(
    "restamped",
    [
      prepared.basis.id,
      prepared.documents[0]!.basis,
      prepared.controls.basis,
      prepared.controls.groups.map((one) => one.id),
      prepared.receipt.correctives,
      prepared.receipt.rowVertices,
    ],
    [
      "analytic-square/population",
      "analytic-square/population",
      "analytic-square/population",
      ["someAncestry"],
      1,
      2,
    ],
  );
  const refuse = (change: object, message: string) =>
    throwsError(() => preparePopulationBasis({ ...base, ...change }), message);
  const withRows = (next: object) => ({ rows: { ...rows, ...next } });
  TestValidator.predicate(
    "refusals",
    refuse({ revision: basis.id }, "distinct revision") &&
      refuse(
        withRows({ channels: [{ ...rows.channels[0]!, id: "width" }] }),
        "already has width",
      ) &&
      refuse(
        withRows({
          correctives: [
            {
              ...rows.correctives[0]!,
              inputs: [{ channel: "absent", side: "positive" }],
            },
          ],
        }),
        "unknown channel absent",
      ) &&
      refuse(
        withRows({ rows: { x: { nowhere: [0, 0, 0, 0] } } }),
        "unknown surface",
      ) &&
      refuse(
        withRows({ rows: { x: { square: [9, 0, 0, 0] } } }),
        "outside square",
      ) &&
      refuse(withRows({ rows: { x: { square: [0, 0, 0] } } }), "not a list"),
  );
  const unused: IAutoMovieHumanFaceBasis = basis;
  TestValidator.predicate("input untouched", unused.channels.length === 2);
};
