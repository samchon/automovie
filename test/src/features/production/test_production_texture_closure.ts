import type {
  IAutoMovieAssetProvenance,
  IAutoMovieDiagnostic,
  IAutoMovieModel,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../internal/fixtures";
import { productionTextureClosureDiagnostics } from "../../../../packages/production/src/production/productionTextureClosureDiagnostics";

/**
 * Every admitted model occurrence owes its sampled image registration and bytes.
 *
 * Scenarios:
 * 1. Registered standalone and environment-owned material uses pass together.
 * 2. Missing registration, bytes, readable image facts or authorized use refuse.
 * 3. Equal model ids cannot hide a second environment's unpaid image binding.
 * 4. An empty output population introduces no image obligation.
 * 5. Repeated paths preserve each unpaid occurrence, and later changed bytes are remeasured.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual production bridge for standalone and environment-owned material occurrences, asserting closure findings and valid admission; repeated-path findings and cross-call byte edits pin the local facts cache's semantic boundaries.
 * @evidence contracts/testing.md#independent-expectations Explicit asset consumer bindings and PNG signature/IHDR dimension bytes determine expected media and authorization findings. The 24-byte header exercises image-facts admission rather than claiming a complete decodable PNG or proving the fixture ledger's digest against its bytes.
 * @evidence contracts/testing.md#distinguishing-cases Covers standalone/environment ownership, equal IDs with distinct images, absent registrations/content, unreadable/null bytes, missing authorization, empty output, repeated unpaid paths and a changed width then restoration. Other image formats and complete asset-byte identity belong to engine media and production inventory tests.
 * @evidence contracts/testing.md#execution-ownership This discoverable portable unit directly imports the bridge and uses existing fixture models with a local byte header; it opens no renderer/browser/process, replaces no foreign method and dynamically registers no cases.
 */
export function test_production_texture_closure(): void {
  const model: IAutoMovieModel = createModel();
  model.materials[0]!.baseColorTexture = {
    asset: "assets/tile.png",
    texCoord: 0,
    colorSpace: "srgb",
  };
  const asset: IAutoMovieAssetProvenance = {
    path: "assets/tile.png",
    digest: `sha256:${"0".repeat(64)}`,
    uses: [
      {
        production: "library",
        consumer: { kind: "material-texture", id: model.id },
        reason: "Surface finish",
      },
    ],
  };
  const png: Buffer = Buffer.alloc(24);
  png.set([137, 80, 78, 71, 13, 10, 26, 10]);
  png.write("IHDR", 12, "ascii");
  png.writeUInt32BE(64, 16);
  png.writeUInt32BE(64, 20);
  const input: Parameters<typeof productionTextureClosureDiagnostics>[0] = {
    production: "library",
    models: [],
    environments: [{ models: [model] }],
    scenes: [],
    assets: [asset],
    content: [{ path: asset.path, bytes: png }],
  };
  TestValidator.equals(
    "registered building texture",
    productionTextureClosureDiagnostics(input),
    [],
  );
  TestValidator.equals(
    "standalone model uses the same gate",
    productionTextureClosureDiagnostics({
      ...input,
      models: [model],
      environments: [],
    }),
    [],
  );
  const missing: IAutoMovieDiagnostic[] = productionTextureClosureDiagnostics({ ...input, assets: [] });
  TestValidator.equals(
    "unregistered building image is refused",
    missing.map((entry: IAutoMovieDiagnostic): string => entry.code),
    ["asset-texture-unclosed"],
  );
  TestValidator.equals(
    "missing bytes are refused",
    productionTextureClosureDiagnostics({ ...input, content: [] }).length,
    1,
  );
  TestValidator.equals(
    "unreadable bytes are refused",
    productionTextureClosureDiagnostics({
      ...input,
      content: [{ path: asset.path, bytes: new Uint8Array() }],
    }).length,
    1,
  );
  TestValidator.equals(
    "an explicitly unavailable snapshot is refused",
    productionTextureClosureDiagnostics({
      ...input,
      content: [{ path: asset.path, bytes: null }],
    }).length,
    1,
  );
  TestValidator.equals(
    "wrong consumer is refused",
    productionTextureClosureDiagnostics({
      ...input,
      assets: [{ ...asset, uses: [] }],
    }).length,
    1,
  );
  const other: IAutoMovieModel = {
    ...model,
    materials: model.materials.map((material: IAutoMovieModel["materials"][number]): IAutoMovieModel["materials"][number] => ({
      ...material,
      baseColorTexture: "assets/other.png",
    })),
  };
  TestValidator.equals(
    "same model id cannot hide another environment's texture",
    productionTextureClosureDiagnostics({
      ...input,
      environments: [{ models: [model] }, { models: [other] }],
    }).length,
    1,
  );
  TestValidator.equals(
    "repeat missing path keeps both occurrence findings",
    productionTextureClosureDiagnostics({ ...input, models: [model], assets: [] }).length,
    2,
  );
  png.writeUInt32BE(0, 16);
  TestValidator.equals("changed header remeasured on another call", productionTextureClosureDiagnostics(input).length, 1);
  png.writeUInt32BE(64, 16);
  TestValidator.equals("restored header remeasured on another call", productionTextureClosureDiagnostics(input), []);
  TestValidator.equals(
    "empty library",
    productionTextureClosureDiagnostics({
      ...input,
      environments: [],
      assets: [],
      content: [],
    }),
    [],
  );
}
