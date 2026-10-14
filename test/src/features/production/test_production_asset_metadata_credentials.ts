import type { IAutoMovieAssetProvenance } from "@automovie/interface";
import { assetUrlAdmissionRefusal } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

/**
 * Local assets carry their byte identity without an acquisition dossier.
 * Optional metadata still cannot carry embedded credentials into output.
 *
 * Scenarios:
 * 1. A local asset with only its current identity and consumer passes.
 * 2. Descriptive local and HTTPS locations introduce no credential failure.
 * 3. Source and license locators with credentials report only their field.
 *
 * @evidence contracts/testing.md#behavioral-verification Applies asset metadata admission to local, descriptive and credential-bearing locators, requiring exact secret-free field/class refusals; mandatory metadata or leaked locator content fails.
 * @evidence contracts/testing.md#independent-expectations Optional provenance metadata and the URL userinfo credential boundary define null or the authored field/category independently of parser output; byte digest validity and complete acquisition provenance are outside this gate.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts no metadata, a non-URL source description and credential-free HTTPS license with embedded credentials independently in original/license fields; broader locator syntax and generation admission belong to other units.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit calls production admission with authored records and owns all assertions, without network acquisition, filesystem effects or dynamically registered cases.
 */
export function test_production_asset_metadata_credentials(): void {
  const asset: IAutoMovieAssetProvenance = {
    path: "assets/tile.png",
    digest: `sha256:${"0".repeat(64)}`,
    uses: [
      {
        production: "library",
        consumer: { kind: "material-texture", id: "wall" },
        reason: "Wall surface",
      },
    ],
  };
  TestValidator.equals("local bytes", assetUrlAdmissionRefusal(asset), null);
  TestValidator.equals(
    "descriptive metadata",
    assetUrlAdmissionRefusal({
      ...asset,
      original: { url: "internal-art/tile", digest: asset.digest },
      license: { identifier: "", url: "https://example.com/terms" },
    }),
    null,
  );
  for (const field of ["original", "license"] as const)
    TestValidator.equals(
      `credential in ${field}`,
      assetUrlAdmissionRefusal({
        ...asset,
        [field]: {
          url: "https://user:secret@example.com/asset",
          ...(field === "original"
            ? { digest: asset.digest }
            : { identifier: "internal" }),
        },
      }),
      { field, reason: "credential-bearing" },
    );
}
