import { admitHumanBodyAnatomicalDocument } from "@automovie/human/body/document/admitHumanBodyAnatomicalDocument";
import { parseHumanBodyAnatomicalDocument } from "@automovie/human/body/document/parseHumanBodyAnatomicalDocument";
import { serializeHumanBodyAnatomicalDocument } from "@automovie/human/body/document/serializeHumanBodyAnatomicalDocument";
import { TestValidator } from "@nestia/e2e";

import { bodyAnatomicalInspectionFixture } from "../internal/bodyAnatomicalInspectionFixture";
import { throwsError } from "../internal/predicates";

/**
 * Complete admission and immutable numerical replay preserve unknowns instead of adding a reference shape.
 *
 * Scenarios:
 * 1. Complete detailed and simple requests roundtrip without mutation; observed context and omitted anatomy remain intact.
 * 2. Unsupported revisions, empty identities, missing context, extra keys and nonphysical values refuse; canonical replay recovers.
 */
export function test_human_body_anatomical_document(): void {
  const { document } = bodyAnatomicalInspectionFixture();
  const before = JSON.stringify(document);
  TestValidator.equals("same canonical request", parseHumanBodyAnatomicalDocument(serializeHumanBodyAnatomicalDocument(document)), document);
  TestValidator.equals("read-only IO", JSON.stringify(document), before);
  if (document.tier !== "detailed") throw new Error("fixture tier");
  const observed = {
    ...document,
    targets: {
      ...document.targets,
      age: { kind: "observed" as const, years: 30 },
      surface: { ...document.targets.surface, mass: { kind: "observed" as const, kilograms: 65, method: "scale" as const } },
    },
  };
  TestValidator.equals("observations survive IO", parseHumanBodyAnatomicalDocument(serializeHumanBodyAnatomicalDocument(observed)), observed);
  const simple = { ...document, tier: "simple" as const, targets: { ageYears: 30, standingStatureMetres: 1.7, bodyMassKilograms: 65, pairedMidUpperArmGirthMetres: .3 } };
  TestValidator.equals("simple targets retain their tier", admitHumanBodyAnatomicalDocument(simple), simple);
  for (const invalid of [
    { ...document, generatorRevision: "unqualified/2" },
    ...["id", "name", "basis"].map((key) => ({ ...document, [key]: " " })),
    { ...document, shape: {} },
    { ...document, targets: { ...document.targets, age: undefined } },
    { ...document, targets: { ...document.targets, surface: { mass: document.targets.surface.mass } } },
    { ...document, targets: { ...document.targets, surface: { stature: document.targets.surface.stature } } },
    { ...document, targets: { ...document.targets, vertices: [0, 0, 0] } },
    { ...document, targets: { ...document.targets, leftUpperLimb: {} } },
    { ...simple, targets: { ...simple.targets, standingStatureMetres: 0 } },
  ]) TestValidator.predicate("invalid request refuses", throwsError(() => admitHumanBodyAnatomicalDocument(invalid)));
  TestValidator.predicate("nonfinite values do not save as null", throwsError(() => serializeHumanBodyAnatomicalDocument({ ...document, targets: { ...document.targets, age: { kind: "target", years: NaN } } })));
  TestValidator.predicate("malformed JSON refuses", throwsError(() => parseHumanBodyAnatomicalDocument("{")));
  TestValidator.equals("refusal does not poison recovery", parseHumanBodyAnatomicalDocument(serializeHumanBodyAnatomicalDocument(document)), document);
}
