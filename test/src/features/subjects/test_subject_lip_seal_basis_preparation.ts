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
 * drops the lower seam 2 mm; a midline press lifts the upper seam 1 mm
 * and the lower 3 mm.
 */
const head = (): IAutoMovieHumanFaceBasis => ({
  id: "analytic-lips/1",
  channels: [
    expression("smileLeft"),
    expression("smileRight"),
    expression("downLeft"),
    expression("downRight"),
    expression("press"),
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
        press: [0, 0, 0.001, 0, 1, 0, 0.003, 0],
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
 * 2. The midline press takes both depressors at 0.5 each, which gives the
 *    lower seam its 2 mm back.
 * 3. A depressor too weak to seal inside its envelope, a depressor that does
 *    not move the seam, a unit pairing two channels with one depressor, a
 *    missing channel, a missing lip surface and a repeated revision refuse.
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
    units: [
      {
        channels: ["smileLeft", "smileRight"],
        depressors: ["downLeft", "downRight"],
      },
      { channels: ["press"], depressors: ["downLeft", "downRight"] },
    ],
    lips: { surface: "lips", upper: 0, lower: 1 },
  };
  const prepared = prepareLipSealBasis(base);
  const { receipt } = prepared;
  const smile = prepared.basis.surfaces[0]!.targets.smileLeft!;
  const [smileRow, pressRow] = receipt.units;
  TestValidator.predicate(
    "sealed",
    nclose(smileRow!.factor, 0.75, 1e-9) &&
      nclose(receipt.restApertureMetres, 0.002, 1e-12) &&
      nclose(smileRow!.apertureMetres.before, -0.001, 1e-12) &&
      nclose(smileRow!.apertureMetres.after, 0.002, 1e-9) &&
      nclose(pressRow!.factor, 0.5, 1e-9) &&
      nclose(pressRow!.apertureMetres.after, 0.002, 1e-9) &&
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
        () =>
          prepareLipSealBasis({
            ...base,
            units: [{ channels: ["smileLeft"], depressors: ["absent"] }],
          }),
        "no expression channel absent",
      ) &&
      throwsError(
        () =>
          prepareLipSealBasis({
            ...base,
            units: [
              {
                channels: ["smileLeft", "smileRight"],
                depressors: ["downLeft"],
              },
            ],
          }),
        "one to one",
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
