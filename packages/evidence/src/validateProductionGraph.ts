import fs from "node:fs";
import path from "node:path";
import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";
import type { AutoMovieEvidenceStage } from "./AutoMovieEvidenceStage";
import type { AutoMoviePopulationScope } from "./AutoMoviePopulationScope";
import type { AutoMovieSourceRealizationBranch } from "./AutoMovieSourceRealizationBranch";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import type { IAutoMovieEvidenceTargetIdentityRegistry } from "./IAutoMovieEvidenceTargetIdentityRegistry";
import { DOCS } from "./DOCS";
import { EVIDENCE_STAGES } from "./EVIDENCE_STAGES";
import { MARKDOWN } from "./MARKDOWN";
import { SOURCES } from "./SOURCES";
import { assertAutoMovieEvidenceSyntax } from "./assertAutoMovieEvidenceSyntax";
import { assertAutoMovieProductionMaintenanceComplete } from "./assertAutoMovieProductionMaintenanceComplete";
import { compareCodeUnits } from "./compareCodeUnits";
import { createAutoMoviePopulationFiles } from "./createAutoMoviePopulationFiles";
import { describeDeclarationValue } from "./describeDeclarationValue";
import { isAutoMovieProductionLanguage } from "./isAutoMovieProductionLanguage";
import { populationFiles } from "./populationFiles";
import { posix } from "./posix";
import { revisionStage } from "./revisionStage";
import { stageOf } from "./stageOf";
import { validateAutoMovieLocalContractClaims } from "./validateAutoMovieLocalContractClaims";
import { validateAutoMovieNaturalnessStages } from "./validateAutoMovieNaturalnessStages";
import { validateAutoMoviePopulationTransition } from "./AutoMoviePopulationTransition";
import { validateAutoMovieProductionStages } from "./validateAutoMovieProductionStages";
import { validateContracts } from "./validateContracts";
import { validateHosts } from "./validateHosts";
import { validateProductionTargets } from "./validateProductionTargets";
import { validateWorkSpecificContracts } from "./validateWorkSpecificContracts";
import { walkAutoMovieProjectPopulationFiles } from "./walkAutoMovieProjectPopulationFiles";
import { walkProjectFiles } from "./walkProjectFiles";

const PRODUCTION_KINDS: readonly unknown[] = [null, "brief", "film", "library"];

function validatePopulationScope(graph: IAutoMovieEvidenceConfigProps): void {
  const scope: unknown = graph.populationScope;
  if (scope === null || typeof scope !== "object" || Array.isArray(scope))
    throw new Error("Production populationScope must be an explicit object.");
  const declaration: Record<string, unknown> = scope as Record<string, unknown>;
  const mode: unknown = declaration.mode;
  if (
    mode !== "complete-production" &&
    mode !== "complete-production-reset" &&
    mode !== "first-pilot"
  )
    throw new Error(
      `Unsupported production population scope ${describeDeclarationValue(mode)}.`,
    );
  const allowed: Set<string> = new Set(
    mode === "first-pilot"
      ? ["mode", "partitionGroup"]
      : mode === "complete-production-reset"
        ? ["mode", "owner", "transition"]
        : ["mode"],
  );
  const unexpected: string[] = Object.keys(declaration).filter(
    (key: string): boolean => !allowed.has(key),
  );
  if (unexpected.length !== 0)
    throw new Error(
      `Production populationScope has unsupported fields: ${unexpected.join(", ")}.`,
    );
  if (mode === "complete-production") return;
  if (mode === "complete-production-reset") {
    if (graph.kind !== "film" && graph.kind !== "library")
      throw new Error(
        "complete-production-reset is available only after a film or library pilot.",
      );
    if (
      typeof declaration.owner !== "string" ||
      declaration.owner.trim() === ""
    )
      throw new Error(
        "A complete-production-reset requires a non-empty owner.",
      );
    if (
      declaration.transition === null ||
      typeof declaration.transition !== "object" ||
      Array.isArray(declaration.transition)
    )
      throw new Error(
        "A complete-production-reset requires a transition receipt object.",
      );
    return;
  }
  if (graph.kind === "film") {
    createAutoMoviePopulationFiles(
      "scripts",
      scope as AutoMoviePopulationScope,
    );
    return;
  }
  if (graph.kind === "library") {
    if (Object.hasOwn(declaration, "partitionGroup"))
      throw new Error(
        "A library pilot cannot invent a partitionGroup selector.",
      );
    return;
  }
  throw new Error("first-pilot is available only for a film or library.");
}

