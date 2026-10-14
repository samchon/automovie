import { engineDiagnostic, resolveAutoMovieMaterial } from "@automovie/engine";
import { IAutoMovieCompiledShotSource, IAutoMovieDiagnostic, type IAutoMoviePlantingInstallation, type IAutoMovieSoftFurnishing, type IAutoMovieWaterFeature } from "@automovie/interface";

/**
 * Resolve non-null water, furnishing and planting material citations against the complete compiled model population. Resolution failures become diagnostics at the original simulated-surface field path.
 *
 * @evidence contracts/common.md#principled-implementation Bindings preserve original array indices, and the canonical cross-model resolver admits only one consistent material definition. Null means no material citation and is skipped.
 * @evidence contracts/common.md#clear-and-simple-design This adapter translates resolver throws into shot diagnostics; canonical material equality and ambiguity rules remain owned by the engine resolver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fallback material or first conflicting definition is substituted. All caught values become messages using the existing Error-versus-string rule, and only a final period is removed from Error messages.
 * @evidence contracts/common.md#meaningful-documentation States supported surface fields, null skipping, full compiled candidate population, original indices and diagnostic conversion without modifying the artifact.
 * @evidence contracts/performance.md#efficient-algorithms Building B binding records costs O(B); each non-null citation rescans all model materials and sorts/canonicalizes matching definitions. Repeated ids repeat resolver work because no unchanged-material inventory cache is maintained here.
 * @evidence contracts/performance.md#reuse-equivalent-work All surface families share the same canonical resolver semantics. Results are not cached across citations or calls, so mutable material definitions cannot be served from stale identity-only keys.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Bindings and failed-resolution temporaries last for this call; returned diagnostics belong to the caller and no native material, shader, file or task is created.
 */
export const shotValidationMaterialBindings: (id: string, value: IAutoMovieCompiledShotSource) => IAutoMovieDiagnostic[] = (
  id: string,
  value: IAutoMovieCompiledShotSource,
): IAutoMovieDiagnostic[] => {
  const bindings: Array<{ path: string; material: string | null }> = [
    ...(value.waterFeatures ?? []).map((feature: IAutoMovieWaterFeature, index: number) : { path: string; material: string | null; } => ({
      path: `waterFeatures[${index}].material`,
      material: feature.material,
    })),
    ...(value.softFurnishings ?? []).map((furnishing: IAutoMovieSoftFurnishing, index: number) : { path: string; material: string | null; } => ({
      path: `softFurnishings[${index}].material`,
      material: furnishing.material,
    })),
    ...(value.plantingInstallations ?? []).flatMap((installation: IAutoMoviePlantingInstallation, index: number) : { path: string; material: string | null; }[] => [
      {
        path: `plantingInstallations[${index}].branchMaterial`,
        material: installation.branchMaterial,
      },
      {
        path: `plantingInstallations[${index}].leafMaterial`,
        material: installation.leafMaterial,
      },
    ]),
  ];
  return bindings.flatMap((binding: { path: string; material: string | null; }) : IAutoMovieDiagnostic[] => {
    if (binding.material === null) return [];
    try {
      resolveAutoMovieMaterial({
        models: value.models,
        material: binding.material,
      });
      return [];
    } catch (error) {
      const message: string =
        error instanceof Error ? error.message.replace(/\.$/u, "") : `${error}`;
      return [
        engineDiagnostic(
          id,
          binding.path,
          `must resolve to one compiled material definition, but ${message}`,
        ),
      ];
    }
  });
};
