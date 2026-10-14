import { realizeShotContract, type materializeCompiledFormationInventory, type materializeCompiledInstanceSetInventory } from "@automovie/engine";
import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import type { IAutoMovieBeatEndState, IAutoMovieBuildProjectInput, IAutoMovieCompiledContractRealization, IAutoMovieCompiledShotSource, IAutoMovieDiagnostic, IAutoMovieFilmBuildContext, IAutoMovieFilmEdit } from "@automovie/interface";
import type { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import type { IAutoMovieProductionSourceGateTrace } from "./IAutoMovieProductionSourceGateTrace";
import { digestAutoMovieBytes } from "./contentIdentity";
import { materializeCompiledShot } from "./materializeProduction";
import type { IProductionExternalMotionAdoption } from "./IProductionExternalMotionAdoption";
import type { IProductionExternalMotionConversionDraft } from "./IProductionExternalMotionConversionDraft";
import { type ICompiledVideoClosing, assembleShotSource, fullHardCutBoundary, shotAssemblyOrder, shotSourceOwnerTarget } from "./productionShotAssembly";
import { validateCompiledShot } from "./productionShotValidation";
import type { ISourceBuildResult } from "./ISourceBuildResult";
import { recordAutoMovieProductionClearanceRevision } from "./recordAutoMovieProductionClearanceRevision";
import { attributeAutoMovieCompiledShotSource } from "./attributeAutoMovieCompiledShotSource";
import { resolveAutoMovieSourceOwnerBinding } from "./resolveAutoMovieSourceOwnerBinding";
import { storySyncDiagnostics } from "./storySyncDiagnostics";
import type { IAutoMovieProductionDesignGraph } from "./validateProductionDesign";

/**
 * Compile admitted shot sources in edit order and collect their realizations.
 *
 * A preceding closing pose crosses only a full hard-cut boundary. Source owner
 * bindings and per-shot validation remain explicit, and cross-shot story sync
 * runs after every realization is available, before film assembly.
 *
 * @evidence contracts/common.md#principled-implementation Ordered shot assembly preserves hard-cut continuity while trims or transitions break that inheritance; admitted runtime inventory feeds materialization and engine realization, whose findings determine whether a closing pose may pass forward.
 * @evidence contracts/common.md#clear-and-simple-design One shot-compilation phase fills compiled outputs, external-motion receipts and realizations, leaving source observation, film assembly and final publication to their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Owner mismatch skips the refused source instead of relabeling it, invalid post-validation cannot supply a closing pose, and cross-shot claims use actual realizations rather than edit-time guesses.
 * @evidence contracts/common.md#meaningful-documentation States edit-order continuity, the hard-cut condition, source-owner admission and story-sync timing.
 * @evidence contracts/performance.md#efficient-algorithms Every ordered source is evaluated, materialized and validated once; geometry, motion and predicates dominate their owners' costs. Recipe/runtime dictionary construction and adoption grouping each scan their populations once. assembleShotSource still clones each context to isolate authored mutation, so its necessary copy cost scales with shots times context size.
 * @evidence contracts/performance.md#reuse-equivalent-work Runtime inventories, recipe dictionaries and per-shot adoption groups are built once for this attempt; assembleShotSource clones them before authored execution. Each source evaluation remains separate because contract, prior pose and side effects differ.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-owned maps retain one compiled shot and realization per admitted shot and one conversion per adoption until publication finishes; this phase acquires no permanent handle or independent task and caches no result across attempts.
 */
export function compileAutoMovieProductionShots(props: {
  project: AutoMovieProductionProject;
  authoringEvidence: IAutoMovieProductionEvidence | undefined;
  input: IAutoMovieBuildProjectInput;
  graph: IAutoMovieProductionDesignGraph;
  screenplay: ReturnType<AutoMovieProductionProject["screenplayIndex"]>;
  inputRevision: number;
  designReady: boolean;
  derivedArtifactsReady: boolean;
  derivedArtifacts: IAutoMovieFilmBuildContext["derivedArtifacts"];
  filmEditSource: ISourceBuildResult<IAutoMovieFilmEdit> | null;
  shotSources: ReadonlyMap<string, Uint8Array>;
  runtimeModels: ReadonlyMap<string, IAutoMovieCompiledShotSource["models"][number]>;
  formationRuntime: ReturnType<typeof materializeCompiledFormationInventory>;
  instanceSetRuntime: ReturnType<typeof materializeCompiledInstanceSetInventory>;
  externalMotions: ReadonlyMap<string, IProductionExternalMotionAdoption>;
  projectionRadii: ReadonlyMap<string, number>;
  trace: IAutoMovieProductionSourceGateTrace | undefined;
  diagnostics: IAutoMovieDiagnostic[];
  compiled: Map<string, IAutoMovieCompiledShotSource>;
  externalMotionConversions: Map<string, IProductionExternalMotionConversionDraft>;
  realizations: Map<string, IAutoMovieCompiledContractRealization>;
}): void {
  const { project, authoringEvidence, input, graph, screenplay, inputRevision, designReady, derivedArtifactsReady, derivedArtifacts, filmEditSource, shotSources, runtimeModels, formationRuntime, instanceSetRuntime, externalMotions, projectionRadii, trace, diagnostics, compiled, externalMotionConversions, realizations }: typeof props = props;
    if (input.scope !== "design" && designReady && derivedArtifactsReady) {
      const models: Parameters<typeof assembleShotSource>[0]["context"]["models"] = Object.fromEntries(graph.models);
      const formations: Parameters<typeof assembleShotSource>[0]["context"]["formations"] = Object.fromEntries(graph.formations);
      const runtimeModelRecord: Parameters<typeof assembleShotSource>[0]["context"]["runtimeModels"] = Object.fromEntries(runtimeModels);
      const motionsByShot: Map<string, IProductionExternalMotionAdoption[]> = new Map();
      for (const adoption of externalMotions.values()) {
        const adopted: IProductionExternalMotionAdoption[] = motionsByShot.get(adoption.declaration.shot) ?? [];
        adopted.push(adoption);
        motionsByShot.set(adoption.declaration.shot, adopted);
      }
      let previousVideo: ICompiledVideoClosing | null = null;
      for (const entry of shotAssemblyOrder(
        graph.shots,
        filmEditSource?.value ?? null,
      )) {
        const normalized: Uint8Array | undefined = shotSources.get(entry.id);
        let closing: IAutoMovieBeatEndState | null = null;
        if (normalized !== undefined) {
          const requireReviewed: boolean =
            input.scope === "review" || input.scope === "final";
          const owner: ReturnType<typeof resolveAutoMovieSourceOwnerBinding> | null =
            authoringEvidence !== undefined || requireReviewed
              ? resolveAutoMovieSourceOwnerBinding({
                  bindings: authoringEvidence?.sourceOwners,
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
          const previous: IAutoMovieBeatEndState | null =
            previousVideo !== null &&
            entry.placement !== null &&
            fullHardCutBoundary(
              previousVideo,
              entry,
              graph.production!.frameFormat.fps,
            )
              ? previousVideo.closing
              : null;
          const result: ReturnType<typeof assembleShotSource> = assembleShotSource({
            id: entry.id,
            path: entry.contract.source.module,
            exportName: entry.contract.source.export,
            source: Buffer.from(normalized).toString("utf8"),
            sourceRoot: project.root,
            context: {
              contract: entry.contract,
              models,
              derivedArtifacts,
              // Undefined when the production declares no lighting, so the
              // frozen context a source reads is unchanged for every production
              // that says nothing about light.
              lighting: graph.production!.lighting,
              world: graph.world!,
              formations,
              runtimeModels: runtimeModelRecord,
              formationRuntime,
              instanceSetRuntime,
              externalMotions: motionsByShot.get(entry.id) ?? [],
              frameFormat: graph.production!.frameFormat,
            },
            previous,
            cameraClearance: recordAutoMovieProductionClearanceRevision({
              trace,
              runtime: {
                revision: String(inputRevision),
                currentRevision: String(project.revision()),
                sampleRate: graph.production!.frameFormat.fps,
              },
            }),
          });
          diagnostics.push(...result.diagnostics);
          if (result.value !== null) {
            const materialized: ReturnType<typeof materializeCompiledShot> = materializeCompiledShot({
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
            const realized: ReturnType<typeof realizeShotContract> = realizeShotContract({
              contract: entry.contract,
              production: graph.production,
              world: graph.world,
              formations: graph.formations,
              compiled: materialized.value,
              collisions: materialized.collisions,
            });
            const postDiagnostics: IAutoMovieDiagnostic[] = [
              ...validateCompiledShot(entry.contract, materialized.value),
              ...realized.diagnostics,
            ];
            diagnostics.push(...postDiagnostics);
            compiled.set(
              entry.id,
              attributeAutoMovieCompiledShotSource({
                value: materialized.value,
                bindings: authoringEvidence?.sourceOwners ?? [],
                entry: owner?.success === true ? owner.binding : null,
              }),
            );
            for (const conversion of result.conversions)
              externalMotionConversions.set(conversion.adoption, conversion);
            realizations.set(entry.id, realized.realization);
            if (
              postDiagnostics.every(
                (diagnostic: IAutoMovieDiagnostic): boolean => diagnostic.category !== "error",
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


}
