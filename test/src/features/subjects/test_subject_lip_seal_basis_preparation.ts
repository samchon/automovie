import {
  type IAutoMovieHumanFaceBasis,
  createPortraitMaterials,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { prepareLipSealBasis } from "../../../scripts/face-review/prepareLipSealBasis";
import { nclose, throwsError } from "../internal/predicates";

const expression = (id: string) => ({
  id,
  kind: "expression" as const,
  minimum: 0,
  maximum: 1,
  positive: id,
  negative: null,
});

/**
 * Lips: vertex 0 the upper seam at y 0.001, vertex 1 the lower seam at
 * y -0.001, and a third vertex closing one triangle. Each side's smile lifts
 * the upper seam 1.5 mm and the lower 3 mm; each side's lower-lip depressor
 * drops the lower seam 2 mm.
 */
const head = (): IAutoMovieHumanFaceBasis => ({
  id: "analytic-lips/1",
  channels: [
    expression("smileLeft"),
    expression("smileRight"),
    expression("downLeft"),
    expression("downRight"),
  ],
  surfaces: [
    {
      id: "lips",
      positions: [0, 0.001, 0, 0, -0.001, 0, 0.01, 0, 0],
      indices: [0, 1, 2],
      targets: {
        smileLeft: [0, 0, 0.0015, 0, 1, 0, 0.003, 0],
        smileRight: [0, 0, 0.0015, 0, 1, 0, 0.003, 0],
        downLeft: [1, 0, -0.002, 0],
        downRight: [1, 0, -0.002, 0],
      },
      regions: [
        { id: "lips/skin", material: "skin", indices: [0, 1, 2], uvs: null },
      ],
    },
  ],
  materials: createPortraitMaterials().filter((one) => one.id === "skin"),
});

/**
 * Sealing a closed-lip unit with the lip depressor.
 * Scenarios:
 * 1. The bilateral smile closes the 2 mm rest aperture by 3 mm; adding 0.75
 *    of each side's depressor to that side's smile gives the lower seam back
 *    3 mm, so the bilateral smile keeps the rest aperture, and the depressor
 *    and the neutral are untouched.
 * 2. A depressor too weak to seal inside its envelope, a depressor that does
 *    not move the seam, a missing channel, a missing lip surface and a
 *    repeated revision refuse.
 */
export const test_subject_lip_seal_basis_preparation = (): void => {
  const basis = head();
  const base = {
    basis,
    documents: [
      { id: "one", name: "one", basis: basis.id, shape: {}, expression: {} },
    ],
    controls: { basis: basis.id, groups: [] },
    revision: "analytic-lips/2",
    unit: "smile",
    depressor: "down",
    lips: { surface: "lips", upper: 0, lower: 1 },
  };
  const prepared = prepareLipSealBasis(base);
  const { receipt } = prepared;
  const smile = prepared.basis.surfaces[0]!.targets.smileLeft!;
  TestValidator.predicate(
    "sealed",
    nclose(receipt.factor, 0.75, 1e-9) &&
      nclose(receipt.apertureMetres.rest, 0.002, 1e-12) &&
      nclose(receipt.apertureMetres.before, -0.001, 1e-12) &&
      nclose(receipt.apertureMetres.after, 0.002, 1e-9) &&
      smile.length === 8 &&
      nclose(smile[6]!, 0.0015, 1e-9) &&
      prepared.basis.surfaces[0]!.targets.downLeft!.join() ===
        basis.surfaces[0]!.targets.downLeft!.join() &&
      prepared.basis.surfaces[0]!.positions.join() ===
        basis.surfaces[0]!.positions.join() &&
      prepared.documents[0]!.basis === "analytic-lips/2",
  );
  const weak = head();
  weak.surfaces[0]!.targets.downLeft = [1, 0, -0.0005, 0];
  weak.surfaces[0]!.targets.downRight = [1, 0, -0.0005, 0];
  const still = head();
  still.surfaces[0]!.targets.downLeft = [2, 0, -0.002, 0];
  still.surfaces[0]!.targets.downRight = [2, 0, -0.002, 0];
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => prepareLipSealBasis({ ...base, basis: weak }),
      "outside its envelope",
    ) &&
      throwsError(
        () => prepareLipSealBasis({ ...base, basis: still }),
        "does not move the seam",
      ) &&
      throwsError(
        () => prepareLipSealBasis({ ...base, depressor: "absent" }),
        "no expression channel absentLeft",
      ) &&
      throwsError(
        () =>
          prepareLipSealBasis({
            ...base,
            lips: { ...base.lips, surface: "absent" },
          }),
        "No lip surface",
      ) &&
      throwsError(
        () => prepareLipSealBasis({ ...base, revision: basis.id }),
        "distinct revision",
      ),
  );
};