/**
 * Whether a declaration is the shipped scaffold before creation rendered it.
 *
 * The scaffold's tracked `lint.config.ts` is a render template: creation substitutes the selected language and materializes its pack under `docs/language`. Before that, the file still has to evaluate, because the scaffold's own scripts import it and the repository that ships it compiles those scripts in place. The state is recognizable without knowing the placeholder's spelling: no production kind, every branch disabled, no local claim, the default population scope, and no language pack on disk. A declaration that selects anything, or that sits beside a materialized pack, is a production and must name one module.
 */
function isUnrenderedScaffoldDeclaration(graph: IAutoMovieEvidenceConfigProps): boolean {
  return graph.kind === null &&
  graph.populationScope?.mode === "complete-production" &&
  (graph.claims === undefined ||
    (Array.isArray(graph.claims) && graph.claims.length === 0)) &&
  [
    ...(Object.keys(MARKDOWN) as AutoMovieAuthoredDocumentLayer[]),
    ...(Object.keys(SOURCES) as AutoMovieSourceRealizationBranch[]),
  ].every((name: "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments" | AutoMovieSourceRealizationBranch): boolean => graph[name] === "disabled") &&
  revisionStage(graph) === "disabled" &&
  !fs.existsSync(path.join(graph.location, DOCS, "language"));
}

function validateDeclaration(graph: IAutoMovieEvidenceConfigProps): void {
  if (typeof graph.location !== "string" || !path.isAbsolute(graph.location))
    throw new Error(
      `Production evidence location must be an absolute string; received ${describeDeclarationValue(graph.location)}.`,
    );
  if (!fs.existsSync(graph.location))
    throw new Error(
      `Production evidence location does not exist: ${posix(graph.location)}.`,
    );
  const locationEntry: fs.Stats = fs.lstatSync(graph.location);
  if (locationEntry.isSymbolicLink())
    walkAutoMovieProjectPopulationFiles(graph.location, graph.location, ".md");
  if (!locationEntry.isDirectory())
    throw new Error(
      `Production evidence location is not a directory: ${posix(graph.location)}.`,
    );
  const kind: unknown = graph.kind;
  assertAutoMovieProductionMaintenanceComplete(graph.location);
  if (!PRODUCTION_KINDS.includes(kind))
    throw new Error(
      `Unsupported production kind ${describeDeclarationValue(kind)}.`,
    );
  if (
    !isAutoMovieProductionLanguage(graph.language) &&
    !isUnrenderedScaffoldDeclaration(graph)
  )
    throw new Error(
      `Unsupported production language ${describeDeclarationValue(graph.language)}.`,
    );
  validatePopulationScope(graph);
  validateAutoMovieNaturalnessStages(graph.naturalness);
  for (const name of [
    ...(Object.keys(MARKDOWN) as AutoMovieAuthoredDocumentLayer[]),
    ...(Object.keys(SOURCES) as AutoMovieSourceRealizationBranch[]),
  ]) {
    const stage: unknown = graph[name];
    if (!EVIDENCE_STAGES.includes(stage))
      throw new Error(
        `${name} has unsupported evidence stage ${describeDeclarationValue(stage)}.`,
      );
  }
  if (graph.claims !== undefined && !Array.isArray(graph.claims))
    throw new Error(
      "Production evidence claims must be an array when present.",
    );
  validateAutoMovieLocalContractClaims(graph);
}

/** Admit active populations and inactive residue under the generated project's docs and src trees before graph evaluation. */
function validateProjectPopulationBoundary(graph: IAutoMovieEvidenceConfigProps): void {
  walkProjectFiles(graph, path.join(graph.location, DOCS), ".md");
  walkProjectFiles(graph, path.join(graph.location, "src"), ".ts");
}

function validateProductionEvidenceSyntax(graph: IAutoMovieEvidenceConfigProps): void {
  const files: string[] = [
    ...walkProjectFiles(graph, path.join(graph.location, DOCS), ".md"),
    ...walkProjectFiles(graph, path.join(graph.location, "src"), ".ts"),
  ];
  const documents: { path: string; source: string; }[] = files.map((file: string): { path: string; source: string; } => ({
    path: posix(path.relative(graph.location, file)),
    source: fs.readFileSync(file, "utf8"),
  }));
  assertAutoMovieEvidenceSyntax(documents);
}

