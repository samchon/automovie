import { IAutoMovieAssetProvenance } from "@automovie/interface";
import { type IAutoMovieExternalModelInspection, inspectAutoMovieExternalModelBytes } from "@automovie/ingest";

import { type IAutoMovieProductionContentInput } from "../IAutoMovieProductionContentInput";
import { canonicalAutoMovieJsonBytes, compareCodeUnits, digestAutoMovieBytes } from "../contentIdentity";
import { errorMessage } from "../designDerivation/errorMessage";
import { externalModelResourcePath } from "./externalModelResourcePath";
import { motionTakeInventoryMatches } from "./motionTakeInventoryMatches";
import { externalMotionBasisOf } from "./externalMotionBasisOf";
import { hasActiveAssetUse } from "./hasActiveAssetUse";
import { type IProductionAssetInventoryContext } from "./IProductionAssetInventoryContext";

/**
 * Inspect digest-matched motion sources and preserve successful take/basis and sidecar closures for adoption.
 *
 * @evidence contracts/common.md#principled-implementation Current source and sidecar digests, exact active motion-resource uses, ordered take inventory and canonical rest-basis byte equality decide whether inspection enters the shared cache.
 * @evidence contracts/common.md#clear-and-simple-design The first sequential asset phase owns motion inspection; later adoption consumes its successful inspection and closure rather than inspecting those bytes again.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or unauthorized sidecars emit errors while available bytes may still reach ingest for diagnosis; any new local diagnostic prevents this phase's cache admission. No mapping or take is guessed.
 * @evidence contracts/common.md#meaningful-documentation States successful-cache admission, explicit sidecar authorization, exact basis/take comparison and typed diagnostic failure paths.
 * @evidence contracts/performance.md#efficient-algorithms Hashes inspected source/sidecar bytes and performs record searches per resource, then includes ingest, canonical basis serialization/comparison and closure sorting; cost includes those full byte populations.
 * @evidence contracts/performance.md#reuse-equivalent-work One successful inspection and sorted closure are retained per source path for the same call's adoption phase; mutable bytes require a new inventory across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The shared context retains successful inspections, source facts and sidecar digest lists through adoption; sizes follow source/node/track/resource populations with no separate quota or acquired handle.
 *
 * @author Samchon
 */
export function inspectProductionAssetMotions(context: IProductionAssetInventoryContext): void {
  const { records, content, consumedMotionResources, motionInspections, motionClosures, diagnostics, diagnostic, productionId }: IProductionAssetInventoryContext = context;
for (const asset of records) {
    if (asset.motion === undefined) continue;
    const resident: IAutoMovieProductionContentInput | undefined = content.get(asset.path);
    if (
      resident?.bytes === null ||
      resident === undefined ||
      asset.digest !== digestAutoMovieBytes(resident.bytes)
    )
      continue;
    const diagnosticCount: number = diagnostics.length;
    const closure: Map<string, string> = new Map<string, string>();
    try {
      const inspection: IAutoMovieExternalModelInspection = inspectAutoMovieExternalModelBytes({
        path: asset.path,
        bytes: resident.bytes,
        profile: asset.motion.ingestProfile,
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
            resourceRecord.digest !== digestAutoMovieBytes(resourceInput.bytes)
          ) {
            diagnostic(
              "asset-motion-provenance-missing",
              asset.path,
              `External motion "${asset.path}" references sidecar "${uri}", but resolved project asset "${resource}" is absent or byte-stale in the manifest.`,
            );
            return null;
          }
          if (
            hasActiveAssetUse(
              resourceRecord,
              productionId,
              "motion-resource",
              asset.path,
            ) === false
          )
            diagnostic(
              "asset-motion-provenance-missing",
              asset.path,
              `External motion sidecar "${resource}" is not authorized as a motion-resource of "${asset.path}" in production "${productionId}".`,
            );
          else {
            consumedMotionResources.add(`${asset.path}\0${resource}`);
            closure.set(resource, resourceRecord.digest);
          }
          return resourceInput.bytes;
        },
      });
      if (
        inspection.motion === undefined ||
        motionTakeInventoryMatches(
          asset.motion.takes,
          inspection.motion.takes,
        ) === false ||
        Buffer.from(canonicalAutoMovieJsonBytes(asset.motion.basis)).equals(
          Buffer.from(
            canonicalAutoMovieJsonBytes(
              externalMotionBasisOf(inspection.motion),
            ),
          ),
        ) === false
      )
        diagnostic(
          "asset-motion-provenance-missing",
          asset.path,
          `External motion "${asset.path}" inspected take inventory or byte-grounded hierarchy/rest basis does not match its manifest provenance. Re-inspect the current digest and preserve every take identity, node, parent, and local rest transform.`,
        );
      if (diagnostics.length === diagnosticCount) {
        motionInspections.set(asset.path, inspection);
        motionClosures.set(
          asset.path,
          [...closure]
            .map(([path, digest]: [string, string]) : { path: string; digest: string; } => ({ path, digest }))
            .sort((left: { path: string; digest: string; }, right: { path: string; digest: string; }) : number => compareCodeUnits(left.path, right.path)),
        );
      }
    } catch (error) {
      diagnostic(
        "asset-motion-ingest-invalid",
        asset.path,
        `External motion "${asset.path}" cannot be inspected with profile "${asset.motion.ingestProfile}": ${errorMessage(error)} Restore valid fixed bytes or correct the declared profile.`,
      );
    }
  }
}
