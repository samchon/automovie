import { type IAutoMovieAssetUse, type IAutoMovieDiagnostic, IAutoMovieAssetProvenance, IAutoMovieGeneratedCollisionProxy, IAutoMovieGeneratedMeasurementProxy } from "@automovie/interface";
import { unsupportedAutoMovieMaterialExtensions } from "@automovie/engine";
import { inspectAutoMovieExternalModelBytes } from "@automovie/ingest";
import { type IAutoMovieProductionContentInput } from "../IAutoMovieProductionContentInput";
import { compareCodeUnits, digestAutoMovieBytes } from "../contentIdentity";
import { errorMessage } from "../designDerivation/errorMessage";
import { resolveExternalCollisionProxy } from "./resolveExternalCollisionProxy";
import { resolveExternalMeasurementProxy } from "./resolveExternalMeasurementProxy";
import { externalModelResourcePath } from "./externalModelResourcePath";
import { assetConsumerExists } from "./assetConsumerExists";
import { hasActiveAssetUse } from "./hasActiveAssetUse";
import { isCanonicalAssetPath } from "./isCanonicalAssetPath";
import { isExternalModelAsset } from "./isExternalModelAsset";
import { type IProductionAssetInventoryContext } from "./IProductionAssetInventoryContext";

/**
 * Inspect model profiles, LODs, sidecars and proxies while retaining advisory material findings.
 *
 * @evidence contracts/common.md#principled-implementation Checks active consumer uniqueness, ordered hero/near/far declarations, byte-grounded sidecars and finite positive proxy decisions; valid model facts enter externalByAsset only when the local suffix contains no errors.
 * @evidence contracts/common.md#clear-and-simple-design Model-local decisions and exact diagnostic order stay together; recipe-level rig/LOD joining and unused-resource findings occur in later phases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported material extensions remain warnings and must not remove a usable binding. Proxy admission does not infer geometry or prove external measurement centering/depth; broader build errors refuse final publication while existing source evaluation can still proceed.
 * @evidence contracts/common.md#meaningful-documentation Documents error versus warning admission, explicit LOD/resource/proxy decisions, borrowed inspection facts and unproved geometric envelope premises.
 * @evidence contracts/performance.md#efficient-algorithms Includes active-use/LOD scans, repeated ledger searches, complete digest passes, actual ingest and proxy parsing, plus closure sorting; it imposes no asset-byte or mesh quota.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares current content/path maps and records each consumed model resource; successful per-asset facts feed recipe joining without a second hero inspection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Per-model closures, inspected facts and proxies remain in the call context until joining; warning/error strings scale with findings, and the phase opens no file, worker or GPU handle.
 *
 * @author Samchon
 */
