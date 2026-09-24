import {
  type IAutoMovieHumanFaceBasis,
  createPortraitMaterials,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  measureFaceBrowRest,
  prepareBrowRestBasis,
  skinFront,
} from "../../../scripts/face-review/prepareBrowRestBasis";
import { nclose, throwsError } from "../internal/predicates";

/**
 * An analytic head: an inclined skin plane z = 0.1 + 0.5 y over
 * x, y in [-0.1, 0.1]; two globe triangles whose front-most vertices (the
 * corneal apexes) sit at (+-0.03, 0, 0.12); two brow triangles whose vertex
 * over each apex sits 8 mm above it (the others 12 mm and 1 cm aside), all
 * 1 mm in front of the skin.
 */
const head = (): IAutoMovieHumanFaceBasis => {
  const region = (id: string, indices: number[]) => [
    { id: `${id}/skin`, material: "skin", indices, uvs: null },
  ];
  const brow = (x: number) => [
    [x - 0.01, 0.012, 0.1 + 0.5 * 0.012 + 0.001],
    [x + 0.01, 0.012, 0.1 + 0.5 * 0.012 + 0.001],
    [x, 0.008, 0.1 + 0.5 * 0.008 + 0.001],
  ];
  const skin = [
    [-0.1, -0.1, 0.05],
    [0.1, -0.1, 0.05],
    [0.1, 0.1, 0.15],
    [-0.1, 0.1, 0.15],
  ];
  const globe = (x: number) => [
    [x - 0.005, -0.005, 0.11],
    [x + 0.005, -0.005, 0.11],
    [x, 0, 0.12],
  ];
  return {
    id: "analytic-brow/1",
    channels: [],
    surfaces: [
      {
        id: "skin",
        positions: skin.flat(),
        indices: [0, 1, 2, 0, 2, 3],
        targets: {},
        regions: region("skin", [0, 1, 2, 0, 2, 3]),
      },
      {
        id: "eyes",
        positions: [...globe(-0.03), ...globe(0.03)].flat(),
        indices: [0, 1, 2, 3, 4, 5],
        targets: {},
        regions: region("eyes", [0, 1, 2, 3, 4, 5]),
      },
      {
        id: "brows",
        positions: [...brow(-0.03), ...brow(0.03)].flat(),
        indices: [0, 1, 2, 3, 4, 5],
        targets: {},
        regions: region("brows", [0, 1, 2, 3, 4, 5]),
      },
    ],
    materials: createPortraitMaterials().filter((one) => one.id === "skin"),
  };
};

/**
 * Seating the brow card at a measured resting height.
 * Scenarios:
 * 1. The brow height is the lowest brow vertex over each cornea above the
 *    inferior limbus (apex less 5.85 mm): 8 + 5.85 = 13.85 mm.
 * 2. Preparing to 19.55 mm lifts the card 5.7 mm, every vertex keeps its
 *    1 mm clearance in front of the inclined skin, and the skin and globes
 *    do not move; the document is restamped.
 * 3. skinFront reads the plane and nothing outside it.
 * 4. A repeated revision, a non-positive target and a missing surface refuse.
 */
export const test_subject_brow_rest_basis_preparation = (): void => {
  const basis = head();
  const options = {
    eyes: "eyes",
    brows: "brows",
    limbus: 0.00585,
    band: 0.002,
  };
  TestValidator.predicate(
    "brow height",
    nclose(measureFaceBrowRest({ basis, ...options }), 0.01385, 1e-9),
  );
  const base = {
    basis,
    documents: [
      { id: "one", name: "one", basis: basis.id, shape: {}, expression: {} },
    ],
    controls: { basis: basis.id, groups: [] },
    revision: "analytic-brow/2",
    targetMetres: 0.01955,
    skin: "skin",
    ...options,
  };
  const prepared = prepareBrowRestBasis(base);
  const brows = prepared.basis.surfaces[2]!.positions;
  const clearance = Array.from(
    { length: 6 },
    (_, v) => brows[3 * v + 2]! - (0.1 + 0.5 * brows[3 * v + 1]!),
  );
  TestValidator.predicate(
    "lifted along the skin",
    nclose(prepared.receipt.liftMetres, 0.0057, 1e-7) &&
      nclose(prepared.receipt.afterMetres, 0.01955, 1e-7) &&
      clearance.every((one) => nclose(one, 0.001, 1e-9)) &&
      prepared.basis.surfaces[0]!.positions.every(
        (p, i) => p === basis.surfaces[0]!.positions[i],
      ) &&
      prepared.basis.surfaces[1]!.positions.every(
        (p, i) => p === basis.surfaces[1]!.positions[i],
      ) &&
      prepared.documents[0]!.basis === "analytic-brow/2",
  );
  const skin = basis.surfaces[0]!;
  TestValidator.predicate(
    "skin front",
    nclose(skinFront(skin.positions, skin.indices, 0.02, 0.04)!, 0.12, 1e-12) &&
      skinFront(skin.positions, skin.indices, 0.5, 0) === null,
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => prepareBrowRestBasis({ ...base, revision: basis.id }),
      "distinct revision",
    ) &&
      throwsError(
        () => prepareBrowRestBasis({ ...base, targetMetres: 0 }),
        "positive length",
      ) &&
      throwsError(
        () => prepareBrowRestBasis({ ...base, skin: "absent" }),
        "skin and brow",
      ),
  );
};
