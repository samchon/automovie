import { compileAutoMovieLibrary } from "./compileAutoMovieLibrary";
import { publishAutoMovieGeneratedCompilation } from "./publishAutoMovieGeneratedCompilation";
import {
  materializeCompiledFormationInventory,
  materializeCompiledInstanceSetInventory,
  realizeShotContract,
  validateAutoMovieEnvironmentContext,
  validateBuiltEnvironment,
  validateDesignLineageBinding,
  validateModel,
} from "@automovie/engine";
import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import {
  AutoMovieContentDigest,
  IAutoMovieAssetProvenance,
  IAutoMovieBeatEndState,
  IAutoMovieBuildProjectInput,
  IAutoMovieBuildProjectOutput,
  IAutoMovieCompiledContractRealization,
  IAutoMovieCompiledShotSource,
  IAutoMovieDesignEvidence,
  IAutoMovieDesignLineage,
  IAutoMovieDesignReference,
  IAutoMovieDiagnostic,
  IAutoMovieFilmBuildContext,
  IAutoMovieFilmEdit,
  IAutoMovieGeneratedFile,
  IAutoMovieGeneratedManifest,
  IAutoMovieModel,
  IAutoMovieRenderBundleManifest,
} from "@automovie/interface";
import { type IAutoMovieProductionRenderJobPlan } from "@automovie/render";
import { createRequire } from "node:module";
import path from "node:path";
import typia from "typia";

import {
  AutoMovieProductionProject,
  IAutoMovieProductionContentInput,
} from "./AutoMovieProductionProject";
import type { IAutoMovieProductionSourceGateTrace } from "./IAutoMovieProductionSourceGateTrace";
import {
  IAutoMovieFingerprintField,
  canonicalAutoMovieJsonBytes,
  compareCodeUnits,
  digestAutoMovieBytes,
  encodeAutoMoviePathSegment,
  normalizeAutoMovieSource,
} from "./contentIdentity";
import { inspectAutoMovieDerivedArtifacts } from "./derivedArtifacts";
import { confirmAutoMovieBuildInputSnapshot } from "./confirmAutoMovieBuildInputSnapshot";
import { designReferenceDiagnostics } from "./designReferenceDiagnostics";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import { inspectAutoMovieGeneratedOwnership } from "./inspectAutoMovieGeneratedOwnership";
import { listAutoMovieProjectModules } from "./listAutoMovieProjectModules";
import {
  IAutoMovieExternalModelRuntimeBinding,
  materializeCompiledShot,
  materializeProductionModels,
} from "./materializeProduction";
import {
  productionAssetInventory,
  validateCompiledAssetUses,
} from "./productionAssetInventory";
import {
  materializeFilmArtifacts,
  materializeGeneratedFiles,
} from "./productionBuildArtifacts";
import {
  compareDiagnostics,
  errorMessage,
  filmSourcePathDiagnostic,
  listFiles,
  missingDesignDiagnostics,
  sourcePathDiagnostic,
} from "./productionBuildDiagnostics";
import {
  authoringEvidenceFingerprintFields,
  contentFingerprintFields,
  currentAutoMovieProductionBuildInputFingerprintWithEvidence,
  productionBuildInputFingerprint,
} from "./productionBuildIdentity";
import {
  AUTOMOVIE_PRODUCTION_BUILD_PROTOCOL,
  AUTOMOVIE_PRODUCTION_BUILD_VERSION,
} from "./productionBuildProtocol";
import { sourceTargetsOf, statusesOf } from "./productionBuildStatus";
import { finalDeliverableDiagnostics } from "./productionDeliveryValidation";
import {
  IProductionExternalMotionAdoption,
  IProductionExternalMotionConversionDraft,
} from "./productionExternalMotion";
import {
  FILM_SOURCE_PATH,
  ICompiledFilmDraft,
  assembleFilm,
  buildFilmEdit,
  filmDiagnostic,
} from "./productionFilmAssembly";
import { productionProjectionRadii } from "./productionProjectionRadii";
import {
  screenplayCoverageDiagnostics,
  screenplayResidencyDiagnostics,
} from "./productionScreenplayValidation";
import {
  ICompiledVideoClosing,
  assembleShotSource,
  fullHardCutBoundary,
  shotAssemblyOrder,
  shotSourceOwnerTarget,
} from "./productionShotAssembly";
import { validateCompiledShot } from "./productionShotValidation";
import {
  ISourceBuildResult,
  buildLibrarySource,
} from "./productionSourceBuild";
import { productionTextureClosureDiagnostics } from "./productionTextureClosure";
import { readAutoMovieLibraryDerivedInputs } from "./readAutoMovieLibraryDerivedInputs";
import { recordAutoMovieProductionClearanceRevision } from "./recordAutoMovieProductionClearanceRevision";
import { recordAutoMovieProductionDocumentRead } from "./recordAutoMovieProductionDocumentRead";
import { productionRenderTargetFingerprint } from "./renderIdentity";
import {
  assetReviewEvidenceDiagnostics,
  consumedModelIds,
  reviewEvidenceDiagnostics,
} from "./reviewEvidenceDiagnostics";
import { screenplayLedgerDiagnostics } from "./screenplayLedgerDiagnostics";
import { screenplayProseDiagnostics } from "./screenplayProseDiagnostics";
import { screenplayTimingDiagnostics } from "./screenplayTimingDiagnostics";
import { shotDeterminismDiagnostics } from "./shotDeterminismDiagnostics";
import {
  attributeAutoMovieCompiledShotSource,
  resolveAutoMovieSourceOwnerBinding,
} from "./sourceOwnerBinding";
import { storySyncDiagnostics } from "./storySyncDiagnostics";
import { resolveAutoMovieTimedAuthoringKind } from "./timedAuthoringKind";
import { validateAutoMovieProductionGraph } from "./validateProductionDesign";

