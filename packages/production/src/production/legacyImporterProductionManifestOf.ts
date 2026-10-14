import { IAutoMovieLegacyImportPlan, IAutoMovieProductionManifest } from "@automovie/interface";
import { legacyImporterProjectIdOf } from "./legacyImporterProjectIdOf";

/**
 * Declare the v2 project roots and imported v1 revision from the physical legacy project's basename and admitted plan. Existing legacy content remains at the same source root.
 *
 * @evidence contracts/common.md#principled-implementation The project basename identifies the local production and fixed source/generated/render roots describe this supported v2 layout, while imported revision comes from the plan's witnessed legacy state.
 * @evidence contracts/common.md#clear-and-simple-design Owns one manifest value consumed by the exact import byte composer, separate from file publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not claim generated source or rendering exists; the importedLegacy sourceRoot dot preserves resident v1 provenance rather than moving assets.
 * @evidence contracts/common.md#meaningful-documentation States layout defaults, basename-derived ID and imported revision provenance.
 * @evidence contracts/performance.md#efficient-algorithms Constructs a fixed field population with path-basename work following root string length and constant-sized structural storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the shared project-ID derivation and current plan revision; it stores no manifest cache across roots or plans.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns caller-owned data and acquires no file, directory lease or renderer resource.
 */
export const legacyImporterProductionManifestOf: (root: string, plan: IAutoMovieLegacyImportPlan) => IAutoMovieProductionManifest = (
  root: string,
  plan: IAutoMovieLegacyImportPlan,
): IAutoMovieProductionManifest => ({
  formatVersion: 2,
  projectId: legacyImporterProjectIdOf(root),
  sourceRoots: ["src"],
  generatedRoot: "generated",
  renderRoot: "renders",
  importedLegacy: {
    revision: plan.legacyRevision,
    sourceRoot: ".",
  },
});
