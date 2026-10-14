import { type IAutoMovieMaterializedLibraryResult, materializeAutoMovieLibraryFiles } from "./materializeProduction";
import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import type {
  IAutoMovieBuildProjectInput,
  IAutoMovieBuildProjectOutput,
  IAutoMovieDiagnostic,
  IAutoMovieGeneratedFile,
  IAutoMovieGeneratedManifest,
} from "@automovie/interface";

import type { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { confirmAutoMovieBuildInputSnapshot } from "./confirmAutoMovieBuildInputSnapshot";
import {
  type IAutoMovieFingerprintField,
  compareCodeUnits,
  digestAutoMovieBytes,
} from "./contentIdentity";
import { createAutoMovieLibraryOwnerContexts } from "./createAutoMovieLibraryOwnerContexts";
import { evaluateAutoMovieLibraryOwners } from "./evaluateAutoMovieLibraryOwners";
import { inspectAutoMovieGeneratedOwnership } from "./inspectAutoMovieGeneratedOwnership";
import { inspectAutoMovieLibraryMissingRegistrations } from "./inspectAutoMovieLibraryMissingRegistrations";
import { autoMovieLibraryArtifactSourceTargets } from "./autoMovieLibraryArtifactSourceTargets";
import {
  type IAutoMovieLibraryAuthoringSnapshot,
  captureAutoMovieLibraryAuthoringSnapshot,
  createAutoMovieLibrarySourceExecutionPlan,
  sameAutoMovieLibraryAuthoringSnapshot,
} from "./libraryAuthoringSnapshot";
import { libraryBuildInputFingerprint } from "./libraryBuildInputFingerprint";

import { compareDiagnostics } from "./productionBuildDiagnostics";
import {
  AUTOMOVIE_PRODUCTION_BUILD_PROTOCOL,
  AUTOMOVIE_PRODUCTION_BUILD_VERSION,
} from "./productionBuildProtocol";
import { statusesOf } from "./statusesOf";
import type { buildLibrarySource } from "./buildLibrarySource";
import { productionTextureClosureDiagnostics } from "./productionTextureClosureDiagnostics";
import { publishAutoMovieGeneratedCompilation } from "./publishAutoMovieGeneratedCompilation";
import type { readAutoMovieLibraryDerivedInputs } from "./readAutoMovieLibraryDerivedInputs";

/**
 * Compile one acquired reusable library through source admission, closure validation and guarded confirmation/publication.
 *
 * @evidence contracts/common.md#principled-implementation Fresh authoring/revision and captured source identity precede derived reads, owner contexts/evaluation, missing-registration/texture checks, materialization and generated ownership diagnostics; currentness is reacquired before confirmation or publication through the existing project authority.
 * @evidence contracts/common.md#clear-and-simple-design The builder's library dispatch calls this coordinator; explicit runtime ports supply native evaluator/reader/domain-validator behavior without a second root, state store or publication lock.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Design scope executes no source, errors block publication, and absence or failed fresh evidence returns inputCurrent false. Ordinary Node evaluation is not a sandbox and captured source digests alone do not prove the host executed that exact buffer.
 * @evidence contracts/common.md#meaningful-documentation Defines scope/materialize distinctions, shared authoring identity, currentness closure and returned diagnostics/status; materialization status is intended comparison, not a write-success receipt.
 * @evidence contracts/performance.md#efficient-algorithms Includes complete snapshot/derivation reads and hashing, arbitrary source evaluation, every domain/closure check, all generated serialization/hash/sorting and ownership scan, plus currentness reacquisition and the authority's commit work.
 * @evidence contracts/performance.md#reuse-equivalent-work One attempt shares snapshot, contexts, registration identities and materialized bytes; confirmation/publication reuse its acquired result only after fresh matching inputs rather than caching mutable compilation across attempts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Complete source/derived/contribution/generated populations and currentness closure coexist through the synchronous attempt without a byte cap; result ownership transfers and readers/transaction authority own native cleanup, while authored Node effects remain host-owned.
 */
export const compileAutoMovieLibrary: (props: {
  /** Namespace, input reader and existing guarded publication authority. */
  project: Pick<
    AutoMovieProductionProject,
    | "root"
    | "productionId"
    | "revision"
    | "readSource"
    | "commitGenerated"
    | "confirmCurrentSnapshot"
    | "generatedManifest"
    | "generatedRoot"
    | "trackedStatePath"
    | "readGeneratedFile"
  >;

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
    readDerived: (
      enabled: boolean,
    ) => ReturnType<typeof readAutoMovieLibraryDerivedInputs>;

    /** Ordinary source evaluator returning shape-checked admitted owners. */
    evaluateSource: typeof buildLibrarySource;

    /** Complete physical generated population, including unsafe entries. */
    listGenerated: (root: string) => string[];

    /** Same domain validators used by the native builder. */
    validators: Parameters<
      typeof evaluateAutoMovieLibraryOwners
    >[0]["validators"];
  };
}) => IAutoMovieBuildProjectOutput = (props: {
  /** Namespace, input reader and existing guarded publication authority. */
  project: Pick<
    AutoMovieProductionProject,
    | "root"
    | "productionId"
    | "revision"
    | "readSource"
    | "commitGenerated"
    | "confirmCurrentSnapshot"
    | "generatedManifest"
    | "generatedRoot"
    | "trackedStatePath"
    | "readGeneratedFile"
  >;

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
    readDerived: (
      enabled: boolean,
    ) => ReturnType<typeof readAutoMovieLibraryDerivedInputs>;

    /** Ordinary source evaluator returning shape-checked admitted owners. */
    evaluateSource: typeof buildLibrarySource;

    /** Complete physical generated population, including unsafe entries. */
    listGenerated: (root: string) => string[];

    /** Same domain validators used by the native builder. */
    validators: Parameters<
      typeof evaluateAutoMovieLibraryOwners
    >[0]["validators"];
  };
}): IAutoMovieBuildProjectOutput => {
  const fingerprint: (snapshot: IAutoMovieLibraryAuthoringSnapshot, derivedFields: readonly IAutoMovieFingerprintField[]) => string = (
    snapshot: IAutoMovieLibraryAuthoringSnapshot,
    derivedFields: readonly IAutoMovieFingerprintField[],
  ): string =>
    libraryBuildInputFingerprint({
      production: props.project.productionId,
      snapshot,
      derivedFields,
    });
  // The dispatcher selects this path from the evidence it already holds, so
  // the only question left is whether a fresher reading is available.
  const authoring: IAutoMovieProductionEvidence =
    props.currentAuthoringEvidence === undefined
      ? props.authoringEvidence
      : props.currentAuthoringEvidence();
  const inputRevision: ReturnType<AutoMovieProductionProject["revision"]> = props.project.revision();
  const snapshot: IAutoMovieLibraryAuthoringSnapshot = captureAutoMovieLibraryAuthoringSnapshot({
    root: props.project.root,
    evidence: authoring,
    readSource: (source: string): Uint8Array => props.project.readSource(source),
  });
  const snapshotAuthoring: IAutoMovieProductionEvidence = {
    ...authoring,
    configuration: snapshot.configuration,
    manifest: snapshot.manifest,
    designBranches: snapshot.designBranches,
    designOwners: snapshot.designOwners,
    sourceOwners: snapshot.sourceOwners,
  };
  const requireReviewed: boolean =
    props.input.scope === "review" || props.input.scope === "final";
  const execution: ReturnType<typeof createAutoMovieLibrarySourceExecutionPlan> = createAutoMovieLibrarySourceExecutionPlan(
    snapshot,
    requireReviewed,
  );
  const sources: string[] = snapshot.sources.map((source: IAutoMovieLibraryAuthoringSnapshot["sources"][number]): string => source.path);
  const derived: ReturnType<typeof props.runtime.readDerived> = props.runtime.readDerived(props.input.scope !== "design");
  const inputFingerprint: string = fingerprint(snapshot, derived.fields);
  const diagnostics: IAutoMovieDiagnostic[] = [...derived.diagnostics];
  if (props.input.scope !== "design")
    diagnostics.push(
      ...execution.problems.map(
        (message: string): IAutoMovieDiagnostic => ({
          code: "source-owner-mismatch",
          category: "error",
          phase: "source",
          target: "library-source-owners",
          path: null,
          message,
        }),
      ),
    );

  const { contexts: units, sourceBranches: sourceBranchByDesign }: ReturnType<typeof createAutoMovieLibraryOwnerContexts> =
    createAutoMovieLibraryOwnerContexts({
      production: props.project.productionId,
      owners: snapshotAuthoring.designOwners,
      execution,
      derivedArtifacts: derived.artifacts,
    });
  const evaluated: ReturnType<typeof evaluateAutoMovieLibraryOwners> = evaluateAutoMovieLibraryOwners({
    root: props.project.root,
    sources:
      props.input.scope !== "design" &&
      derived.diagnostics.every((item: IAutoMovieDiagnostic): boolean => item.category !== "error")
        ? sources
        : [],
    bindings: snapshotAuthoring.sourceOwners,
    contexts: units,
    sourceBranches: sourceBranchByDesign,
    requireReviewed,
    readSource: (source: string): Uint8Array => props.project.readSource(source),
    evaluate: props.runtime.evaluateSource,
    validators: props.runtime.validators,
  });
  const { results, registeredBy }: ReturnType<typeof evaluateAutoMovieLibraryOwners> = evaluated;
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
        models: results.flatMap((result: IAutoMovieMaterializedLibraryResult): IAutoMovieMaterializedLibraryResult["contribution"]["models"] => result.contribution.models),
        environments: results.flatMap(
          (result: IAutoMovieMaterializedLibraryResult): IAutoMovieMaterializedLibraryResult["contribution"]["environments"] => result.contribution.environments,
        ),
        scenes: [],
        assets: derived.assets,
        content: derived.content,
      }),
    );

  const publication: ReturnType<typeof materializeAutoMovieLibraryFiles> | null =
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
          .map(([file, bytes]: [string, Uint8Array]): IAutoMovieGeneratedFile => ({
            path: file,
            owner: "builder" as const,
            digest: digestAutoMovieBytes(bytes),
            sourceTargets: autoMovieLibraryArtifactSourceTargets(
              file,
              publication.index,
            ),
          }))
          .sort((left: IAutoMovieGeneratedFile, right: IAutoMovieGeneratedFile): number => compareCodeUnits(left.path, right.path));
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

  const inputCurrent: () => boolean = (): boolean => {
    if (props.currentAuthoringEvidence === undefined) return false;
    try {
      return (
        sameAutoMovieLibraryAuthoringSnapshot(
          snapshot,
          captureAutoMovieLibraryAuthoringSnapshot({
            root: props.project.root,
            evidence: props.currentAuthoringEvidence(),
            readSource: (source: string): Uint8Array => props.project.readSource(source),
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
  const builder: IAutoMovieBuildProjectOutput["builder"] = {
    version: AUTOMOVIE_PRODUCTION_BUILD_VERSION,
    inputFingerprint,
  };
  const confirmInputSnapshot: () => IAutoMovieBuildProjectOutput | null = (): IAutoMovieBuildProjectOutput | null =>
    confirmAutoMovieBuildInputSnapshot({
      authority: props.project,
      diagnostics,
      inputCurrent,
      inputFingerprint,
      inputRevision,
    });
  const failed: boolean = diagnostics.some(
    (diagnostic: IAutoMovieDiagnostic): boolean => diagnostic.category === "error",
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
  const materializedFiles: ReturnType<typeof statusesOf> = statusesOf(props.project, entries);
  return publishAutoMovieGeneratedCompilation({
    authority: props.project,
    publication: {
      files: publication!.files,
      manifest: manifest!,
      inputCurrent,
      inputRevision,
    },
    inputFingerprint,
    diagnostics,
    materialized: materializedFiles,
  });
};
