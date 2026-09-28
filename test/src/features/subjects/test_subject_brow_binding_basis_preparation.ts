import {
  type IAutoMovieHumanFaceBasis,
  createPortraitMaterials,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  attachFaceCard,
  prepareBrowBindingBasis,
} from "../../../scripts/face-review/prepareBrowBindingBasis";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Skin: the unit square at z = 0 as two triangles, with a `lift` row moving
 * vertex 2 (1, 1) up by 0.4. Card: one triangle in front of it at z = 0.1,
 * with a stale `lift` row and a card-only `stale` row.
 */
const head = (): IAutoMovieHumanFaceBasis => ({
  id: "analytic-card/1",
  channels: [
    {
      id: "lift",
      kind: "shape",
      minimum: 0,
      maximum: 1,
      positive: "lift",
      negative: null,
    },
  ],
  surfaces: [
    {
      id: "skin",
      positions: [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
      indices: [0, 1, 2, 0, 2, 3],
      targets: { lift: [2, 0, 0.4, 0] },
      regions: [
        {
          id: "skin/skin",
          material: "skin",
          indices: [0, 1, 2, 0, 2, 3],
          uvs: null,
        },
      ],
    },
    {
      id: "card",
      positions: [0.5, 0.25, 0.1, 0.75, 0.5, 0.1, 0.25, 0.75, 0.1],
      indices: [0, 1, 2],
      targets: { lift: [0, 0, 1, 0], stale: [1, 0, 1, 0] },
      regions: [
        { id: "card/skin", material: "skin", indices: [0, 1, 2], uvs: null },
      ],
    },
  ],
  materials: createPortraitMaterials().filter((one) => one.id === "skin"),
});

/**
 * Binding the brow card to the skin under it.
 * Scenarios:
 * 1. attachFaceCard finds the triangle over a point with its barycentric
 *    weights, and nothing outside the surface.
 * 2. Each card vertex's lift row is the skin's lift blended at its
 *    attachment: vertex 2 of the skin carries 0.4, so (0.5, 0.25) on the
 *    first triangle gets 0.1, (0.75, 0.5) gets 0.2 and (0.25, 0.75) on the
 *    second gets 0.1; the card-only stale row is removed and listed, and the
 *    card's positions are untouched.
 * 3. A repeated revision and a missing surface refuse.
 */
export const test_subject_brow_binding_basis_preparation = (): void => {
  const basis = head();
  const skin = basis.surfaces[0]!;
  const found = attachFaceCard(skin.positions, skin.indices, 0.75, 0.5)!;
  TestValidator.predicate(
    "attachment",
    found.vertices.join() === "0,1,2" &&
      nclose(found.weights[0], 0.25, 1e-12) &&
      nclose(found.weights[2], 0.5, 1e-12) &&
      attachFaceCard(skin.positions, skin.indices, 2, 2) === null,
  );
  const base = {
    basis,
    documents: [
      { id: "one", name: "one", basis: basis.id, shape: {}, expression: {} },
    ],
    controls: { basis: basis.id, groups: [] },
    revision: "analytic-card/2",
    skin: "skin",
    card: "card",
  };
  const prepared = prepareBrowBindingBasis(base);
  const card = prepared.basis.surfaces[1]!;
  const lift = card.targets.lift!;
  const dy = (v: number) => lift[lift.indexOf(v) + 2]!;
  TestValidator.predicate(
    "rebound",
    lift.length === 12 &&
      nclose(dy(0), 0.1, 1e-12) &&
      nclose(dy(1), 0.2, 1e-12) &&
      nclose(dy(2), 0.1, 1e-12) &&
      card.targets.stale === undefined &&
      prepared.receipt.removed.join() === "stale" &&
      card.positions.every((p, i) => p === basis.surfaces[1]!.positions[i]) &&
      prepared.documents[0]!.basis === "analytic-card/2",
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => prepareBrowBindingBasis({ ...base, revision: basis.id }),
      "distinct revision",
    ) &&
      throwsError(
        () => prepareBrowBindingBasis({ ...base, card: "absent" }),
        "skin and card",
      ),
  );
};
