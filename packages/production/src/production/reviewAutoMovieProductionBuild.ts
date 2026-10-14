import { validateAutoMovieEnvironmentContext, validateDesignLineageBinding } from "@automovie/engine";
import type { IAutoMovieAssetProvenance, IAutoMovieBuildProjectInput, IAutoMovieCompiledContractRealization, IAutoMovieCompiledShotSource, IAutoMovieDesignEvidence, IAutoMovieDiagnostic, IAutoMovieGeneratedManifest, IAutoMovieModel, IAutoMovieRenderBundleManifest } from "@automovie/interface";
import type { IAutoMovieProductionRenderJobPlan } from "@automovie/render";
import typia from "typia";
import type { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import type { IAutoMovieProductionContentInput } from "./IAutoMovieProductionContentInput";
import { encodeAutoMoviePathSegment } from "./contentIdentity";
import { designReferenceDiagnostics } from "./designReferenceDiagnostics";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import { finalDeliverableDiagnostics } from "./productionDeliveryValidation";
import { productionDesignDocumentDiagnostics } from "./productionDesignDocumentDiagnostics";
import { screenplayCoverageDiagnostics, screenplayResidencyDiagnostics } from "./productionScreenplayValidation";
import { productionTextureClosureDiagnostics } from "./productionTextureClosureDiagnostics";
import type { recordAutoMovieProductionDocumentRead } from "./recordAutoMovieProductionDocumentRead";
import { productionRenderTargetFingerprint } from "./renderIdentity";
import { assetReviewEvidenceDiagnostics, consumedModelIds, reviewEvidenceDiagnostics } from "./reviewEvidenceDiagnostics";
import { screenplayLedgerDiagnostics } from "./screenplayLedgerDiagnostics";
import { screenplayProseDiagnostics } from "./screenplayProseDiagnostics";
import type { resolveAutoMovieTimedAuthoringKind } from "./resolveAutoMovieTimedAuthoringKind";
import type { IAutoMovieProductionDesignGraph } from "./validateProductionDesign";

/**
 * Collect production-wide prose, pixel, asset and published-identity findings.
 *
 * Shared design documents are merged before citation and lineage binding; only
 * review/final scopes inspect captured views, and only final scope verifies
 * deliverables. This phase does not publish or repair generated output.
 *
 * @evidence contracts/common.md#principled-implementation Each scope applies its declared proof obligations over actual compiled shots, current content and captured identities; cross-shot documents use canonical-content identity before reference and lineage admission so a stable id cannot silently replace its meaning.
 * @evidence contracts/common.md#clear-and-simple-design One post-compilation phase owns production-wide gates, while each prose, texture, design and delivery validator owns its domain and the builder retains transaction/publication decisions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing content cannot fabricate a render fingerprint, rig reads do not invent geometry, and conflicting document ids become refusals instead of last-writer selection. Rig-read failure remains secondary to the registry's owning refusal.
 * @evidence contracts/common.md#meaningful-documentation States scope-sensitive proof requirements, document merge timing and the absence of publication or repair effects.
 * @evidence contracts/performance.md#efficient-algorithms Work follows compiled shot/model/environment populations plus declared prose and captured-view inventories; reference containers are parsed per merged document and texture closure checks the actual consumers. This coordinator additionally flattens those inventories and builds published-id sets; underlying geometry, media parsing and file-read costs stay included in their domain gates.
 * @evidence contracts/performance.md#reuse-equivalent-work Identical cross-shot design documents share one binding input per attempt and published ids are indexed once for lineage binding. Current render identities and host bytes are reread by their owning gates rather than cached across builds.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary flattened arrays, document maps and identity sets live only for this call; the caller owns appended diagnostics and compiled data. File readers and media inspectors own their handles, and the phase starts no independent task.
 */
export function reviewAutoMovieProductionBuild(props: {
  project: AutoMovieProductionProject;
  input: IAutoMovieBuildProjectInput;
  graph: IAutoMovieProductionDesignGraph;
  screenplay: ReturnType<AutoMovieProductionProject["screenplayIndex"]>;
  projectManifest: ReturnType<AutoMovieProductionProject["manifest"]>;
  timedAuthoring: NonNullable<ReturnType<typeof resolveAutoMovieTimedAuthoringKind>>;
  readDocument: ReturnType<typeof recordAutoMovieProductionDocumentRead>;
  diagnostics: IAutoMovieDiagnostic[];
  realizations: Map<string, IAutoMovieCompiledContractRealization>;
  compiled: Map<string, IAutoMovieCompiledShotSource>;
  manifest: IAutoMovieGeneratedManifest | null;
  contentInputs: IAutoMovieProductionContentInput[] | undefined;
  assetRecords: IAutoMovieAssetProvenance[];
  inputFingerprint: string;
  finalRenderPlan: IAutoMovieProductionRenderJobPlan | undefined;
}): void {
  const { project, input, graph, screenplay, projectManifest, timedAuthoring, readDocument, diagnostics, realizations, compiled, manifest, contentInputs, assetRecords, inputFingerprint, finalRenderPlan }: typeof props = props;
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
          designRecordPath: (target: Parameters<AutoMovieProductionProject["designRecordPath"]>[0]): string => project.designRecordPath(target),
        }),
        ...screenplayProseDiagnostics({
          screenplay,
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
    const productionDesign: IAutoMovieProductionDesignGraph["production"] = graph.production;
    if (
      manifest !== null &&
      productionDesign !== null &&
      contentInputs !== undefined &&
      (input.scope === "review" || input.scope === "final")
    ) {
      const fingerprint: (target: IAutoMovieRenderBundleManifest["target"]) => string = (
        target: IAutoMovieRenderBundleManifest["target"],
      ): string =>
        productionRenderTargetFingerprint(
          project,
          manifest,
          target,
          contentInputs,
        );
      const captured: (target: IAutoMovieRenderBundleManifest["target"], digest: string) => ReturnType<AutoMovieProductionProject["capturedRenderViews"]> = (
        target: IAutoMovieRenderBundleManifest["target"],
        digest: string,
      ): ReturnType<AutoMovieProductionProject["capturedRenderViews"]> =>
        project.capturedRenderViews(target, digest);
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
          rigged: (model: string): boolean => compiledModelIsRigged(project, model),
          scope: input.scope,
        }),
      );
    }
    if (input.scope === "final")
      diagnostics.push(
        ...finalDeliverableDiagnostics(
          project,
          graph.production,
          inputFingerprint,
          graph.shots,
          compiled,
          finalRenderPlan,
        ),
      );
    // Both production shapes close image uses over their admitted output.
    if (input.scope !== "design" && compiled.size !== 0)
      diagnostics.push(
        ...productionTextureClosureDiagnostics({
          production: graph.production?.id ?? project.productionId,
          models: [...compiled.values()].flatMap((shot: IAutoMovieCompiledShotSource): IAutoMovieCompiledShotSource["models"] => shot.models),
          environments: [...compiled.values()].flatMap(
            (shot: IAutoMovieCompiledShotSource): NonNullable<IAutoMovieCompiledShotSource["builtEnvironments"]> => shot.builtEnvironments ?? [],
          ),
          scenes: [...compiled.values()].map((shot: IAutoMovieCompiledShotSource): Parameters<typeof productionTextureClosureDiagnostics>[0]["scenes"][number] => ({
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
      const documents: ReturnType<typeof productionDesignDocumentDiagnostics> =
        productionDesignDocumentDiagnostics(compiled.values());
      diagnostics.push(...documents.diagnostics);
      const evidence: IAutoMovieDesignEvidence[] = [];
      const published: Set<string> = new Set();
      for (const shot of compiled.values()) {
        for (const citation of shot.designEvidence ?? [])
          evidence.push(citation);
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
      const production: string = graph.production?.id ?? project.productionId;
      const uses: Map<string, Set<string>> = new Map();
      for (const record of assetRecords)
        for (const use of record.uses) {
          if (use.production !== production) continue;
          published.add(use.consumer.id);
          if (use.consumer.kind !== "design-reference") continue;
          const authorizedDocuments: Set<string> = uses.get(record.path) ?? new Set<string>();
          authorizedDocuments.add(use.consumer.id);
          uses.set(record.path, authorizedDocuments);
        }
      if (documents.references.length !== 0 || evidence.length !== 0 || uses.size !== 0)
        diagnostics.push(
          ...designReferenceDiagnostics({
            path: projectManifest.assetManifest ?? "automovie/assets.json",
            references: documents.references,
            evidence,
            assets: new Map<string, Uint8Array | null>(
              (contentInputs ?? []).map((entry: IAutoMovieProductionContentInput): [string, Uint8Array | null] => [entry.path, entry.bytes]),
            ),
            uses,
          }),
        );
      const known: string[] = [...published];
      for (const lineage of documents.lineages) {
        const bound: ReturnType<typeof validateDesignLineageBinding> = validateDesignLineageBinding({
          lineage,
          known,
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
    const environmentContext: NonNullable<IAutoMovieProductionDesignGraph["production"]>["environmentContext"] = graph.production?.environmentContext;
    if (environmentContext !== undefined) {
      const reserved: string[] = [];
      for (const shot of compiled.values())
        for (const environment of shot.builtEnvironments ?? []) {
          for (const element of environment.elements) reserved.push(element.id);
          for (const space of environment.spaces) reserved.push(space.id);
          for (const boundary of environment.boundaries)
            reserved.push(boundary.id);
        }
      const site: ReturnType<typeof validateAutoMovieEnvironmentContext> = validateAutoMovieEnvironmentContext({
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

}

/** A failed model read is reported by the registry gate, not as a rig claim. */
function compiledModelIsRigged(project: AutoMovieProductionProject, model: string): boolean {
  try {
    const validation: ReturnType<typeof typia.validateEquals<IAutoMovieModel>> = typia.validateEquals<IAutoMovieModel>(
      parseAutoMovieStructuredJson({
        record: "compiled-model",
        bytes: project.readGeneratedFile(`models/${encodeAutoMoviePathSegment(model)}.json`),
      }),
    );
    return validation.success && validation.data.skeleton !== null;
  } catch {
    return false;
  }
}
