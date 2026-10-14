import { IAutoMovieProductionRepaintShotSource } from "./IAutoMovieProductionRepaintShotSource";
import { productionRepaintServiceResolveReferences } from "./productionRepaintServiceResolveReferences";
import { AutoMovieRepaintReferenceRole, IAutoMovieBuildProjectOutput, IAutoMovieDiagnostic, IAutoMovieProductionRegistryManifest, IAutoMovieRenderBundleManifest, IAutoMovieRepaintShot } from "@automovie/interface";
import { IAutoMovieProductionServices } from "./IAutoMovieProductionServices";
import { canonicalizeAutoMovieJson } from "./contentIdentity";
import { productionSourceRenderFingerprint } from "./renditionIdentity";
import { readAutoMovieProductionRegistry } from "./productionRegistry";

/**
 * Reacquires build status, registry, verified source manifest and current reference bindings and compares the original canonical identities; any read refusal makes currentness false.
 *
 * @evidence contracts/common.md#principled-implementation Reacquires build status, registry, verified source manifest and current reference bindings and compares the original canonical identities; any read refusal makes currentness false.
 * @evidence contracts/common.md#clear-and-simple-design The stage owns the original fresh endpoint observations, while the caller retains its callback lifetime and publication/dispatch fence positions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation No persistent currentness cache is retained; matching endpoints cannot prove the absence of an intervening ABA mutation.
 * @evidence contracts/performance.md#efficient-algorithms Fresh reads, schema/serialization and reference hashes scale with resident metadata/bytes and are intentionally repeated at dispatch/publication fences.
 * @evidence contracts/performance.md#reuse-equivalent-work Reacquires build status, registry, verified source manifest and current reference bindings and compares the original canonical identities; any read refusal makes currentness false. Fresh reads, schema/serialization and reference hashes scale with resident metadata/bytes and are intentionally repeated at dispatch/publication fences.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No persistent currentness cache is retained; matching endpoints cannot prove the absence of an intervening ABA mutation.
 */
export function productionRepaintServiceInputCurrent(services: IAutoMovieProductionServices, registry: ReturnType<typeof readAutoMovieProductionRegistry>, source: IAutoMovieProductionRepaintShotSource, request: IAutoMovieRepaintShot.IProps, registryIdentity: string, sourceRenderFingerprint: string, referenceIdentity: string): boolean {

      try {
        const status: IAutoMovieBuildProjectOutput = services.buildStatus();
        if (
          status.success === false ||
          status.builder.inputFingerprint !== registry.inputFingerprint
        )
          return false;
        const currentRegistry: IAutoMovieProductionRegistryManifest = readAutoMovieProductionRegistry(
          services.project,
        );
        const current: IAutoMovieRenderBundleManifest | null = services.project.verifiedRenderManifest(
          source.manifestPath,
        );
        const currentReferences: { values: Array<{ role: AutoMovieRepaintReferenceRole; path: string; digest: string; bytes: Uint8Array; }>; } | { diagnostic: IAutoMovieDiagnostic; } = productionRepaintServiceResolveReferences(services, request);
        return (
          canonicalizeAutoMovieJson(currentRegistry) === registryIdentity &&
          current !== null &&
          productionSourceRenderFingerprint({
            manifest: current,
            frames: current.frames,
          }) === sourceRenderFingerprint &&
          "values" in currentReferences &&
          canonicalizeAutoMovieJson(
            currentReferences.values.map(
              ({ role, path: referencePath, digest }: { role: AutoMovieRepaintReferenceRole; path: string; digest: string; bytes: Uint8Array; }): { role: AutoMovieRepaintReferenceRole; path: string; digest: string; } => ({
                role,
                path: referencePath,
                digest,
              }),
            ),
          ) === referenceIdentity
        );
      } catch {
        return false;
      }
}