/**
 * Assemble authored modules into validated production artifacts.
 *
 * Project scripts execute under ttsx. Node loads the authored modules; the
 * engine owns geometry and motion validation, and the project store publishes
 * the resulting artifact set atomically.
 *
 * @author Samchon
 */
export class AutoMovieProductionBuilder {
  public constructor(
    private readonly project: AutoMovieProductionProject,
    private readonly authoringEvidence?: IAutoMovieProductionEvidence,
    private readonly currentAuthoringEvidence?: () => IAutoMovieProductionEvidence,
    private readonly finalRenderPlan?: IAutoMovieProductionRenderJobPlan,
  ) {}

  /**
   * Whether one compiled model carries a skeleton.
   *
   * The extreme-range pose is part of an asset's required view set only for a
   * rigged model, because a rig that reads correctly at rest is exactly the rig
   * whose limits nobody looked at. A model whose compiled bytes cannot be read
   * is reported by the builder's own registry diagnostics, so it is treated as
   * unrigged here rather than raising a second, worse-placed error.
   */
  private compiledModelIsRigged(model: string): boolean {
    try {
      const validation = typia.validateEquals<IAutoMovieModel>(
        parseAutoMovieStructuredJson({
          record: "compiled-model",
          bytes: this.project.readGeneratedFile(
            `models/${encodeAutoMoviePathSegment(model)}.json`,
          ),
        }),
      );
      return validation.success && validation.data.skeleton !== null;
    } catch {
      return false;
    }
  }

  /**
   * Compile the active design and source through the requested gate.
   */
  public build(
    input: IAutoMovieBuildProjectInput,
  ): IAutoMovieBuildProjectOutput {
    return this.run(input, true);
  }

