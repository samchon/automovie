import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import type { IAutoMovieBuildProjectInput, IAutoMovieBuildProjectOutput, IAutoMovieDiagnostic, IAutoMovieGeneratedFile, IAutoMovieGeneratedManifest } from "@automovie/interface";

import type { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { type IAutoMovieFingerprintField, compareCodeUnits, digestAutoMovieBytes } from "./contentIdentity";
import { confirmAutoMovieBuildInputSnapshot } from "./confirmAutoMovieBuildInputSnapshot";
import { createAutoMovieLibraryOwnerContexts } from "./createAutoMovieLibraryOwnerContexts";
import { evaluateAutoMovieLibraryOwners } from "./evaluateAutoMovieLibraryOwners";
import { inspectAutoMovieGeneratedOwnership } from "./inspectAutoMovieGeneratedOwnership";
import { inspectAutoMovieLibraryMissingRegistrations } from "./inspectAutoMovieLibraryMissingRegistrations";
import { autoMovieLibraryArtifactSourceTargets } from "./libraryArtifactTargets";
import { type IAutoMovieLibraryAuthoringSnapshot, captureAutoMovieLibraryAuthoringSnapshot, createAutoMovieLibrarySourceExecutionPlan, sameAutoMovieLibraryAuthoringSnapshot } from "./libraryAuthoringSnapshot";
import { libraryBuildInputFingerprint } from "./libraryBuildInputFingerprint";
import { materializeAutoMovieLibraryFiles } from "./materializeProduction";
import { compareDiagnostics } from "./productionBuildDiagnostics";
import { AUTOMOVIE_PRODUCTION_BUILD_PROTOCOL, AUTOMOVIE_PRODUCTION_BUILD_VERSION } from "./productionBuildProtocol";
import { statusesOf } from "./productionBuildStatus";
import type { buildLibrarySource } from "./productionSourceBuild";
import { productionTextureClosureDiagnostics } from "./productionTextureClosure";
import { publishAutoMovieGeneratedCompilation } from "./publishAutoMovieGeneratedCompilation";
import type { readAutoMovieLibraryDerivedInputs } from "./readAutoMovieLibraryDerivedInputs";

/**
 * Compile one acquired reusable library through explicit execution stages.
 *
 * The builder composes its native reader, evaluator and engine validators here.
 * This pipeline owns acquisition order, exact owner evaluation, closure and
 * ownership diagnostics, then read-only confirmation or complete publication.
 * Its project port is the existing shared transaction authority; runtime inputs
 * describe that same attempt's verified content and complete generated listing.
 * Neither supplies a second state store, root authority or publication lock.
 *
 * Design scope acquires authoring identity without executing source or reading
 * content. Source work reports incomplete realization as warnings; review and
 * final gates require every selected owner. All results use the same acquired
 * source/content identity, and publication reacquires it through the live reader
 * before the authority can commit. Without that reader the guard refuses.
 *
 * @evidence requirements/agent-authoring/partial-work.md#agent-atomic-compilation Confirms or publishes the complete library attempt with its exact acquired revision and reacquired source/content guard.
 * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-atomic-invariant Keeps library scope, diagnostics and publication tied to one acquired input closure without introducing film obligations.
 */
export const compileAutoMovieLibrary = (props: {
  /** Namespace, input reader and existing guarded publication authority. */
  project: Pick<AutoMovieProductionProject,
    "root" | "productionId" | "revision" | "readSource" | "commitGenerated" |
    "confirmCurrentSnapshot" | "generatedManifest" | "generatedRoot" |
    "trackedStatePath" | "readGeneratedFile">;

  /** Highest requested gate, without a timed production's screenplay rules. */
  input: IAutoMovieBuildProjectInput;

  /** Whether a passed source result may publish compiler-owned bytes. */
  materialize: boolean;

  /** Declaration that selected the library dispatch path. */
  authoringEvidence: IAutoMovieProductionEvidence;

  /** Fresh reader paired with the same root and compile declaration. */
  currentAuthoringEvidence?: () => IAutoMovieProductionEvidence;

  /** Actual host operations that observe and execute this project. */
  runtime: {
    /** Verified derivation closure; disabled design reads must touch nothing. */
    readDerived: (enabled: boolean) => ReturnType<typeof readAutoMovieLibraryDerivedInputs>;

    /** Ordinary source evaluator returning shape-checked admitted owners. */
    evaluateSource: typeof buildLibrarySource;

    /** Complete physical generated population, including unsafe entries. */
    listGenerated: (root: string) => string[];

    /** Same domain validators used by the native builder. */
    validators: Parameters<typeof evaluateAutoMovieLibraryOwners>[0]["validators"];
  };
}): IAutoMovieBuildProjectOutput => {
  const fingerprint = (snapshot: IAutoMovieLibraryAuthoringSnapshot, derivedFields: readonly IAutoMovieFingerprintField[]) =>
    libraryBuildInputFingerprint({ production: props.project.productionId, snapshot, derivedFields });
    // The dispatcher selects this path from the evidence it already holds, so
    // the only question left is whether a fresher reading is available.
    const authoring =
      props.currentAuthoringEvidence === undefined
        ? props.authoringEvidence
        : props.currentAuthoringEvidence();
    const inputRevision = props.project.revision();
    const snapshot = captureAutoMovieLibraryAuthoringSnapshot({
      root: props.project.root,
      evidence: authoring,
      readSource: (source) => props.project.readSource(source),
    });
    const snapshotAuthoring: IAutoMovieProductionEvidence = {
      ...authoring,
      configuration: snapshot.configuration,
      manifest: snapshot.manifest,
      designBranches: snapshot.designBranches,
      designOwners: snapshot.designOwners,
      sourceOwners: snapshot.sourceOwners,
    };
    const requireReviewed = props.input.scope === "review" || props.input.scope === "final";
    const execution = createAutoMovieLibrarySourceExecutionPlan(
      snapshot,
      requireReviewed,
    );
    const sources = snapshot.sources.map((source) => source.path);
    const derived = props.runtime.readDerived(props.input.scope !== "design");
    const inputFingerprint = fingerprint(
      snapshot,
      derived.fields,
    );
    const diagnostics: IAutoMovieDiagnostic[] = [...derived.diagnostics];
    if (props.input.scope !== "design")
      diagnostics.push(
        ...execution.problems.map(
          (message): IAutoMovieDiagnostic => ({
            code: "source-owner-mismatch",
            category: "error",
            phase: "source",
            target: "library-source-owners",
            path: null,
            message,
          }),
        ),
      );

    const { contexts: units, sourceBranches: sourceBranchByDesign } =
      createAutoMovieLibraryOwnerContexts({
        production: props.project.productionId,
        owners: snapshotAuthoring.designOwners,
        execution,
        derivedArtifacts: derived.artifacts,
      });
    const evaluated = evaluateAutoMovieLibraryOwners({
      root: props.project.root,
      sources:
        props.input.scope !== "design" &&
        derived.diagnostics.every((item) => item.category !== "error")
          ? sources
          : [],
      bindings: snapshotAuthoring.sourceOwners,
      contexts: units,
      sourceBranches: sourceBranchByDesign,
      requireReviewed,
      readSource: (source) => props.project.readSource(source),
      evaluate: props.runtime.evaluateSource,
      validators: props.runtime.validators,
    });
    const { results, registeredBy } = evaluated;
    diagnostics.push(...evaluated.diagnostics);
    if (props.input.scope !== "design")
      diagnostics.push(
        ...inspectAutoMovieLibraryMissingRegistrations({
          owners: snapshotAuthoring.designOwners,
          execution,
          registeredBy,
          requireReviewed,
        }),
      );
    if (props.input.scope !== "design")
      diagnostics.push(
        ...productionTextureClosureDiagnostics({
          production: props.project.productionId,
          models: results.flatMap((result) => result.contribution.models),
          environments: results.flatMap(
            (result) => result.contribution.environments,
          ),
          scenes: [],
          assets: derived.assets,
          content: derived.content,
        }),
      );

    const publication =
      props.input.scope === "design"
        ? null
        : materializeAutoMovieLibraryFiles({
            production: props.project.productionId,
            builder: AUTOMOVIE_PRODUCTION_BUILD_PROTOCOL,
            inputFingerprint,
            results,
          });
    const entries: IAutoMovieGeneratedFile[] =
      publication === null
        ? []
        : [...publication.files]
            .map(([file, bytes]) => ({
              path: file,
              owner: "builder" as const,
              digest: digestAutoMovieBytes(bytes),
              sourceTargets: autoMovieLibraryArtifactSourceTargets(
                file,
                publication.index,
              ),
            }))
            .sort((left, right) => compareCodeUnits(left.path, right.path));
    const manifest: IAutoMovieGeneratedManifest | null =
      publication === null
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
          project: props.project,
          expected: manifest,
          repairDeclaredFiles: props.materialize,
          listFiles: props.runtime.listGenerated,
        }),
      );

    diagnostics.sort(compareDiagnostics);

    const inputCurrent = (): boolean => {
      if (props.currentAuthoringEvidence === undefined) return false;
      try {
        return (
          sameAutoMovieLibraryAuthoringSnapshot(
            snapshot,
            captureAutoMovieLibraryAuthoringSnapshot({
              root: props.project.root,
              evidence: props.currentAuthoringEvidence(),
              readSource: (source) => props.project.readSource(source),
            }),
          ) &&
          fingerprint(
            snapshot,
            props.runtime.readDerived(props.input.scope !== "design").fields,
          ) === inputFingerprint
        );
      } catch {
        return false;
      }
    };
    const builder = {
      version: AUTOMOVIE_PRODUCTION_BUILD_VERSION,
      inputFingerprint,
    };
    const confirmInputSnapshot = (): IAutoMovieBuildProjectOutput | null =>
      confirmAutoMovieBuildInputSnapshot({
        authority: props.project,
        diagnostics,
        inputCurrent,
        inputFingerprint,
        inputRevision,
      });
    const failed = diagnostics.some(
      (diagnostic) => diagnostic.category === "error",
    );
    if (failed || props.input.scope === "design" || props.materialize === false)
      return (
        confirmInputSnapshot() ?? {
          success: failed === false,
          revision: inputRevision,
          builder,
          diagnostics,
          materialized: [],
        }
      );
    const materializedFiles = statusesOf(props.project, entries);
    return publishAutoMovieGeneratedCompilation({
      authority: props.project,
      publication: { files: publication!.files, manifest: manifest!, inputCurrent, inputRevision },
      inputFingerprint,
      diagnostics,
      materialized: materializedFiles,
    });

};
