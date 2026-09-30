import {
  type IAutoMovieHumanPersonDocument,
  createPortraitMaterials,
  deriveHumanPersonBody,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * A person's skin colour is stated once, in the face, and the body follows.
 *
 * The face materials are the package's portrait defaults, whose `skin` base
 * colour is the reference the override scenarios compare with.
 *
 * Scenarios:
 * 1. With no override the body's cheek is the face's skin material colour, the
 *    rest of the body document is carried unchanged, and the person's own
 *    documents are not modified.
 * 2. A face override of the skin colour becomes the cheek.
 * 3. A body that already states a `skinColour` refuses (two colours for one
 *    person), and so do face materials with no skin material, an override
 *    channel of zero, one above 1 and a non-finite one.
 */
export const test_human_person_body_document = (): void => {
  const materials = createPortraitMaterials();
  const skin = materials.find((material) => material.id === "skin")!.baseColor;
  const person = (
    override?: { r: number; g: number; b: number },
  ): IAutoMovieHumanPersonDocument => ({
    id: "p",
    name: "p",
    face: {
      id: "f",
      name: "f",
      basis: "face/1",
      shape: {},
      expression: {},
      ...(override === undefined ? {} : { materials: { skin: { color: override } } }),
    },
    body: { id: "b", name: "b", basis: "body/1", shape: { macroHeight: 0.5 } },
  });

  const document = person();
  const before = JSON.stringify(document);
  const derived = deriveHumanPersonBody({ document, faceMaterials: materials });
  TestValidator.equals("the cheek is the face's skin colour", derived.skinColour, {
    cheek: { r: skin.r, g: skin.g, b: skin.b },
  });
  TestValidator.equals(
    "the body's own fields are carried",
    [derived.id, derived.basis, derived.shape],
    ["b", "body/1", { macroHeight: 0.5 }],
  );
  TestValidator.equals(
    "the person's documents are not modified",
    JSON.stringify(document),
    before,
  );
  TestValidator.equals(
    "a face override becomes the cheek",
    deriveHumanPersonBody({
      document: person({ r: 0.4, g: 0.25, b: 0.2 }),
      faceMaterials: materials,
    }).skinColour,
    { cheek: { r: 0.4, g: 0.25, b: 0.2 } },
  );

  const refuses = (task: () => unknown, cause: string): boolean =>
    throwsError(task, cause);
  TestValidator.predicate(
    "a body with its own skin colour refuses",
    refuses(
      () =>
        deriveHumanPersonBody({
          document: {
            ...person(),
            body: {
              ...person().body,
              skinColour: { cheek: { r: 0.5, g: 0.4, b: 0.3 } },
            },
          },
          faceMaterials: materials,
        }),
      "must not state its own skinColour",
    ),
  );
  TestValidator.predicate(
    "face materials without a skin material refuse",
    refuses(
      () =>
        deriveHumanPersonBody({
          document: person(),
          faceMaterials: materials.filter((material) => material.id !== "skin"),
        }),
      "no material 'skin'",
    ),
  );
  for (const bad of [0, 1.2, Number.NaN])
    TestValidator.predicate(
      "a channel of " + bad + " refuses",
      refuses(
        () =>
          deriveHumanPersonBody({
            document: person({ r: bad, g: 0.3, b: 0.3 }),
            faceMaterials: materials,
          }),
        "each linear channel in (0, 1]",
      ),
    );
};
