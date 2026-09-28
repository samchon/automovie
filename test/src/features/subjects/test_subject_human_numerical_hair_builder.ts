import {
  createHumanFaceBasisBuilder,
  parseHumanFaceBasisDocument,
  serializeHumanFaceBasisDocument,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { numericalHairBasisFixture } from "../internal/numericalHairBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The actual connected builder consumes numerical hair in the same document.
 * Scenarios:
 * 1. Owned documents round-trip and generate a second part without a guide asset.
 * 2. Empty/null/omitted hair stays bald; unknown domains and old keys refuse.
 * 3. Later mutation of the input basis cannot change its compiled correspondence.
 * 4. Renaming a document leaves every generated part and material unchanged.
 */
export const test_subject_human_numerical_hair_builder = (): void => {
  const { basis, document } = numericalHairBasisFixture();
  const before = structuredClone(document);
  const build = createHumanFaceBasisBuilder(basis);
  TestValidator.equals(
    "numerical document round trip",
    parseHumanFaceBasisDocument(serializeHumanFaceBasisDocument(document)),
    before,
  );
  basis.surfaces[0].hairDomains![0].triangles.length = 0;
  basis.surfaces[0].positions.fill(0);
  const model = build(document);
  const renamed = build({
    ...document,
    id: "renamed",
    name: "Different label",
  });
  TestValidator.equals(
    "identity labels do not select geometry",
    renamed.parts,
    model.parts,
  );
  TestValidator.equals(
    "identity labels do not select appearance",
    renamed.materials,
    model.materials,
  );
  TestValidator.equals("generated hair part", model.parts.length, 2);
  TestValidator.equals("document ownership", document, before);
  const skin = model.parts[0].geometry;
  if (skin.type !== "mesh") throw new Error("Expected resident skin mesh.");
  TestValidator.predicate(
    "compiled surface retains the analytic 100 mm L1 ball",
    Array.from({ length: skin.mesh.positions.length / 3 }, (_, at) =>
      nclose(
        skin.mesh.positions
          .slice(3 * at, 3 * at + 3)
          .reduce((sum, value) => sum + Math.abs(value), 0),
        0.1,
        1e-12,
      ),
    ).every(Boolean),
  );
  for (const value of [null, undefined, { layers: [] }])
    TestValidator.equals(
      "empty hairstyle",
      build({ ...document, hair: value }).parts.length,
      1,
    );
  const absent = structuredClone(document);
  absent.hair!.layers[0].domain = "absent";
  TestValidator.predicate(
    "unknown domain refuses",
    throwsError(() => build(absent)),
  );
  TestValidator.predicate(
    "old resource refuses at admission",
    throwsError(() =>
      parseHumanFaceBasisDocument(
        JSON.stringify({ ...document, hair: "old-person" }),
      ),
    ),
  );
};
