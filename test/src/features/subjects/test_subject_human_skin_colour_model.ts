import { buildHumanFace } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { coarseHumanFaceFixture } from "../internal/humanFaceFixture";
import { skinColourRegion } from "../internal/skinColourFixture";

/**
 * The document reaches actual skin meshes, not a renderer-only override.
 *
 * Scenarios:
 * 1. A reference-bound forehead region gives head, lids and pinnae resident RGB,
 *    the head's nonwhite where the forehead support reaches, while other
 *    tissues receive no pigmentation attribute and the input document stays
 *    unchanged.
 */
export const test_subject_human_skin_colour_model = (): void => {
  const doc = coarseHumanFaceFixture("skin-colour-consumer");
  doc.expression = { lipPart: 10 };
  doc.detail = {
    skinColour: [{ ...skinColourRegion(), strength: 1 }],
  };
  const before = structuredClone(doc),
    colored = buildHumanFace(doc, 0);
  TestValidator.equals("input retained", doc, before);
  for (const part of colored.parts) {
    TestValidator.predicate("resident mesh", part.geometry.type === "mesh");
    if (part.geometry.type !== "mesh") continue;
    const mesh = part.geometry.mesh;
    if (part.material === "skin") {
      TestValidator.equals(
        "complete skin RGB",
        mesh.colors!.length,
        mesh.positions.length,
      );
      if (part.id === "head")
        TestValidator.predicate(
          "nonwhite head",
          mesh.colors!.some((v) => v < 1),
        );
    } else
      TestValidator.equals(
        "other tissues have no pigment",
        mesh.colors,
        undefined,
      );
  }
};
