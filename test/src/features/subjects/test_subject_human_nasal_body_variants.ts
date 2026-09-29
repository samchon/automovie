import { resolveHumanFaceDocument } from "@automovie/human";
import { createPortraitNasalBodySurface } from "@automovie/human/face/anatomy/nose/createPortraitNasalBodySurface";
import { TestValidator } from "@nestia/e2e";

import { humanFaceFixture } from "../internal/humanFaceFixture";
import { throwsError } from "../internal/predicates";

/**
 * Alternative nasal surfaces are source-basis geometry. Detailed scalar fields
 * can refine the chosen alternative but cannot submit new free section arrays.
 *
 * Scenarios:
 * 1. Each source alternative replays with inherited joining distances.
 * 2. Same-loft scalar edits preserve stations; a changed section or fullness
 *    array refuses. Empty removal and ambiguous source shapes stay explicit.
 */
export const test_subject_human_nasal_body_variants = (): void => {
  type Shape = Parameters<typeof createPortraitNasalBodySurface>[0];
  const additive: Shape = {
    stations: [0, 1].map((height) => ({
      height,
      centre: 0,
      shoulder: 0,
      ala: 0,
    })),
    centreWidth: 1,
    shoulderOffset: 2,
    shoulderWidth: 1,
    alarOffset: 3,
    alarWidth: 1,
    fullness: [0, 0],
    spread: [0, 0],
    creaseOffset: 1,
    creaseWidth: 1,
    crease: [0, 0],
  };
  const section = {
    transverse: [-3, -1, 1, 3],
    stations: [-3, -1, 1, 3].map((height) => ({
      height,
      depths: [0, 0, 0, 0],
    })),
    joinWidth: 1,
    influence: 1,
  };
  const variants: Shape[] = [additive, { section }, { lobules: [] }];
  const create = (shape: Shape) => {
    const document = humanFaceFixture("nasal-alternative");
    document.basis.recipe.nose.body = {
      shape: structuredClone(shape),
      joinWidth: 2,
      depthReach: 40,
    };
    return document;
  };
  for (const basis of variants) {
    const document = create(basis);
    document.detail = { nose: { body: { joinWidth: 3 } } };
    const saved = structuredClone(document),
      actual = resolveHumanFaceDocument(document).recipe.nose.body!;
    TestValidator.equals("source payload retained", actual.shape, basis);
    TestValidator.equals(
      "surrounding dimensions admit scalar detail",
      [actual.joinWidth, actual.depthReach],
      [3, 40],
    );
    TestValidator.equals("input ownership", document, saved);
  }
  const partial = create({ section });
  partial.detail = {
    nose: { body: { shape: { section: { influence: 0.3 } } } },
  };
  TestValidator.equals(
    "same loft retains its controls",
    resolveHumanFaceDocument(partial).recipe.nose.body!.shape,
    { section: { ...section, influence: 0.3 } },
  );
  const plain = create(additive);
  plain.detail = {
    nose: { body: { shape: { fullness: [0.2, 0.3] } } },
  } as never;
  TestValidator.predicate(
    "changed fullness array refuses",
    throwsError(() => resolveHumanFaceDocument(plain), "source geometry array"),
  );
  plain.detail = { nose: { body: { shape: {} } } };
  TestValidator.equals(
    "empty override is not a mode switch",
    resolveHumanFaceDocument(plain).recipe.nose.body!.shape,
    additive,
  );
  for (let i = 0; i < variants.length; i++)
    for (let j = i + 1; j < variants.length; j++) {
      const mixed = { ...variants[i], ...variants[j] } as Shape;
      TestValidator.predicate(
        "one object cannot select two alternatives",
        throwsError(
          () => createPortraitNasalBodySurface(mixed, 0, 1, [0, 0, 1], 2, 40),
          "one final nasal target",
        ),
      );
      const document = create(variants[i]);
      document.detail = { nose: { body: { shape: mixed } } } as never;
      TestValidator.predicate(
        "mixed editable arrays refuse before construction",
        throwsError(
          () => resolveHumanFaceDocument(document),
          "source geometry array",
        ),
      );
    }
};
