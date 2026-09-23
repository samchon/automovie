import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import { createHumanFaceBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { numericalHairBasisFixture } from "../internal/numericalHairBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * A guided layer builds the same population through the real builder.
 * Scenarios:
 * 1. With every root a guide (fraction 1) the guided layer builds exactly the
 *    flat layer's geometry.
 * 2. With a quarter of sixteen roots as guides, the layer still yields one
 *    ribbon per root, and every ribbon vertex past the root lies outside the
 *    head: interpolated strands are projected by the guides' contact rule.
 * 3. A fraction so small that no root is chosen refuses by name.
 */
export const test_subject_human_numerical_hair_guided = (): void => {
  const { basis, document } = numericalHairBasisFixture();
  const build = createHumanFaceBasisBuilder(basis);
  const flat = build(document);
  const everyRoot = structuredClone(document);
  for (const layer of everyRoot.hair!.layers)
    layer.guides = { fraction: 1, neighbours: 3 };
  TestValidator.equals(
    "all-guide layer equals the flat layer",
    build(everyRoot).parts,
    flat.parts,
  );
  const guided = structuredClone(document);
  const layer = guided.hair!.layers[0];
  layer.count = 16;
  layer.guides = { fraction: 0.25, neighbours: 3 };
  const model = build(guided);
  const hair = model.parts.find((part) =>
    part.id.startsWith("numerical-hair:"),
  )!.geometry;
  const skin = model.parts[0].geometry;
  if (hair.type !== "mesh" || skin.type !== "mesh")
    throw new Error("Expected resident meshes.");
  const roots = hair.mesh.uvs!.filter((_, at) => at % 2 === 1 && _ === 0);
  TestValidator.equals("one ribbon per root", roots.length, 16);
  const query = createAutoMovieSignedMeshQuery({
    positions: basis.surfaces[0].positions,
    indices: basis.surfaces[0].indices,
    normals: null,
    uvs: null,
    skin: null,
  });
  let inside = 0;
  for (let at = 0; at < hair.mesh.positions.length / 3; at++) {
    if (hair.mesh.uvs![2 * at + 1] === 0) continue;
    if (query(hair.mesh.positions.slice(3 * at, 3 * at + 3)).signedDistance < 0)
      inside++;
  }
  TestValidator.equals("strands stay outside the head", inside, 0);
  const starved = structuredClone(guided);
  starved.hair!.layers[0].guides = { fraction: 1e-9, neighbours: 3 };
  TestValidator.predicate(
    "a fraction that selects no guide refuses",
    throwsError(() => build(starved), "selected no guide"),
  );
};
