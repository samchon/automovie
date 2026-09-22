import { TestValidator } from "@nestia/e2e";

import { migrateNumericalHairDocuments } from "../../../scripts/face-review/migrateNumericalHairDocuments";
import { numericalHairBasisFixture } from "../internal/numericalHairBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * A hair representation migration preserves independent face edits and binds
 * the entire population and simple map to the same unchanged facial basis.
 * Scenarios:
 * 1. Reordered scalar profiles join by identity, preserving asymmetric weights.
 * 2. Source, population, geometry and numerical-profile errors refuse atomically.
 * 3. Absent and null historical hair and an empty population are admitted.
 */
export const test_subject_numerical_hair_migration = (): void => {
  const { basis, document } = numericalHairBasisFixture();
  const source = structuredClone(basis);
  delete source.surfaces[0].hairDomains;
  const candidate = { ...basis, id: "next" };
  const input: Parameters<typeof migrateNumericalHairDocuments>[0] = {
    source,
    candidate,
    controls: { basis: source.id, groups: [] },
    documents: [
      { ...document, shape: { translate: 0.25 }, hair: "historical-key" },
      { ...document, id: "second", hair: null },
    ],
    hairstyles: [
      { id: "second", hair: null },
      { id: document.id, hair: document.hair! },
    ],
  };
  const before = structuredClone(input);
  const result = migrateNumericalHairDocuments(input);
  TestValidator.equals(
    "independent facial state survives",
    result.documents[0],
    {
      ...document,
      basis: "next",
      shape: { translate: 0.25 },
    },
  );
  TestValidator.equals(
    "explicit hairless document",
    result.documents[1].hair,
    null,
  );
  TestValidator.equals("control map rebound", result.controls.basis, "next");
  result.documents[0].hair!.layers[0].lengthAxes[0] = 0.123;
  result.controls.groups.push({
    id: "x",
    label: "x",
    description: "x",
    channels: [],
  });
  TestValidator.equals("successful outputs own all data", input, before);

  for (const modify of [
    (p: typeof input) => {
      p.candidate.id = p.source.id;
    },
    (p: typeof input) => {
      p.candidate.surfaces[0].positions[0] += 0.001;
    },
    (p: typeof input) => {
      p.documents.push(structuredClone(p.documents[0]));
    },
    (p: typeof input) => {
      p.hairstyles.push(structuredClone(p.hairstyles[0]));
    },
    (p: typeof input) => {
      p.hairstyles.pop();
    },
    (p: typeof input) => {
      p.hairstyles[0].id = "unknown";
    },
    (p: typeof input) => {
      p.documents[0].basis = "stale";
    },
    (p: typeof input) => {
      Object.assign(p.documents[0], { hair: { layers: [] } });
    },
    (p: typeof input) => {
      p.controls.basis = "stale";
    },
    (p: typeof input) => {
      p.hairstyles[1].hair!.layers[0].width = -1;
    },
    (p: typeof input) => {
      p.documents[0].shape.translate = 2;
    },
  ]) {
    const invalid = structuredClone(input);
    modify(invalid);
    const unchanged = structuredClone(invalid);
    TestValidator.predicate(
      "inconsistent migration refuses",
      throwsError(() => migrateNumericalHairDocuments(invalid)),
    );
    TestValidator.equals("refusal does not mutate input", invalid, unchanged);
  }
  delete input.documents[0].hair;
  TestValidator.equals(
    "absent historical hair can gain numbers",
    migrateNumericalHairDocuments(input).documents[0].hair,
    document.hair,
  );
  input.documents = [];
  input.hairstyles = [];
  TestValidator.equals(
    "empty population",
    migrateNumericalHairDocuments(input).documents,
    [],
  );
};
