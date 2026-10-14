import { materializeCompiledFormationInventory, materializeCompiledInstanceSetInventory, validateAutoMovieEnvironmentContext, validateBuiltEnvironment, validateModel } from "@automovie/engine";
import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import type { IAutoMovieAssetProvenance, IAutoMovieBuildProjectInput, IAutoMovieBuildProjectOutput, IAutoMovieCompiledContractRealization, IAutoMovieCompiledShotSource, IAutoMovieDiagnostic, IAutoMovieFilmBuildContext, IAutoMovieFilmEdit, IAutoMovieGeneratedFile, IAutoMovieGeneratedManifest } from "@automovie/interface";
import type { IAutoMovieProductionRenderJobPlan } from "@automovie/render";
import { createRequire } from "node:module";
import path from "node:path";
import type { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import type { IAutoMovieProductionContentInput } from "./IAutoMovieProductionContentInput";
import type { IAutoMovieProductionSourceGateTrace } from "./IAutoMovieProductionSourceGateTrace";
import { compileAutoMovieLibrary } from "./compileAutoMovieLibrary";
import { compileAutoMovieProductionShots } from "./compileAutoMovieProductionShots";
import { finishAutoMovieProductionBuild } from "./finishAutoMovieProductionBuild";
import { type IAutoMovieFingerprintField, compareCodeUnits, digestAutoMovieBytes } from "./contentIdentity";
import { inspectAutoMovieDerivedArtifacts } from "./derivedArtifacts";
import { inspectAutoMovieGeneratedOwnership } from "./inspectAutoMovieGeneratedOwnership";
import { listAutoMovieProjectModules } from "./listAutoMovieProjectModules";
import { type IAutoMovieExternalModelRuntimeBinding, materializeProductionModels } from "./materializeProduction";
import { productionAssetInventory, validateCompiledAssetUses } from "./productionAssetInventory";
import { materializeFilmArtifacts, materializeGeneratedFiles } from "./productionBuildArtifacts";
import { errorMessage, listFiles, missingDesignDiagnostics } from "./productionBuildDiagnostics";
import { authoringEvidenceFingerprintFields, contentFingerprintFields, currentAutoMovieProductionBuildInputFingerprintWithEvidence, productionBuildInputFingerprint } from "./productionBuildIdentity";
import { AUTOMOVIE_PRODUCTION_BUILD_PROTOCOL, AUTOMOVIE_PRODUCTION_BUILD_VERSION } from "./productionBuildProtocol";
import { sourceTargetsOf } from "./sourceTargetsOf";
import type { IProductionExternalMotionAdoption } from "./IProductionExternalMotionAdoption";
import type { IProductionExternalMotionConversionDraft } from "./IProductionExternalMotionConversionDraft";
import { type ICompiledFilmDraft, assembleFilm, buildFilmEdit, filmDiagnostic } from "./productionFilmAssembly";
import { productionProjectionRadii } from "./productionProjectionRadii";
import type { ISourceBuildResult } from "./ISourceBuildResult";
import { buildLibrarySource } from "./buildLibrarySource";
import { readAutoMovieLibraryDerivedInputs } from "./readAutoMovieLibraryDerivedInputs";
import { readAutoMovieProductionBuildSources } from "./readAutoMovieProductionBuildSources";
import { recordAutoMovieProductionDocumentRead } from "./recordAutoMovieProductionDocumentRead";
import { reviewAutoMovieProductionBuild } from "./reviewAutoMovieProductionBuild";
import { resolveAutoMovieTimedAuthoringKind } from "./resolveAutoMovieTimedAuthoringKind";
import { validateAutoMovieProductionGraph } from "./validateProductionDesign";

/**
 * Execute one observed design, source or final compilation transaction.
 *
 * Authored modules are evicted before evaluation. Domain phases accumulate
 * diagnostics against one input revision, then current inputs are confirmed
 * before returning or atomically publishing the generated set. Read-only
 * execution never repairs ownership or publishes files.
 *
 * @evidence contracts/common.md#principled-implementation Ordered fingerprint fields bind design, source, content and authoring ownership to the observed revision; a before-and-after current-input projection refuses races, while library and timed productions follow their declared source contracts.
 * @evidence contracts/common.md#clear-and-simple-design This coordinator owns attempt ordering and publication authority, delegating source observation, shot compilation, production review and domain validators to their respective phases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No failed diagnostic is repaired into publication; lint disables generated repair and writes, and currentness failures refuse the attempt instead of retrying over changed inputs.
 * @evidence contracts/common.md#meaningful-documentation States cache eviction, observed revision, accumulated findings, current-input confirmation, atomic publication and read-only effects.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes one design validation, one declared content observation, runtime inventory construction, per-source compilation and production review, plus currentness rereads required to guard publication. Phase owners account for geometry/media algorithms; this coordinator additionally hashes complete source/content fields and sorts generated entries and diagnostics.
 * @evidence contracts/performance.md#reuse-equivalent-work One observed content inventory feeds fingerprinting and asset admission; normalized source buffers and compiled runtime inventories serve the attempt's downstream phases. Effectful source execution is never shared across separate attempts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Attempt-local maps and buffers scale with declared sources, content and generated outputs, with no fixed byte cap. Project readers and publication own handles and cleanup; the process module cache retains executed modules until the next attempt evicts this project's closure.
 */
export function runAutoMovieProductionBuild(props: {
  project: AutoMovieProductionProject;
  authoringEvidence: IAutoMovieProductionEvidence | undefined;
  currentAuthoringEvidence: (() => IAutoMovieProductionEvidence) | undefined;
  finalRenderPlan: IAutoMovieProductionRenderJobPlan | undefined;
  input: IAutoMovieBuildProjectInput;
  materialize: boolean;
  trace?: IAutoMovieProductionSourceGateTrace;
}): IAutoMovieBuildProjectOutput {
  const { project, authoringEvidence, currentAuthoringEvidence, finalRenderPlan, input, materialize, trace }: typeof props = props;
    const require: ReturnType<typeof createRequire> = createRequire(path.join(project.root, "package.json"));
    for (const id of listAutoMovieProjectModules({
      root: project.root,
      loaded: Object.keys(require.cache),
    }))
      delete require.cache[id];

    if (authoringEvidence?.manifest.kind === "library")
      return compileAutoMovieLibrary({
        project: project,
        input,
        materialize,
        authoringEvidence: authoringEvidence,
        currentAuthoringEvidence: currentAuthoringEvidence,
        runtime: {
          readDerived: (enabled: boolean): ReturnType<typeof readAutoMovieLibraryDerivedInputs> =>
            readAutoMovieLibraryDerivedInputs({
              project: project,
              enabled,
            }),
          evaluateSource: buildLibrarySource,
          listGenerated: listFiles,
          validators: {
            environment: validateBuiltEnvironment,
            model: validateModel,
            context: validateAutoMovieEnvironmentContext,
          },
        },
      });
    const timedAuthoring: NonNullable<ReturnType<typeof resolveAutoMovieTimedAuthoringKind>> = resolveAutoMovieTimedAuthoringKind(
      authoringEvidence,
    )!;
    const graph: ReturnType<AutoMovieProductionProject["graph"]> = project.graph();
    const screenplay: ReturnType<AutoMovieProductionProject["screenplayIndex"]> = project.screenplayIndex();
    const inputRevision: number = project.revision();
    const projectManifest: ReturnType<AutoMovieProductionProject["manifest"]> = project.manifest();
    const archetypes: AutoMovieProductionProject["archetypes"] = project.archetypes;
    const readDocument: ReturnType<typeof recordAutoMovieProductionDocumentRead> = recordAutoMovieProductionDocumentRead({
      trace,
      read: (documentPath: string): string | null => project.readProseDocument(documentPath),
    });
    const diagnostics: IAutoMovieDiagnostic[] = [
      ...missingDesignDiagnostics(project, graph),
      ...validateAutoMovieProductionGraph(
        graph,
        project.productionId,
        archetypes,
      ),
    ];
    const designReady: boolean = diagnostics.every(
      (diagnostic: IAutoMovieDiagnostic): boolean => diagnostic.category !== "error",
    );
    const sourceFields: IAutoMovieFingerprintField[] = [
      ...authoringEvidenceFingerprintFields(authoringEvidence),
    ];
    const contentFields: IAutoMovieFingerprintField[] = [];
    let contentInputs: IAutoMovieProductionContentInput[] | undefined;
    let declaredAssets: string[] = [];
    let assetRecords: IAutoMovieAssetProvenance[] = [];
    let derivedArtifacts: IAutoMovieFilmBuildContext["derivedArtifacts"] = {};
    let derivedArtifactsReady: boolean = true;
    let externalModels: Map<string, IAutoMovieExternalModelRuntimeBinding> = new Map();
    let externalMotions: Map<string, IProductionExternalMotionAdoption> = new Map();
    if (input.scope !== "design")
      try {
        contentInputs = project.contentInputs();
        contentFields.push(...contentFingerprintFields(contentInputs));
        const assetInventory: ReturnType<typeof productionAssetInventory> = productionAssetInventory(
          projectManifest.assetManifest,
          contentInputs,
          graph.production?.id ?? project.productionId,
          graph,
          archetypes,
        );
        diagnostics.push(...assetInventory.diagnostics);
        declaredAssets = assetInventory.assets;
        assetRecords = assetInventory.records;
        externalModels = assetInventory.externalModels;
        externalMotions = assetInventory.externalMotions;
      } catch (error) {
        diagnostics.push({
          code: "content-input-unsafe",
          category: "error",
          phase: "source",
          target: "declared-content",
          // No one file owns the content inventory: it is read across every
          // content root and file the layout declares.
          path: null,
          message: `${errorMessage(error)} Correct contentRoots/contentFiles ownership before running the builder.`,
        });
        contentFields.push({
          role: "content:inventory",
          kind: "unsafe",
          payload: new Uint8Array(),
        });
      }
    if (input.scope !== "design") {
      const inspection: ReturnType<typeof inspectAutoMovieDerivedArtifacts> = inspectAutoMovieDerivedArtifacts({
        root: project.root,
        manifestPath: projectManifest.derivedArtifactManifest,
        externalAssetPaths: assetRecords.map((asset: IAutoMovieAssetProvenance): string => asset.path),
      });
      contentFields.push(...inspection.fingerprintFields);
      derivedArtifacts = inspection.artifacts;
      derivedArtifactsReady = inspection.problems.length === 0;
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
    }
    const compiled: Map<string, IAutoMovieCompiledShotSource> = new Map();
    const externalMotionConversions: Map<string, IProductionExternalMotionConversionDraft> = new Map();
    const realizations: Map<string, IAutoMovieCompiledContractRealization> = new Map();
    let runtimeModels: Map<string, IAutoMovieCompiledShotSource["models"][number]> = new Map();
    let formationRuntime: ReturnType<
      typeof materializeCompiledFormationInventory
    > = {};
    let instanceSetRuntime: ReturnType<
      typeof materializeCompiledInstanceSetInventory
    > = {};
    let projectionRadii: ReadonlyMap<string, number> = new Map();
    if (input.scope !== "design" && designReady) {
      runtimeModels = new Map(
        materializeProductionModels(graph.models, externalModels, archetypes),
      );
      projectionRadii = productionProjectionRadii(
        graph.models,
        externalModels,
        archetypes,
      );
      formationRuntime = materializeCompiledFormationInventory({
        formations: graph.formations,
        recipes: graph.models,
        projectionRadii,
        surfaces: graph.world!.surfaces,
      });
      instanceSetRuntime = materializeCompiledInstanceSetInventory({
        world: graph.world!,
        recipes: graph.models,
        projectionRadii,
      });
    }
    const { shotSources, filmSource, filmSourceDigest }: ReturnType<typeof readAutoMovieProductionBuildSources> = readAutoMovieProductionBuildSources({ project, input, graph, sourceFields, diagnostics });
    let filmContext: IAutoMovieFilmBuildContext | null = null;
    let filmEditSource: ISourceBuildResult<IAutoMovieFilmEdit> | null = null;
    if (
      input.scope !== "design" &&
      designReady &&
      derivedArtifactsReady &&
      filmSource !== null &&
      contentInputs !== undefined
    ) {
      filmContext = {
        production: graph.production!,
        shots: Object.fromEntries(graph.shots),
        assets: declaredAssets,
        derivedArtifacts,
        effectZones: graph.world!.effectZones,
      };
      filmEditSource = buildFilmEdit({
        source: Buffer.from(filmSource).toString("utf8"),
        sourceRoot: project.root,
        context: filmContext,
      });
    }

    compileAutoMovieProductionShots({ project, authoringEvidence, input, graph, screenplay, inputRevision, designReady, derivedArtifactsReady, derivedArtifacts, filmEditSource, shotSources, runtimeModels, formationRuntime, instanceSetRuntime, externalMotions, projectionRadii, trace, diagnostics, compiled, externalMotionConversions, realizations });
    let compiledFilm: ICompiledFilmDraft | null = null;
    if (filmContext !== null && filmEditSource !== null) {
      const film: ReturnType<typeof assembleFilm> = assembleFilm({
        source: filmEditSource,
        context: filmContext,
        contracts: graph.shots,
        compiled,
        realizations,
        scope: input.scope,
      });
      diagnostics.push(...film.diagnostics);
      if (film.value !== null) {
        const useDiagnostics: IAutoMovieDiagnostic[] = validateCompiledAssetUses(
          graph.production!.id,
          assetRecords,
          film.value.edit,
        );
        diagnostics.push(...useDiagnostics);
        if (useDiagnostics.length === 0) compiledFilm = film.value;
      }
    }
    const inputFingerprint: string = productionBuildInputFingerprint(
      project.productionId,
      graph,
      sourceFields,
      contentFields,
    );
    let filmArtifacts: ReturnType<typeof materializeFilmArtifacts> | null =
      null;
    if (compiledFilm !== null && filmSourceDigest !== null)
      try {
        filmArtifacts = materializeFilmArtifacts(
          compiledFilm,
          filmSourceDigest,
          inputFingerprint,
          graph.production!,
          graph.world!,
          compiled,
        );
      } catch (error) {
        // The film-effect runtime throws nothing but its typed Error refusal.
        diagnostics.push(
          filmDiagnostic("film-effect-cue-invalid", (error as Error).message),
        );
      }
    const inputCurrent: () => boolean = (): boolean => {
      try {
        const currentAuthoring: IAutoMovieProductionEvidence | undefined =
          currentAuthoringEvidence === undefined
            ? authoringEvidence
            : currentAuthoringEvidence();
        return (
          `${project.revision()}\0${currentAutoMovieProductionBuildInputFingerprintWithEvidence(project, input.scope, currentAuthoring)}\0${project.revision()}` ===
          `${inputRevision}\0${inputFingerprint}\0${inputRevision}`
        );
      } catch {
        return false;
      }
    };
    const files: ReturnType<typeof materializeGeneratedFiles> | null =
      input.scope === "design"
        ? null
        : materializeGeneratedFiles(
            project.productionId,
            graph,
            runtimeModels,
            compiled,
            externalMotionConversions,
            realizations,
            filmArtifacts,
            inputFingerprint,
          );
    const entries: IAutoMovieGeneratedFile[] =
      files === null
        ? []
        : [...files]
            .map(([file, bytes]: [string, Uint8Array]): IAutoMovieGeneratedFile => ({
              path: file,
              owner: "builder" as const,
              digest: digestAutoMovieBytes(bytes),
              sourceTargets: sourceTargetsOf(file, graph),
            }))
            .sort((left: IAutoMovieGeneratedFile, right: IAutoMovieGeneratedFile): number => compareCodeUnits(left.path, right.path));
    const manifest: IAutoMovieGeneratedManifest | null =
      files === null
        ? null
        : {
            version: 1,
            builder: {
              packageVersion: AUTOMOVIE_PRODUCTION_BUILD_VERSION,
              protocolVersion: AUTOMOVIE_PRODUCTION_BUILD_PROTOCOL,
            },
            inputFingerprint,
            files: entries,
          };
    if (manifest !== null)
      diagnostics.push(
        ...inspectAutoMovieGeneratedOwnership({
          project: project,
          expected: manifest,
          repairDeclaredFiles: materialize,
          listFiles,
        }),
      );
    reviewAutoMovieProductionBuild({ project, input, graph, screenplay, projectManifest, timedAuthoring, readDocument, diagnostics, realizations, compiled, manifest, contentInputs, assetRecords, inputFingerprint, finalRenderPlan });
  return finishAutoMovieProductionBuild({ project, input, materialize, diagnostics, inputCurrent, inputFingerprint, inputRevision, files, manifest, entries });
}