  /**
   * Run every builder gate without materializing generated files.
   *
   * Project linters use this entry point so a read-only check can never repair
   * the ownership or freshness failure it is supposed to report.
   */
  public lint(
    input: IAutoMovieBuildProjectInput,
  ): IAutoMovieBuildProjectOutput {
    return this.run(input, false);
  }

  /**
   * Run the read-only gate at source scope and report what its answer read.
   *
   * Every author-owned document the validation reads is reported with the text
   * it saw, and `revisionBound` says whether a camera clearance evaluation read
   * the project revision into the answer. A retained source status needs both
   * to decide from a fresh read alone whether this answer still stands.
   */
  public lintSource(): IAutoMovieProductionSourceGateTrace & {
    output: IAutoMovieBuildProjectOutput;
  } {
    const trace: IAutoMovieProductionSourceGateTrace = {
      documents: [],
      revisionBound: false,
    };
    const output = this.run({ scope: "source" }, false, trace);
    return { ...trace, output };
  }

  private run(
    input: IAutoMovieBuildProjectInput,
    materialize: boolean,
    trace?: IAutoMovieProductionSourceGateTrace,
  ): IAutoMovieBuildProjectOutput {
    const require = createRequire(path.join(this.project.root, "package.json"));
    for (const id of listAutoMovieProjectModules({
      root: this.project.root,
      loaded: Object.keys(require.cache),
    }))
      delete require.cache[id];

    if (this.authoringEvidence?.manifest.kind === "library")
      return compileAutoMovieLibrary({
        project: this.project,
        input,
        materialize,
        authoringEvidence: this.authoringEvidence,
        currentAuthoringEvidence: this.currentAuthoringEvidence,
        runtime: {
          readDerived: (enabled) => readAutoMovieLibraryDerivedInputs({ project: this.project, enabled }),
          evaluateSource: buildLibrarySource,
          listGenerated: listFiles,
          validators: {
            environment: validateBuiltEnvironment,
            model: validateModel,
            context: validateAutoMovieEnvironmentContext,
          },
        },
      });
    const timedAuthoring = resolveAutoMovieTimedAuthoringKind(
      this.authoringEvidence,
    )!;
    const graph = this.project.graph();
    const screenplay = this.project.screenplayIndex();
    const inputRevision = this.project.revision();
    const projectManifest = this.project.manifest();
    const archetypes = this.project.archetypes;
    const readDocument = recordAutoMovieProductionDocumentRead({
      trace,
      read: (documentPath) => this.project.readProseDocument(documentPath),
    });
    const diagnostics: IAutoMovieDiagnostic[] = [
      ...missingDesignDiagnostics(this.project, graph),
      ...validateAutoMovieProductionGraph(
        graph,
        this.project.productionId,
        archetypes,
      ),
    ];
    const designReady = diagnostics.every(
      (diagnostic) => diagnostic.category !== "error",
    );
    const sourceFields: IAutoMovieFingerprintField[] = [
      ...authoringEvidenceFingerprintFields(this.authoringEvidence),
    ];
    const contentFields: IAutoMovieFingerprintField[] = [];
    let contentInputs: IAutoMovieProductionContentInput[] | undefined;
    let declaredAssets: string[] = [];
    let assetRecords: IAutoMovieAssetProvenance[] = [];
    let derivedArtifacts: IAutoMovieFilmBuildContext["derivedArtifacts"] = {};
    let derivedArtifactsReady = true;
    let externalModels = new Map<
      string,
      IAutoMovieExternalModelRuntimeBinding
    >();
    let externalMotions = new Map<string, IProductionExternalMotionAdoption>();
    if (input.scope !== "design")
      try {
        contentInputs = this.project.contentInputs();
        contentFields.push(...contentFingerprintFields(contentInputs));
        const assetInventory = productionAssetInventory(
          projectManifest.assetManifest,
          contentInputs,
          graph.production?.id ?? this.project.productionId,
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
      const inspection = inspectAutoMovieDerivedArtifacts({
        root: this.project.root,
        manifestPath: projectManifest.derivedArtifactManifest,
        externalAssetPaths: assetRecords.map((asset) => asset.path),
      });
      contentFields.push(...inspection.fingerprintFields);
      derivedArtifacts = inspection.artifacts;
      derivedArtifactsReady = inspection.problems.length === 0;
      diagnostics.push(
        ...inspection.problems.map(
          (problem): IAutoMovieDiagnostic => ({
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
    const compiled = new Map<string, IAutoMovieCompiledShotSource>();
    const externalMotionConversions = new Map<
      string,
      IProductionExternalMotionConversionDraft
    >();
    const realizations = new Map<
      string,
      IAutoMovieCompiledContractRealization
    >();
    let runtimeModels = new Map<
      string,
      IAutoMovieCompiledShotSource["models"][number]
    >();
    let formationRuntime: ReturnType<
      typeof materializeCompiledFormationInventory
    > = {};
    let instanceSetRuntime: ReturnType<
      typeof materializeCompiledInstanceSetInventory
    > = {};
    let projectionRadii: ReadonlyMap<string, number> = new Map();
    let filmSource: Uint8Array | null = null;
    let filmSourceDigest: AutoMovieContentDigest | null = null;
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
    const shotSources = new Map<string, Uint8Array>();
    for (const [id, contract] of graph.shots) {
      if (input.scope === "design") {
        sourceFields.push({
          role: `source:${id}`,
          kind: "not-inspected",
          payload: new Uint8Array(),
        });
        continue;
      }
      let source: Uint8Array;
      try {
        source = this.project.readSource(contract.source.module);
      } catch (error) {
        diagnostics.push(
          sourcePathDiagnostic(id, contract.source.module, error),
        );
        sourceFields.push({
          role: `source:${id}`,
          kind: "absent",
          payload: new Uint8Array(),
        });
        continue;
      }
      const normalized = normalizeAutoMovieSource(source);
      shotSources.set(id, normalized);
      sourceFields.push({
        role: `source:${id}`,
        kind: "typescript",
        payload: normalized,
      });
    }
    if (input.scope === "design")
      sourceFields.push({
        role: "source:film",
        kind: "not-inspected",
        payload: new Uint8Array(),
      });
    else
      try {
        filmSource = normalizeAutoMovieSource(
          this.project.readSource(FILM_SOURCE_PATH),
        );
        filmSourceDigest = digestAutoMovieBytes(filmSource);
        sourceFields.push({
          role: "source:film",
          kind: "typescript",
          payload: filmSource,
        });
      } catch (error) {
        diagnostics.push(filmSourcePathDiagnostic(error));
        sourceFields.push({
          role: "source:film",
          kind: "absent",
          payload: new Uint8Array(),
        });
      }
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
        sourceRoot: this.project.root,
        context: filmContext,
      });
    }

    if (input.scope !== "design" && designReady && derivedArtifactsReady) {
      let previousVideo: ICompiledVideoClosing | null = null;
      for (const entry of shotAssemblyOrder(
        graph.shots,
        filmEditSource?.value ?? null,
      )) {
        const normalized = shotSources.get(entry.id);
        let closing: IAutoMovieBeatEndState | null = null;
        if (normalized !== undefined) {
          const requireReviewed =
            input.scope === "review" || input.scope === "final";
          const owner =
            this.authoringEvidence !== undefined || requireReviewed
              ? resolveAutoMovieSourceOwnerBinding({
                  bindings: this.authoringEvidence?.sourceOwners,
                  branch: "shots",
                  sourcePath: entry.contract.source.module,
                  exportName: entry.contract.source.export,
                  owner: shotSourceOwnerTarget(entry.contract, screenplay),
                  sourceDigest: digestAutoMovieBytes(normalized),
                  requireReviewed,
                })
              : null;
          if (owner !== null && owner.success === false) {
            diagnostics.push({
              code: "source-owner-mismatch",
              category: "error",
              phase: "source",
              target: entry.id,
              path: entry.contract.source.module,
              message: owner.message,
            });
            continue;
          }
          const previous =
            previousVideo !== null &&
            entry.placement !== null &&
            fullHardCutBoundary(
              previousVideo,
              entry,
              graph.production!.frameFormat.fps,
            )
              ? previousVideo.closing
              : null;
          const result = assembleShotSource({
            id: entry.id,
            path: entry.contract.source.module,
            exportName: entry.contract.source.export,
            source: Buffer.from(normalized).toString("utf8"),
            sourceRoot: this.project.root,
            context: {
              contract: entry.contract,
              models: Object.fromEntries(graph.models),
              derivedArtifacts,
              // Undefined when the production declares no lighting, so the
              // frozen context a source reads is unchanged for every production
              // that says nothing about light.
              lighting: graph.production!.lighting,
              world: graph.world!,
              formations: Object.fromEntries(graph.formations),
              runtimeModels: Object.fromEntries(runtimeModels),
              formationRuntime,
              instanceSetRuntime,
              externalMotions: [...externalMotions.values()].filter(
                (adoption) => adoption.declaration.shot === entry.id,
              ),
              frameFormat: graph.production!.frameFormat,
            },
            previous,
            cameraClearance: recordAutoMovieProductionClearanceRevision({
              trace,
              runtime: {
                revision: String(inputRevision),
                currentRevision: String(this.project.revision()),
                sampleRate: graph.production!.frameFormat.fps,
              },
            }),
          });
          diagnostics.push(...result.diagnostics);
          if (result.value !== null) {
            const materialized = materializeCompiledShot({
              contract: entry.contract,
              formations: graph.formations,
              formationRuntime,
              instanceSetRuntime,
              modelRecipes: graph.models,
              runtimeModels,
              world: graph.world!,
              fps: graph.production!.frameFormat.fps,
              source: result.value,
              projectionRadii,
            });
            const realized = realizeShotContract({
              contract: entry.contract,
              production: graph.production,
              world: graph.world,
              formations: graph.formations,
              compiled: materialized.value,
              collisions: materialized.collisions,
            });
            const postDiagnostics = [
              ...validateCompiledShot(entry.contract, materialized.value),
              ...realized.diagnostics,
            ];
            diagnostics.push(...postDiagnostics);
            compiled.set(
              entry.id,
              attributeAutoMovieCompiledShotSource({
                value: materialized.value,
                bindings: this.authoringEvidence?.sourceOwners ?? [],
                entry: owner?.success === true ? owner.binding : null,
              }),
            );
            for (const conversion of result.conversions)
              externalMotionConversions.set(conversion.adoption, conversion);
            realizations.set(entry.id, realized.realization);
            if (
              postDiagnostics.every(
                (diagnostic) => diagnostic.category !== "error",
              )
            )
              closing = result.closing;
          }
        }
        if (entry.placement !== null && entry.placementIndex !== null)
          previousVideo = {
            ...entry,
            placement: entry.placement,
            placementIndex: entry.placementIndex,
            closing,
          };
      }
      // Every shot has now been realized, so a claim spanning several of them
      // can finally be measured. It is deliberately checked before the film is
      // assembled: simultaneity is an assertion about the story, and it stands
      // or falls whatever order the edit later puts these shots in.
      diagnostics.push(
        ...storySyncDiagnostics({
          acceptance: graph.acceptance,
          contracts: graph.shots,
          realizations,
        }),
      );
    }

    let compiledFilm: ICompiledFilmDraft | null = null;
    if (filmContext !== null && filmEditSource !== null) {
      const film = assembleFilm({
        source: filmEditSource,
        context: filmContext,
        contracts: graph.shots,
        compiled,
        realizations,
        scope: input.scope,
      });
      diagnostics.push(...film.diagnostics);
      if (film.value !== null) {
        const useDiagnostics = validateCompiledAssetUses(
          graph.production!.id,
          assetRecords,
          film.value.edit,
        );
        diagnostics.push(...useDiagnostics);
        if (useDiagnostics.length === 0) compiledFilm = film.value;
      }
    }
    const inputFingerprint = productionBuildInputFingerprint(
      this.project.productionId,
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
    const inputCurrent = (): boolean => {
      try {
        const currentAuthoring =
          this.currentAuthoringEvidence === undefined
            ? this.authoringEvidence
            : this.currentAuthoringEvidence();
        return (
          `${this.project.revision()}\0${currentAutoMovieProductionBuildInputFingerprintWithEvidence(this.project, input.scope, currentAuthoring)}\0${this.project.revision()}` ===
          `${inputRevision}\0${inputFingerprint}\0${inputRevision}`
        );
      } catch {
        return false;
      }
    };
    const files =
      input.scope === "design"
        ? null
        : materializeGeneratedFiles(
            this.project.productionId,
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
            .map(([file, bytes]) => ({
              path: file,
              owner: "builder" as const,
              digest: digestAutoMovieBytes(bytes),
              sourceTargets: sourceTargetsOf(file, graph),
            }))
            .sort((left, right) => compareCodeUnits(left.path, right.path));
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
          project: this.project,
          expected: manifest,
          repairDeclaredFiles: materialize,
          listFiles,
        }),
      );
    if (timedAuthoring.kind === "brief" && screenplay !== null)
      diagnostics.push({
        code: "screenplay-index-forbidden",
        category: "error",
        phase: "design",
        target: "screenplay",
        path: null,
        message:
          "A direct brief cannot carry a film screenplay index. Remove the forbidden narrative residue and keep delivery, shot, and observation ownership in the reviewed brief.",
      });
    if (timedAuthoring.screenplayRequired)
      diagnostics.push(
        ...screenplayResidencyDiagnostics({
          contracts: graph.shots,
          screenplay,
        }),
        ...screenplayLedgerDiagnostics({
          acceptance: graph.acceptance,
          contracts: graph.shots,
          screenplay,
          designRecordPath: (target) => this.project.designRecordPath(target),
        }),
        ...screenplayProseDiagnostics({
          screenplay,
          read: readDocument,
        }),
        ...screenplayTimingDiagnostics({
          contracts: graph.shots,
          read: readDocument,
          scope: input.scope,
          screenplay,
        }),
      );
    diagnostics.push(
      ...shotDeterminismDiagnostics({
        contracts: graph.shots,
        read: readDocument,
      }),
    );
    if (input.scope !== "design" && timedAuthoring.screenplayRequired)
      diagnostics.push(
        ...screenplayCoverageDiagnostics({
          acceptance: graph.acceptance,
          contracts: graph.shots,
          realizations,
          scope: input.scope,
          screenplay,
        }),
      );
    // A citation states what was verified and expires when its source moves,
    // which says everything about prose and nothing about pixels. This is the
    // other half: the frames a contract declared must exist at the target's
    // current identity before any review of it can be true.
    //
    // Both halves need the generated manifest and the content inventory to
    // address a target at all. Unsafe content is already reported as
    // `content-input-unsafe`, and a fingerprint computed from an inventory this
    // compile could not read would be a second, worse failure over the same
    // cause. A production with no design record has no clock to resolve a
    // declared time on, and nothing reviewable either. The scope condition is
    // repeated here rather than left to the two functions so that an ordinary
    // `--scope source` compile does not walk the model graph for an answer it
    // will discard.
    const productionDesign = graph.production;
    if (
      manifest !== null &&
      productionDesign !== null &&
      contentInputs !== undefined &&
      (input.scope === "review" || input.scope === "final")
    ) {
      const fingerprint = (
        target: IAutoMovieRenderBundleManifest["target"],
      ): AutoMovieContentDigest =>
        productionRenderTargetFingerprint(
          this.project,
          manifest,
          target,
          contentInputs,
        );
      const captured = (
        target: IAutoMovieRenderBundleManifest["target"],
        digest: AutoMovieContentDigest,
      ): ReturnType<AutoMovieProductionProject["capturedRenderViews"]> =>
        this.project.capturedRenderViews(target, digest);
      diagnostics.push(
        ...reviewEvidenceDiagnostics({
          captured,
          contracts: graph.shots,
          fingerprint,
          fps: productionDesign.frameFormat.fps,
          scope: input.scope,
        }),
        ...assetReviewEvidenceDiagnostics({
          captured,
          consumed: consumedModelIds(graph, compiled),
          fingerprint,
          rigged: (model) => this.compiledModelIsRigged(model),
          scope: input.scope,
        }),
      );
    }
    if (input.scope === "final")
      diagnostics.push(
        ...finalDeliverableDiagnostics(
          this.project,
          graph.production,
          inputFingerprint,
          graph.shots,
          compiled,
          this.finalRenderPlan,
        ),
      );
    // Both production shapes close image uses over their admitted output.
    if (input.scope !== "design" && compiled.size !== 0)
      diagnostics.push(
        ...productionTextureClosureDiagnostics({
          production: graph.production?.id ?? this.project.productionId,
          models: [...compiled.values()].flatMap((shot) => shot.models),
          environments: [...compiled.values()].flatMap(
            (shot) => shot.builtEnvironments ?? [],
          ),
          scenes: [...compiled.values()].map((shot) => ({
            shot: shot.shot.id,
            environment: shot.scene.environment,
          })),
          assets: assetRecords,
          content: contentInputs ?? [],
        }),
      );
    // Hold every observation the buildings read against the bytes it claims,
    // and every phase, alternative and derivation against the identities the
    // buildings publish. Both run here rather than per shot: two shots that
    // stage the same building carry the same documents, so a per-shot gate
    // would read one production's evidence as a duplicate of itself.
    if (input.scope !== "design" && compiled.size !== 0) {
      const referenceOf = new Map<string, IAutoMovieDesignReference>();
      const referenceDigests = new Map<string, AutoMovieContentDigest>();
      const evidence: IAutoMovieDesignEvidence[] = [];
      const lineages = new Map<string, IAutoMovieDesignLineage>();
      const published = new Set<string>();
      for (const shot of compiled.values()) {
        for (const reference of shot.designReferences ?? []) {
          const digest = digestAutoMovieBytes(
            canonicalAutoMovieJsonBytes(reference),
          );
          const seen = referenceDigests.get(reference.id);
          // The same document staged by two shots is one document. Only a
          // second document wearing the same id is a collision, and the gate
          // below is the one that reports it.
          if (seen === undefined || seen !== digest)
            referenceOf.set(reference.id, reference);
          if (seen === undefined) referenceDigests.set(reference.id, digest);
        }
        for (const citation of shot.designEvidence ?? [])
          evidence.push(citation);
        for (const lineage of shot.designLineages ?? [])
          lineages.set(lineage.id, lineage);
        for (const environment of shot.builtEnvironments ?? []) {
          for (const building of environment.buildings)
            published.add(building.id);
          for (const element of environment.elements) published.add(element.id);
          for (const space of environment.spaces) published.add(space.id);
          for (const boundary of environment.boundaries)
            published.add(boundary.id);
          for (const opening of environment.openings) published.add(opening.id);
          for (const connector of environment.connectors)
            published.add(connector.id);
        }
        for (const model of shot.models) published.add(model.id);
      }
      const production = graph.production?.id ?? this.project.productionId;
      const uses = new Map<string, Set<string>>();
      for (const record of assetRecords)
        for (const use of record.uses) {
          if (use.production !== production) continue;
          published.add(use.consumer.id);
          if (use.consumer.kind !== "design-reference") continue;
          const documents = uses.get(record.path) ?? new Set<string>();
          documents.add(use.consumer.id);
          uses.set(record.path, documents);
        }
      if (referenceOf.size !== 0 || evidence.length !== 0 || uses.size !== 0)
        diagnostics.push(
          ...designReferenceDiagnostics({
            path: projectManifest.assetManifest ?? "automovie/assets.json",
            references: [...referenceOf.values()],
            evidence,
            assets: new Map(
              (contentInputs ?? []).map((entry) => [entry.path, entry.bytes]),
            ),
            uses,
          }),
        );
      for (const lineage of lineages.values()) {
        const bound = validateDesignLineageBinding({
          lineage,
          known: [...published],
        });
        if (bound.success === false)
          for (const violation of bound.violations)
            diagnostics.push({
              code: "design-lineage-unbound",
              category: "error",
              phase: "compile",
              target: `design-lineage:${lineage.id}`,
              path: null,
              message: `${violation.path} ${violation.expected}. Cite an identity the compiled buildings or the asset ledger publish, or drop the lineage subject.`,
            });
      }
    }
    // Hold the read-only site context to its one-way direction. A context id
    // colliding with a building's own element, space or boundary is a mass the
    // building would appear to own, which is exactly how external conditions
    // stop being external.
    const environmentContext = graph.production?.environmentContext;
    if (environmentContext !== undefined) {
      const reserved: string[] = [];
      for (const shot of compiled.values())
        for (const environment of shot.builtEnvironments ?? []) {
          for (const element of environment.elements) reserved.push(element.id);
          for (const space of environment.spaces) reserved.push(space.id);
          for (const boundary of environment.boundaries)
            reserved.push(boundary.id);
        }
      const site = validateAutoMovieEnvironmentContext({
        context: environmentContext,
        reserved,
      });
      if (site.success === false)
        for (const violation of site.violations)
          diagnostics.push({
            code: "environment-context-invalid",
            category: "error",
            phase: "compile",
            target: `environment-context:${environmentContext.id}`,
            path: null,
            message: `${violation.path} ${violation.expected}. Correct the declared site context, or rename the building member it collides with, before compiling.`,
          });
    }
    diagnostics.sort(compareDiagnostics);
    const confirmInputSnapshot = (): IAutoMovieBuildProjectOutput | null =>
      confirmAutoMovieBuildInputSnapshot({
        authority: this.project,
        diagnostics,
        inputCurrent,
        inputFingerprint,
        inputRevision,
      });
    if (diagnostics.some((diagnostic) => diagnostic.category === "error"))
      return (
        confirmInputSnapshot() ?? {
          success: false,
          revision: inputRevision,
          builder: {
            version: AUTOMOVIE_PRODUCTION_BUILD_VERSION,
            inputFingerprint,
          },
          diagnostics,
          materialized: [],
        }
      );
    if (input.scope === "design")
      return (
        confirmInputSnapshot() ?? {
          success: true,
          revision: inputRevision,
          builder: {
            version: AUTOMOVIE_PRODUCTION_BUILD_VERSION,
            inputFingerprint,
          },
          diagnostics,
          materialized: [],
        }
      );

    const sourceFiles = files!;
    const sourceManifest = manifest!;
    const materialized = statusesOf(this.project, entries);
    if (materialize === false)
      return (
        confirmInputSnapshot() ?? {
          success: true,
          revision: inputRevision,
          builder: {
            version: AUTOMOVIE_PRODUCTION_BUILD_VERSION,
            inputFingerprint,
          },
          diagnostics,
          materialized: [],
        }
      );
    return publishAutoMovieGeneratedCompilation({
      authority: this.project,
      publication: { files: sourceFiles, manifest: sourceManifest, inputCurrent, inputRevision },
      inputFingerprint,
      diagnostics,
      materialized,
    });
  }

}
