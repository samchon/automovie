import { createHumanFaceBasisBuilder } from "@automovie/human";
import type { IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A skin field that lightens past its material is folded into the material.
 * The analytic square carries skin and lips regions; the attachment is skin
 * without a field.
 *
 * Scenarios:
 * 1. A centre gain of 1.2 red and 0.5 blue lifts both of the square's
 *    materials' red by 1.2 and leaves green and blue; every vertex colour
 *    stays in [0, 1]; each vertex's albedo (base times colour) equals the
 *    unfolded base times the field; the attachment's skin takes 1 / 1.2 red
 *    as colours of its own and keeps its albedo.
 * 2. A field within one leaves the materials as the basis has them.
 * 3. A lift carrying an albedo past one refuses by name.
 */
export const test_subject_human_basis_colour_lift = (): void => {
  const { basis, document } = humanFaceBasisFixture();
  const build = createHumanFaceBasisBuilder(basis);
  const base = new Map(
    basis.materials.map((material) => [
      material.id,
      [material.baseColor.r, material.baseColor.g, material.baseColor.b],
    ]),
  );
  const field = (gain: [number, number, number]) => ({
    square: [
      {
        name: "mark",
        center: [0, 0, 0] as [number, number, number],
        radius: [2, 2, 2] as [number, number, number],
        gain,
        strength: 1,
      },
    ],
  });
  const albedo = (model: IAutoMovieModel) =>
    model.parts.map((part) => {
      if (part.geometry.type !== "mesh") throw new Error("Expected a mesh.");
      const material = model.materials.find((one) => one.id === part.material)!;
      const rgb = [
        material.baseColor.r,
        material.baseColor.g,
        material.baseColor.b,
      ];
      const colors =
        part.geometry.mesh.colors ??
        new Array(part.geometry.mesh.positions.length).fill(1);
      return {
        colors,
        albedo: colors.map((value, i) => value * rgb[i % 3]!),
      };
    });
  const unfolded = albedo(build({ ...document, skin: field([1, 1, 0.5]) }));
  const lifted = build({ ...document, skin: field([1.2, 1, 0.5]) });
  const reading = albedo(lifted);
  const material = (id: string) =>
    lifted.materials.find((one) => one.id === id)!.baseColor;
  TestValidator.predicate(
    "materials lifted in red only",
    ["skin", "lips"].every(
      (id) =>
        nclose(material(id).r, base.get(id)![0]! * 1.2) &&
        material(id).g === base.get(id)![1] &&
        material(id).b === base.get(id)![2],
    ),
  );
  TestValidator.predicate(
    "colours within one",
    reading.every((one) =>
      one.colors.every((value) => value >= 0 && value <= 1),
    ),
  );
  const square = reading[0]!;
  TestValidator.predicate(
    "centre albedo kept",
    nclose(square.albedo[0]!, base.get("skin")![0]! * 1.2) &&
      nclose(square.albedo[2]!, unfolded[0]!.albedo[2]!),
  );
  const attachment = reading[2]!;
  TestValidator.predicate(
    "attachment keeps its albedo",
    attachment.colors.every((value, i) =>
      nclose(value, i % 3 === 0 ? 1 / 1.2 : 1),
    ) &&
      attachment.albedo.every((value, i) =>
        nclose(value, base.get("skin")![i % 3]!),
      ),
  );
  const within = build({ ...document, skin: field([0.9, 1, 0.5]) });
  TestValidator.equals(
    "no lift within one",
    within.materials.map((one) => one.baseColor),
    build({ ...document, skin: null }).materials.map((one) => one.baseColor),
  );
  TestValidator.predicate(
    "albedo past one refuses",
    throwsError(
      () =>
        build({
          ...document,
          skin: field([1 / base.get("lips")![0]! + 0.5, 1, 1]),
        }),
      "albedo above one",
    ),
  );
};
