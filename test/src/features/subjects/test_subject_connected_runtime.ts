import { type IAutoMovieHumanFaceGroom } from "@automovie/human";
import { createConnectedFaceRuntime } from "@automovie/playground/src/human/connectedRuntime";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";

/**
 * Preview and explicit export consume the same admitted compact document.
 * Resource lookup keys may differ from resource IDs, but never from basis binding.
 *
 * Scenarios:
 * 1. Plain and null-resource previews preserve numerical shape and skip contacts.
 * 2. Requested contacts are supplied; explicit export returns actual GLB bytes.
 * 3. Numeric pigmentation is evaluated locally; unknown or foreign grooms refuse.
 * 4. Old skin resource names refuse rather than silently recovering photographs.
 */
export const test_subject_connected_runtime = async (): Promise<void> => {
  const { basis, document } = humanFaceBasisFixture();
  const groom: IAutoMovieHumanFaceGroom = {
    id: "hair-resource",
    basis: basis.id,
    finish: { ...basis.materials[0], id: "hair" },
    profile: {
      segments: 2,
      widthScale: 1,
      tipWidth: 0.5,
      taperStart: 0,
      seed: 7,
      fibres: 4,
      coverage: 0.9,
    },
    cards: [
      {
        part: "first",
        triangle: 0,
        weights: [0.2, 0.3],
        guide: [
          [0, 0, 0],
          [0, 0, 0.1],
        ],
        across: [
          [0, 1, 0],
          [0, 1, 0],
        ],
        width: 0.01,
      },
    ],
  };
  const runtime = createConnectedFaceRuntime({
    basis,
    grooms: { hair: groom, foreign: { ...groom, basis: "other" } },
  });
  for (const resources of [{}, { skin: null, hair: null }]) {
    const preview = await runtime({
      operation: "preview",
      document: JSON.stringify({ ...document, ...resources }),
    });
    if (preview.operation !== "preview") throw new Error("Expected preview.");
    TestValidator.equals(
      "preview has resident regions",
      preview.model.parts.length,
      3,
    );
    TestValidator.equals(
      "unrequested contacts remain unknown",
      preview.crossings,
      null,
    );
  }
  const measured = await runtime({
    operation: "preview",
    document: JSON.stringify(document),
    measure: true,
  });
  if (measured.operation !== "preview") throw new Error("Expected preview.");
  TestValidator.predicate(
    "contacts supplied",
    Array.isArray(measured.crossings),
  );
  const exported = await runtime({
    operation: "export",
    document: JSON.stringify(document),
  });
  if (exported.operation !== "export") throw new Error("Expected export.");
  TestValidator.equals(
    "binary GLB header",
    Array.from(exported.glb.slice(0, 4)),
    [0x67, 0x6c, 0x54, 0x46],
  );
  const attached = await runtime({
    operation: "preview",
    document: JSON.stringify({
      ...document,
      skin: { square: [] },
      hair: "hair",
    }),
  });
  if (attached.operation !== "preview") throw new Error("Expected preview.");
  TestValidator.predicate(
    "groom adds geometry",
    attached.model.parts.length > 3,
  );
  for (const key of ["skin", "hair"])
    for (const name of ["absent", "foreign", "__proto__"])
      TestValidator.equals(
        "unavailable resource refuses",
        await runtime({
          operation: "preview",
          document: JSON.stringify({ ...document, [key]: name }),
        }).catch(() => "refused"),
        "refused",
      );
};
