import type { IAutoMovieAssetProvenance, IAutoMovieDerivedArtifactSource, IAutoMovieDiagnostic } from "@automovie/interface";
import type { IAutoMovieProductionContentInput } from "./IAutoMovieProductionContentInput";
import type { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import type { IAutoMovieFingerprintField } from "./contentIdentity";
import { inspectAutoMovieDerivedArtifacts } from "./derivedArtifacts";
import { productionAssetInventory } from "./productionAssetInventory";
import { errorMessage } from "./productionBuildDiagnostics";
import { contentFingerprintFields } from "./productionBuildIdentity";

/**
 * Read library content identity, adopted assets and admitted derivation artifacts.
 *
 * Disabled design reads touch no project method. Enabled reads obtain manifest outside inventory recovery, then content and asset inventory; inventory failure appends an unsafe field and diagnostic while preserving any content already read. Derivation inspection still runs afterward. Manifest or derivation-inspection throws outside that recovery propagate.
 *
 * Library execution and later currentness checks use this same field policy, but perform separate mutable reads; sharing a function does not establish one physical snapshot. Returned content/artifact/asset values follow their admitted owners rather than being deep-copied here.
 *
 * @evidence contracts/common.md#principled-implementation Content fingerprint fields and verified derivation closure bind library execution inputs; unsafe inventory contributes explicit refusal identity and diagnostics. Asset-ledger and derived-artifact admission stay with their canonical validators.
 * @evidence contracts/common.md#clear-and-simple-design One reader returns execution artifacts and identity fields together, avoiding divergent content policies between compileAutoMovieLibrary and acquireAutoMovieProductionSourceSnapshot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Disabled reads intentionally omit content for design scope. Inventory failure does not become a safe empty inventory; previously observed content remains, unsafe identity is appended and independent derivation inspection proceeds without swallowing its own failures.
 * @evidence contracts/common.md#meaningful-documentation States disabled-read ownership, recovery boundaries, partial content preservation, admitted borrowed records and the limitation of separate currentness observations.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes complete content-byte fingerprinting, asset inventory's geometry/audio/motion admission, and full derived closure reads/hash/parse, plus field and diagnostic array construction. The reader must inspect all declared dependencies; no measured speedup or fixed-size bound is claimed.
 * @evidence contracts/performance.md#reuse-equivalent-work Compile and currentness share the same identity policy, while each call rereads mutable dependencies. Within a call, admitted artifacts serve execution and fingerprint fields; no cross-call content cache is owned here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned arrays and artifacts transfer to the caller and can retain admitted content bytes until released. Callees own filesystem handle cleanup; this reader starts no task, and declared content/artifact/diagnostic populations have no cap here.
 */
export function readAutoMovieLibraryDerivedInputs(
  props: {
  /** Project handle the library compiles in. */
  project: AutoMovieProductionProject;


  /** Whether the requested scope reads content at all. */
  enabled: boolean;
}
): {
  /** Derived artifacts admitted to library execution. */
  artifacts: Readonly<Record<string, IAutoMovieDerivedArtifactSource>>;


  /** Content inventory and derivation closure fields in read order. */
  fields: IAutoMovieFingerprintField[];

  /** Inventory, asset ledger and derivation refusals. */
  diagnostics: IAutoMovieDiagnostic[];


  /** Adopted asset records the ledger declares. */
  assets: IAutoMovieAssetProvenance[];

  /** Declared content inputs, retained if a later asset-inventory step fails; empty when content acquisition failed or was disabled. */
  content: IAutoMovieProductionContentInput[];
} {
  const fields: IAutoMovieFingerprintField[] = [];
  const diagnostics: IAutoMovieDiagnostic[] = [];
  let assets: IAutoMovieAssetProvenance[] = [];
  let content: IAutoMovieProductionContentInput[] = [];
  if (props.enabled === false)
    return { artifacts: {}, fields, diagnostics, assets, content };
  const project: AutoMovieProductionProject = props.project;
  const manifest: ReturnType<AutoMovieProductionProject["manifest"]> = project.manifest();
  let externalAssetPaths: string[] = [];
  try {
    content = project.contentInputs();
    fields.push(...contentFingerprintFields(content));
    const inventory: ReturnType<typeof productionAssetInventory> = productionAssetInventory(
      manifest.assetManifest,
      content,
      project.productionId,
      project.graph(),
      project.archetypes,
    );
    assets = inventory.records;
    externalAssetPaths = assets.map((asset: IAutoMovieAssetProvenance): string => asset.path);
    diagnostics.push(...inventory.diagnostics);
  } catch (error) {
    fields.push({
      role: "content:inventory",
      kind: "unsafe",
      payload: new Uint8Array(),
    });
    diagnostics.push({
      code: "content-input-unsafe",
      category: "error",
      phase: "source",
      target: "declared-content",
      path: null,
      message: errorMessage(error),
    });
  }
  const inspection: ReturnType<typeof inspectAutoMovieDerivedArtifacts> = inspectAutoMovieDerivedArtifacts({
    root: project.root,
    manifestPath: manifest.derivedArtifactManifest,
    externalAssetPaths,
  });
  fields.push(...inspection.fingerprintFields);
  diagnostics.push(
    ...inspection.problems.map(
      (problem: ReturnType<typeof inspectAutoMovieDerivedArtifacts>["problems"][number]): IAutoMovieDiagnostic => ({
        code: problem.code,
        category: "error",
        phase: "project",
        target: problem.target,
        path: problem.path,
        message: problem.message,
      }),
    ),
  );
  return {
    artifacts: inspection.artifacts,
    fields,
    diagnostics,
    assets,
    content,
  };
}
