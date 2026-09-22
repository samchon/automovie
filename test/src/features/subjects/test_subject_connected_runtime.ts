import { createConnectedFaceRuntime } from "@automovie/playground/src/human/connectedRuntime";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { numericalHairBasisFixture } from "../internal/numericalHairBasisFixture";

/**
 * Preview and explicit export consume the same admitted compact document.
 * Hair and skin remain numerical fields against shared basis correspondence.
 *
 * Scenarios:
 * 1. Plain and null-resource previews preserve numerical shape and skip contacts.
 * 2. Requested contacts are supplied; explicit export returns actual GLB bytes.
 * 3. Numerical hair generates geometry locally against a closed analytic basis.
 * 4. Old skin/hair resource names refuse instead of loading personal assets.
 */
export const test_subject_connected_runtime = async (): Promise<void> => {
  const { basis, document } = humanFaceBasisFixture();
  const runtime = createConnectedFaceRuntime({
    basis,
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
  const numeric = numericalHairBasisFixture();
  const attached = await createConnectedFaceRuntime({ basis: numeric.basis })({
    operation: "preview",
    document: JSON.stringify({
      ...numeric.document,
      skin: { head: [] },
    }),
  });
  if (attached.operation !== "preview") throw new Error("Expected preview.");
  TestValidator.predicate(
    "numerical hair adds geometry",
    attached.model.parts.length === 2,
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
