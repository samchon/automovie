import { createHumanFaceBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Compact colour follows shared source correspondence through shape, expression
 * and material seams. The unit square supplies an independent spatial oracle.
 *
 * Scenarios:
 * 1. Centre red gain is 1/2; at half radius the C2 compact-support weight is 3/16.
 * 2. Widening and lifting carry colours unchanged without moving other geometry.
 * 3. Empty fields produce white; absent/null fields allocate no colour buffer.
 * 4. An unknown surface refuses and an admitted edit works afterwards.
 * 5. Mutating a returned buffer cannot change another evaluation or the input.
 */
export const test_subject_human_basis_pigmentation = (): void => {
  const { basis, document } = humanFaceBasisFixture();
  document.skin = {
    square: [
      {
        name: "mark",
        center: [0, 0, 0],
        radius: [2, 2, 2],
        gain: [0.5, 1, 1],
        strength: 1,
      },
    ],
  };
  const saved = structuredClone(document);
  const build = createHumanFaceBasisBuilder(basis);
  const neutral = build(document);
  const performed = build({
    ...document,
    shape: { width: 1 },
    expression: { lift: 1 },
  });
  const bare = build({
    ...document,
    skin: null,
    shape: { width: 1 },
    expression: { lift: 1 },
  });
  for (const [index, part] of performed.parts.entries()) {
    if (
      part.geometry.type !== "mesh" ||
      neutral.parts[index].geometry.type !== "mesh"
    )
      throw new Error("Expected analytic mesh.");
    const mesh = part.geometry.mesh;
    const reference = neutral.parts[index].geometry;
    if (reference.type !== "mesh") throw new Error("Expected reference mesh.");
    TestValidator.equals(
      "colour follows reference",
      mesh.colors,
      reference.mesh.colors,
    );
    const withoutColour = structuredClone(part);
    if (withoutColour.geometry.type !== "mesh")
      throw new Error("Expected owned mesh.");
    delete withoutColour.geometry.mesh.colors;
    TestValidator.equals(
      "pigment preserves geometry",
      withoutColour,
      bare.parts[index],
    );
  }
  const first = neutral.parts[0].geometry,
    second = neutral.parts[1].geometry;
  if (first.type !== "mesh" || second.type !== "mesh")
    throw new Error("Expected seam meshes.");
  TestValidator.predicate("centre oracle", nclose(first.mesh.colors![0], 0.5));
  TestValidator.predicate(
    "half radius oracle",
    nclose(first.mesh.colors![3], 29 / 32),
  );
  TestValidator.equals(
    "shared seam colour",
    first.mesh.colors!.slice(0, 3),
    second.mesh.colors!.slice(0, 3),
  );
  const empty = build({ ...document, skin: { square: [] } }).parts[0].geometry;
  if (empty.type !== "mesh") throw new Error("Expected empty-field mesh.");
  TestValidator.equals("empty white", empty.mesh.colors, new Array(9).fill(1));
  for (const skin of [undefined, null, {}]) {
    const plain = build({ ...document, skin }).parts[0].geometry;
    if (plain.type !== "mesh") throw new Error("Expected bare mesh.");
    TestValidator.equals("no allocated colours", plain.mesh.colors, undefined);
  }
  TestValidator.predicate(
    "unknown surface refuses",
    throwsError(
      () => build({ ...document, skin: { absent: [] } }),
      "resident basis surface",
    ),
  );
  first.mesh.colors![0] = 0;
  TestValidator.equals("owned input", document, saved);
  TestValidator.equals(
    "recovery independent of previous output",
    build(document),
    build(saved),
  );
};
