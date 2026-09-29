import {
  assertHumanFaceEditableDetail,
  parseHumanFaceDocument,
  replaceHumanFaceRegion,
  resolveHumanFaceDocument,
  serializeHumanFaceDocument,
  setHumanFaceDetail,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceFixture } from "../internal/humanFaceFixture";
import { portraitHairShadeFixture } from "../internal/portraitHairShadeFixture";
import { throwsError } from "../internal/predicates";

/**
 * Immutable recipe arrays are inherited by omission or cleared; detail and
 * side overrides cannot submit a free curve, section or individual guide.
 */
export const test_subject_human_face_editable_detail = (): void => {
  const face = humanFaceFixture();
  // These casts deliberately exercise runtime refusal and historic exact
  // source copies; the public editable type excludes such nonempty arrays.
  const unsafeDetail = (value: unknown): void => {
    face.detail = value as typeof face.detail;
  };
  const unsafeSides = (value: unknown): void => {
    face.asymmetry = value as typeof face.asymmetry;
  };
  assertHumanFaceEditableDetail(face);
  face.detail = { eye: { widthScale: 1.1 } };
  assertHumanFaceEditableDetail(face);
  face.detail = { eye: { lowerLidProfile: { sections: [] } } };
  assertHumanFaceEditableDetail(face);
  const sourceSections = structuredClone(
    face.basis.recipe.eye.lowerLidProfile!.sections,
  );
  unsafeDetail({
    eye: {
      lowerLidProfile: {
        sections: sourceSections,
      },
    },
  });
  TestValidator.predicate(
    "copied source section belongs in the basis",
    throwsError(
      () => assertHumanFaceEditableDetail(face),
      "source geometry array",
    ),
  );
  sourceSections[0].at = 0.12;
  TestValidator.predicate(
    "changed source section refuses",
    throwsError(
      () => assertHumanFaceEditableDetail(face),
      "source geometry array",
    ),
  );
  unsafeDetail({ nose: { cavityOffset: [1, 2, 3] } });
  TestValidator.predicate(
    "free XYZ offset refuses",
    throwsError(
      () => assertHumanFaceEditableDetail(face),
      "detail.nose.cavityOffset",
    ),
  );
  unsafeDetail({ relief: [{ id: "free", regions: [] }] });
  TestValidator.predicate(
    "new relief population refuses",
    throwsError(() => assertHumanFaceEditableDetail(face), "detail.relief"),
  );
  unsafeDetail({ curves: [{ id: "free", curves: [] }] });
  TestValidator.predicate(
    "new curve population refuses",
    throwsError(() => assertHumanFaceEditableDetail(face), "detail.curves"),
  );
  const sideSections = structuredClone(
    face.basis.recipe.eye.lowerLidProfile!.sections,
  );
  unsafeSides({
    left: {
      eye: {
        lowerLidProfile: {
          sections: sideSections,
        },
      },
    },
  });
  face.detail = undefined;
  TestValidator.predicate(
    "side cannot copy source stations",
    throwsError(
      () => assertHumanFaceEditableDetail(face),
      "asymmetry.left.eye",
    ),
  );
  sideSections[0].at = 0.12;
  TestValidator.predicate(
    "side profile cannot edit source section",
    throwsError(
      () => assertHumanFaceEditableDetail(face),
      "asymmetry.left.eye",
    ),
  );
  face.asymmetry = undefined;
  const hair = portraitHairShadeFixture().shape;
  face.basis.recipe.hair = structuredClone(hair);
  const cards = structuredClone(hair.cards);
  unsafeDetail({ hair: { cards } });
  TestValidator.predicate(
    "single hair region cannot copy source cards",
    throwsError(() => assertHumanFaceEditableDetail(face), "detail.hair.cards"),
  );
  cards[0].width += 1;
  TestValidator.predicate(
    "new individual card width refuses",
    throwsError(() => assertHumanFaceEditableDetail(face), "detail.hair.cards"),
  );
  face.basis.recipe.hairLayers = [
    { id: "layer", profile: structuredClone(hair) },
  ];
  face.detail = {
    hairLayers: [{ id: "layer", profile: { ...hair, coverage: 0.9 } }],
  };
  assertHumanFaceEditableDetail(face);
  face.detail.hairLayers![0].profile.cards[0].width += 1;
  TestValidator.predicate(
    "legacy layer style keeps source guides",
    throwsError(() => assertHumanFaceEditableDetail(face), "profile.cards"),
  );
  face.detail = {
    hairLayers: [{ id: "layer", profile: { ...hair, cards: [] } }],
  };
  face.basis.recipe.hairLayers = [
    { id: "layer", profile: { ...hair, cards: [] } },
  ];
  assertHumanFaceEditableDetail(face);
  face.detail.hairLayers![0].profile.cards = structuredClone(hair.cards);
  TestValidator.predicate(
    "new layer guide refuses",
    throwsError(() => assertHumanFaceEditableDetail(face), "profile.cards"),
  );
  face.detail = { skinColour: [] };
  assertHumanFaceEditableDetail(face);
  face.detail = {
    eye: {
      irisPigment: { base: [0.2, 0.3, 0.4], variation: [0, 0, 0] },
    },
  };
  face.asymmetry = {
    left: {
      eye: {
        irisPigment: { base: [0.25, 0.35, 0.45], variation: [0, 0, 0] },
      },
    },
  };
  assertHumanFaceEditableDetail(face);
  face.asymmetry = undefined;
  const direct = humanFaceFixture();
  direct.detail = { nose: { cavityOffset: [1, 2, 3] } } as never;
  TestValidator.predicate(
    "JSON admission rejects source coordinates",
    throwsError(() => parseHumanFaceDocument(JSON.stringify(direct))),
  );
  TestValidator.predicate(
    "save rejects source coordinates",
    throwsError(() => serializeHumanFaceDocument(direct)),
  );
  TestValidator.predicate(
    "direct replay rejects source coordinates",
    throwsError(
      () => resolveHumanFaceDocument(direct),
      "detail.nose.cavityOffset",
    ),
  );
  TestValidator.predicate(
    "scalar edit cannot carry an invalid detail forward",
    throwsError(
      () => setHumanFaceDetail(direct, "eye.foldDepth", 0.2),
      "detail.nose.cavityOffset",
    ),
  );
  TestValidator.predicate(
    "region replacement rejects source coordinates",
    throwsError(
      () =>
        replaceHumanFaceRegion({
          document: humanFaceFixture(),
          basisId: direct.basis.id,
          region: "nose",
          value: { cavityOffset: [1, 2, 3] } as never,
        }),
      "detail.nose.cavityOffset",
    ),
  );
  const cycle: Record<string, unknown> = {};
  cycle.self = cycle;
  unsafeDetail(cycle);
  TestValidator.predicate(
    "cyclic detail refuses",
    throwsError(() => assertHumanFaceEditableDetail(face), "cycle"),
  );
};