/** Exact host population whose passed-pilot tags may survive one reset. */
function resetTransitionHosts(graph: IAutoMovieEvidenceConfigProps): readonly { path: string; source: string }[] {
  if (graph.populationScope.mode !== "complete-production-reset") return [];
  let files: readonly string[] = [];
  if (graph.kind === "film")
    files = ["treatments", "scripts", "screenplays"].flatMap((layer: string): string[] =>
      walkProjectFiles(graph, path.join(graph.location, DOCS, layer), ".md"),
    );
  else if (graph.populationScope.transition.kind === "library") {
    const pairs: readonly unknown[] = Array.isArray(
      graph.populationScope.transition.reviewedPairs,
    )
      ? graph.populationScope.transition.reviewedPairs
      : [];
    files = pairs.flatMap((value: unknown): string[] => {
      if (value === null || typeof value !== "object") return [];
      const pair: { design?: string; source?: string; } = value as { design?: string; source?: string };
      if (
        typeof pair.design !== "string" ||
        typeof pair.source !== "string" ||
        !Object.hasOwn(SOURCES, pair.source) ||
        SOURCES[pair.source as AutoMovieSourceRealizationBranch].design !== pair.design
      )
        return [];
      return [
        ...walkProjectFiles(
          graph,
          path.join(graph.location, DOCS, pair.design),
          ".md",
        ),
        ...populationFiles(
          graph,
          SOURCES[pair.source as AutoMovieSourceRealizationBranch].files,
          ".ts",
        ),
      ];
    });
  }
  return [...new Set(files)].sort(compareCodeUnits).map((file: string): { path: string; source: string; } => ({
    path: posix(path.relative(graph.location, file)),
    source: fs.readFileSync(file, "utf8"),
  }));
}

/**
 * Admit declaration shape, physical boundaries, annotation syntax, shared contracts, stages, reset receipt and all host or target relationships in order.
 *
 * @evidence contracts/common.md#principled-implementation Admit declaration shape, physical boundaries, annotation syntax, shared contracts, stages, reset receipt and all host or target relationships in order.
 * @evidence contracts/common.md#clear-and-simple-design One synchronous boundary is reused before graph and manifest publication; syntax checking is independent of authored prose judgment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The unrendered scaffold placeholder is admitted only in its explicit blank state; reset exceptions require the canonical transition owner.
 * @evidence contracts/common.md#meaningful-documentation The first rejection throws and the returned registry contains admitted shared and local target identities.
 * @evidence contracts/performance.md#efficient-algorithms The aggregate cost includes repeated filesystem walks, Markdown parsing and TypeScript AST admission, plus local claim validation.
 * @evidence contracts/performance.md#reuse-equivalent-work A target registry is reused through shared and production target admission; independent factory calls intentionally revalidate current mutable files.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All temporary reads and ASTs are call-local; only the returned identity maps escape and no persistent validation task is retained.
 */
export function validateProductionGraph(graph: IAutoMovieEvidenceConfigProps): IAutoMovieEvidenceTargetIdentityRegistry {
  validateDeclaration(graph);
  validateProjectPopulationBoundary(graph);
  validateProductionEvidenceSyntax(graph);
  const targetIdentities: IAutoMovieEvidenceTargetIdentityRegistry = validateContracts(graph.location, graph.language);
  validateAutoMovieProductionStages(graph);
  if (graph.populationScope.mode === "complete-production-reset") {
    const stages: { [k: string]: AutoMovieEvidenceStage; } = Object.fromEntries(
      [
        ...(Object.keys(MARKDOWN) as AutoMovieAuthoredDocumentLayer[]),
        "screenplayNaturalness" as const,
        ...(Object.keys(SOURCES) as AutoMovieSourceRealizationBranch[]),
      ].map((branch: "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments" | "screenplayNaturalness" | AutoMovieSourceRealizationBranch): ["briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments" | "screenplayNaturalness" | AutoMovieSourceRealizationBranch, AutoMovieEvidenceStage] => [branch, stageOf(graph, branch)]),
    );
    validateAutoMoviePopulationTransition({
      kind: graph.kind as "film" | "library",
      productionLocation: graph.location,
      owner: graph.populationScope.owner,
      receipt: graph.populationScope.transition,
      stages,
      hosts: resetTransitionHosts(graph),
    });
  }
  validateHosts(graph);
  validateWorkSpecificContracts(graph);
  validateProductionTargets(graph, targetIdentities);
  return targetIdentities;
}
