
import { type IAutoMovieProductionContentInput } from "../IAutoMovieProductionContentInput";
import { digestAutoMovieBytes } from "../contentIdentity";
import { productionGeneratedAcquisitionDiagnostics } from "../productionGeneratedAcquisitionDiagnostics";
import { assetUseIncomplete } from "./assetUseIncomplete";
import { assetProcessingStepIncomplete } from "./assetProcessingStepIncomplete";
import { isCanonicalAssetPath } from "./isCanonicalAssetPath";
import { isSha256Digest } from "./isSha256Digest";
import { isExternalModelAsset } from "./isExternalModelAsset";
import { type IProductionAssetInventoryContext } from "./IProductionAssetInventoryContext";

/**
 * Append provenance, canonical path and physical-byte findings in the admitted ledger's original order.
 *
 * @evidence contracts/common.md#principled-implementation Checks generated-acquisition findings, folded path collisions, physical/render membership, current digest, digest spelling, nonblank uses/processing and required external-model provenance.
 * @evidence contracts/common.md#clear-and-simple-design One record phase owns ledger-level findings while ingest/profile/proxy and compiled reverse-reference checks stay with their separate phases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Path checks establish lexical POSIX spelling with drive/backslash exclusion, not every Windows filename restriction or realpath containment. Hash equality and provenance labels do not authenticate a supplier.
 * @evidence contracts/common.md#meaningful-documentation Names the path, byte, use and optional processing premises and keeps generated warnings advisory.
 * @evidence contracts/performance.md#efficient-algorithms Scans assets/uses/processing and hashes each supplied current byte view; a mismatched digest is hashed again for its diagnostic text, and acquisition validation includes prompt/input costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the call's content map and folded-path map, without treating prior matching path or digest spelling as authority for current bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the shared path map and appended diagnostics survive the phase; input records/bytes remain borrowed and no IO resource is acquired.
 *
 * @author Samchon
 */
export function validateProductionAssetRecords(context: IProductionAssetInventoryContext): void {
  const { records, content, paths, diagnostics, diagnostic, manifestPath }: IProductionAssetInventoryContext = context;
for (const asset of records) {
    const folded: string = asset.path.toLowerCase();
    diagnostics.push(
      ...productionGeneratedAcquisitionDiagnostics(asset, manifestPath),
    );
    const prior: string | undefined = paths.get(folded);
    if (
      isCanonicalAssetPath(asset.path) === false ||
      (prior !== undefined && prior !== asset.path)
    )
      diagnostic(
        "asset-path-invalid",
        asset.path,
        `Asset path "${asset.path}" is not one canonical, portable project-relative identity. Keep one spelling inside declared content roots.`,
      );
    paths.set(folded, asset.path);
    const input: IAutoMovieProductionContentInput | undefined = content.get(asset.path);
    if (input?.bytes === null || input === undefined || input.render === false)
      diagnostic(
        "asset-bytes-missing",
        asset.path,
        `Manifest asset "${asset.path}" is not a physical file inside contentRoots/contentFiles. Restore and declare the exact bytes before compiling.`,
      );
    else if (asset.digest !== digestAutoMovieBytes(input.bytes))
      diagnostic(
        "asset-digest-mismatch",
        asset.path,
        `Manifest digest ${asset.digest} does not match current bytes ${digestAutoMovieBytes(input.bytes)}. Register the current asset bytes or restore the intended revision.`,
      );
    if (
      isSha256Digest(asset.digest) === false ||
      asset.uses.length === 0 ||
      asset.uses.some(assetUseIncomplete) ||
      (asset.processing ?? []).some(assetProcessingStepIncomplete)
    )
      diagnostic(
        "asset-provenance-incomplete",
        asset.path,
        `Asset "${asset.path}" has an invalid current SHA-256, consumer binding, or supplied processing step. Correct the asset record before compiling.`,
      );
    if (
      asset.model !== undefined &&
      (asset.model.ingestProfile.trim().length === 0 ||
        asset.model.lod.length === 0)
    )
      diagnostic(
        "asset-model-provenance-missing",
        asset.path,
        `External model "${asset.path}" must declare its ingest profile, explicit LOD ledger, collision proxy and measurement proxy before compiling.`,
      );
    else if (
      isExternalModelAsset(asset.path) &&
      asset.model === undefined &&
      asset.motion === undefined
    )
      diagnostic(
        "asset-model-provenance-missing",
        asset.path,
        `External glTF-family asset "${asset.path}" must declare either model ingest/LOD/proxy provenance or motion ingest/take provenance before compiling.`,
      );
  }
}