export function inspectProductionAssetModels(context: IProductionAssetInventoryContext): void {
  const { records, content, paths, activeConsumerAssets, consumedModelResources, externalByAsset, diagnostics, diagnostic, warning, graph, productionId }: IProductionAssetInventoryContext = context;
for (const asset of records) {
    const activeUses: IAutoMovieAssetUse[] = asset.uses.filter(
      (use: IAutoMovieAssetUse) : boolean => use.production === productionId,
    );
    const seenUses: Set<string> = new Set<string>();
    for (const use of activeUses) {
      const key: string = `${use.consumer.kind}\0${use.consumer.id}`;
      const priorAsset: string | undefined = activeConsumerAssets.get(key);
      const exclusive: boolean =
        use.consumer.kind !== "material-texture" &&
        use.consumer.kind !== "model-resource" &&
        use.consumer.kind !== "model-proxy" &&
        use.consumer.kind !== "motion-resource";
      if (seenUses.has(key) || (exclusive && priorAsset !== undefined))
        diagnostic(
          "asset-use-duplicate",
          asset.path,
          `Asset "${asset.path}" repeats active consumer ${use.consumer.kind} "${use.consumer.id}"${priorAsset === undefined ? "" : ` already owned by "${priorAsset}"`}. Keep one reasoned use per production consumer.`,
        );
      seenUses.add(key);
      if (exclusive) activeConsumerAssets.set(key, asset.path);
      if (
        assetConsumerExists(
          graph,
          records,
          asset.path,
          use.consumer,
        ) === false
      )
        diagnostic(
          "asset-use-dangling",
          asset.path,
          `Asset "${asset.path}" cites missing ${use.consumer.kind} "${use.consumer.id}" in production "${productionId}". Correct the typed consumer or remove the stale use.`,
        );
    }
    if (asset.model === undefined) continue;
    const diagnosticCount: number = diagnostics.length;
    let priorLevel: number = -1;
    const levels: Set<string> = new Set<string>();
    for (const lod of asset.model.lod) {
      const order: number = ["hero", "near", "far"].indexOf(lod.level);
      const target: string | undefined = paths.get(lod.asset.toLowerCase());
      if (
        levels.has(lod.level) ||
        order <= priorLevel ||
        target === undefined ||
        isExternalModelAsset(target) === false
      )
        diagnostic(
          "asset-model-lod-dangling",
          asset.path,
          `Model asset "${asset.path}" has duplicate/out-of-order LOD "${lod.level}" or points to non-model manifest asset "${lod.asset}". Keep unique hero/near/far levels in order and ground each in model bytes.`,
        );
      if (
        lod.level !== "hero" &&
        (target === undefined ||
          hasActiveAssetUse(
            records.find(
              (candidate: IAutoMovieAssetProvenance) : boolean => candidate.path === target,
            ),
            productionId,
            "model-resource",
            asset.path,
          ) === false)
      )
        diagnostic(
          "asset-model-resource-unbound",
          asset.path,
          `LOD "${lod.level}" asset "${lod.asset}" is not authorized as a model-resource of "${asset.path}" in production "${productionId}".`,
        );
      else if (lod.level !== "hero" && target !== undefined)
        consumedModelResources.add(`${asset.path}\0${target}`);
      levels.add(lod.level);
      priorLevel = Math.max(priorLevel, order);
    }
    if (
      asset.model.lod[0]?.level !== "hero" ||
      asset.model.lod[0]?.asset !== asset.path
    )
      diagnostic(
        "asset-model-lod-dangling",
        asset.path,
        `Model asset "${asset.path}" must bind its own exact bytes as the first hero LOD. Keep optional near/far members after that owned hero identity.`,
      );
    const resident: IAutoMovieProductionContentInput | undefined = content.get(asset.path);
    let ingested: boolean = false;
    let inspection:
      | ReturnType<typeof inspectAutoMovieExternalModelBytes>
      | undefined;
    const closure: Map<string, string> = new Map<string, string>();
    closure.set(asset.path, asset.digest);
    if (resident?.bytes !== null && resident !== undefined)
      try {
        inspection = inspectAutoMovieExternalModelBytes({
          path: asset.path,
          bytes: resident.bytes,
          profile: asset.model.ingestProfile,
          resolveResource: (uri: string) : Uint8Array<ArrayBufferLike> | null => {
            const resource: string = externalModelResourcePath(asset.path, uri);
            const resourceRecord: IAutoMovieAssetProvenance | undefined = records.find(
              (candidate: IAutoMovieAssetProvenance) : boolean => candidate.path === resource,
            );
            const resourceInput: IAutoMovieProductionContentInput | undefined = content.get(resource);
            if (
              resourceRecord === undefined ||
              resourceInput?.bytes === null ||
              resourceInput === undefined ||
              resourceRecord.digest !==
                digestAutoMovieBytes(resourceInput.bytes)
            ) {
              diagnostic(
                "asset-model-resource-unbound",
                asset.path,
                `External model "${asset.path}" references sidecar "${uri}", but resolved project asset "${resource}" is absent or byte-stale in the manifest.`,
              );
              return null;
            }
            if (
              hasActiveAssetUse(
                resourceRecord,
                productionId,
                "model-resource",
                asset.path,
              ) === false
            )
              diagnostic(
                "asset-model-resource-unbound",
                asset.path,
                `External model sidecar "${resource}" is not authorized as a model-resource of "${asset.path}" in production "${productionId}".`,
              );
            else consumedModelResources.add(`${asset.path}\0${resource}`);
            closure.set(resource, resourceRecord.digest);
            return resourceInput.bytes;
          },
        });
        ingested = diagnostics.length === diagnosticCount;
      } catch (error) {
        diagnostic(
          "asset-model-ingest-invalid",
          asset.path,
          `External model "${asset.path}" cannot be ingested with profile "${asset.model.ingestProfile}": ${errorMessage(error)} Restore valid fixed bytes or select the correct supported profile.`,
        );
      }
    // After `ingested` is decided, because this is a report rather than a
    // refusal and must not turn a sound ingest into a failed one.
    if (inspection !== undefined) {
      const unsupported: string[] = unsupportedAutoMovieMaterialExtensions(
        inspection.extensions,
      );
      if (unsupported.length !== 0)
        warning(
          "asset-model-material-unsupported",
          asset.path,
          `External model "${asset.path}" declares material extensions automovie cannot restate: ${unsupported.join(", ")}. Its appearance will not match a generated material, and no validator in this repository has an opinion about it.`,
        );
    }
    const collision: IAutoMovieGeneratedCollisionProxy | null = resolveExternalCollisionProxy({
      owner: asset.path,
      reference: asset.model.collisionProxy,
      records: records,
      content,
      productionId,
      diagnostic,
    });
    const measurement: IAutoMovieGeneratedMeasurementProxy | null = resolveExternalMeasurementProxy({
      owner: asset.path,
      reference: asset.model.measurementProxy,
      records: records,
      content,
      productionId,
      diagnostic,
    });
    for (const reference of [
      asset.model.collisionProxy,
      asset.model.measurementProxy,
    ])
      if (reference.kind === "asset") {
        const proxyRecord: IAutoMovieAssetProvenance | undefined = records.find(
          (candidate: IAutoMovieAssetProvenance) : boolean => candidate.path === reference.asset,
        );
        if (proxyRecord !== undefined)
          closure.set(proxyRecord.path, proxyRecord.digest);
      }
    if (
      ingested &&
      resident?.bytes !== null &&
      resident !== undefined &&
      asset.digest === digestAutoMovieBytes(resident.bytes) &&
      isCanonicalAssetPath(asset.path) &&
      diagnostics.slice(diagnosticCount).some((finding: IAutoMovieDiagnostic): boolean => finding.category === "error") === false &&
      collision !== null &&
      measurement !== null &&
      inspection !== undefined &&
      inspection.profile !== "gltf-motion-v1"
    )
      externalByAsset.set(asset.path, {
        profile: inspection.profile,
        humanoidBones: inspection.humanoidBones,
        assets: [...closure]
          .map(([path, digest]: [string, string]) : { path: string; digest: string; } => ({ path, digest }))
          .sort((left: { path: string; digest: string; }, right: { path: string; digest: string; }) : number => compareCodeUnits(left.path, right.path)),
        collision,
        measurement,
      });
  }
}
