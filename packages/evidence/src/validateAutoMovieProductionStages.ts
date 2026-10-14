import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";
import type { AutoMovieDesignDocumentLayer } from "./AutoMovieDesignDocumentLayer";
import type { AutoMovieEvidenceStage } from "./AutoMovieEvidenceStage";
import type { AutoMovieSourceRealizationBranch } from "./AutoMovieSourceRealizationBranch";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import { DESIGN_FOUNDATIONS } from "./DESIGN_FOUNDATIONS";
import { MARKDOWN } from "./MARKDOWN";
import { SOURCES } from "./SOURCES";
import { isActive } from "./isActive";
import { requiresEvidence } from "./requiresEvidence";
import { revisionStage } from "./revisionStage";

/**
 * Refuse an active child whose parent does not declare evidence or review stage.
 *
 * This function compares declared stages only. Evidence and review enable the parent at this boundary; physical populations and actual acknowledgment coverage are checked by separate graph and native gates.
 */
function requireCompletedParent(childName: string, child: AutoMovieEvidenceStage, parentName: string, parent: AutoMovieEvidenceStage): void {
  if (isActive(child) && !requiresEvidence(parent))
    throw new Error(
      `${childName} cannot enter ${child} before ${parentName} reaches evidence.`,
    );
}

/**
 * Refuse evidence/review stage over an active foundation that still declares draft.
 *
 * Foundation references are selected only for evidence/review parents, so this stage rule prevents declaring a dependent layer complete while its draft foundation would contribute no target units. It compares declarations without evaluating physical files or acknowledgment coverage.
 *
 * DESIGN_FOUNDATIONS contains mutual dependencies, including motions and systems. Both may declare draft before simultaneous promotion; a parent-before-draft requirement would prevent either from starting.
 *
 * Disabled foundations are skipped, preserving the library's selected design branches instead of requiring an unrelated map owner.
 */
function requireCompletedFoundations(graph: IAutoMovieEvidenceConfigProps): void {
  for (const [name, foundations] of Object.entries(DESIGN_FOUNDATIONS) as [
    AutoMovieAuthoredDocumentLayer,
    readonly AutoMovieDesignDocumentLayer[],
  ][]) {
    if (!requiresEvidence(graph[name])) continue;
    for (const design of foundations)
      if (isActive(graph[design]) && !requiresEvidence(graph[design]))
        throw new Error(
          `${name} cannot enter ${graph[name]} before ${design} reaches evidence. An active foundation contributes no units until it reaches evidence, so completing ${name} first pays nothing for ${design}. Promote both in one declaration when they depend on each other.`,
        );
  }
}

/**
 * Checks the production declaration's parent-before-child stage transitions.
 *
 * This decision reads no files. The graph factory separately admits physical populations, contracts, and reset predecessor identities before publication.
 *
 * @evidence contracts/common.md#principled-implementation Validate production-kind exclusions and parent completion, with explicit simultaneous reset and mutual foundation rules.
 * @evidence contracts/common.md#clear-and-simple-design This pure gate owns lifecycle dependencies while physical files, receipts and acknowledgment coverage are admitted elsewhere.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Film and library resets are supported scope transitions; no missing-host or incomplete-foundation fallback fabricates completion.
 * @evidence contracts/common.md#meaningful-documentation Evidence and review count as complete, and motions or systems may draft together before simultaneous promotion.
 * @evidence contracts/performance.md#efficient-algorithms The fixed stage, source and foundation matrices bound branch work independently of file or claim counts.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared foundation and source metadata are reused throughout one pass; there is no retained stage cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary stage arrays are call-local and no filesystem resources or transition jobs are acquired.
 */
export function validateAutoMovieProductionStages(graph: IAutoMovieEvidenceConfigProps): void {
  const stages: AutoMovieEvidenceStage[] = [
    ...Object.keys(MARKDOWN).map((name: string): AutoMovieEvidenceStage => graph[name as AutoMovieAuthoredDocumentLayer]),
    revisionStage(graph),
    ...Object.keys(SOURCES).map((name: string): AutoMovieEvidenceStage => graph[name as AutoMovieSourceRealizationBranch]),
  ];
  if (graph.kind === null) {
    if (stages.some(isActive))
      throw new Error(
        "Select film, brief, or library before activating a layer.",
      );
    return;
  }
  if (graph.populationScope.mode === "complete-production-reset") {
    if (
      graph.kind === "film" &&
      [graph.treatments, graph.scripts, graph.screenplays].some(
        (stage: AutoMovieEvidenceStage): boolean => stage !== "draft",
      )
    )
      throw new Error(
        "A film complete-production-reset requires treatments, scripts, and screenplays to reset together to draft.",
      );
    if (graph.kind === "film" && revisionStage(graph) !== "disabled")
      throw new Error(
        "A film complete-production-reset disables screenplay naturalness and removes its final hosts until construction reaches evidence again.",
      );
    if (graph.kind === "library") {
      const hasResetPair: boolean = (Object.keys(SOURCES) as AutoMovieSourceRealizationBranch[]).some(
        (source: AutoMovieSourceRealizationBranch): boolean => {
          const design: "instances" | "maps" | "materials" | "models" | "motions" | "spaces" | "systems" | null = SOURCES[source].design;
          return (
            design !== null &&
            graph[design] === "draft" &&
            graph[source] === "draft"
          );
        },
      );
      if (!hasResetPair)
        throw new Error(
          "A library complete-production-reset requires at least one matching design and source branch in draft.",
        );
    }
  }
  if (!isActive(graph.settings) && !isActive(graph.research))
    throw new Error(
      `${graph.kind} must begin with research or an active settings layer.`,
    );
  if (graph.kind === "film" && isActive(graph.briefs))
    throw new Error("A film cannot activate the direct-brief layer.");
  if (
    graph.kind === "brief" &&
    [
      graph.treatments,
      graph.scripts,
      graph.screenplays,
      revisionStage(graph),
    ].some(isActive)
  )
    throw new Error(
      "A brief cannot activate treatments, scripts, screenplays, or screenplay naturalness; choose film when narrative refinement is required.",
    );
  if (
    graph.kind === "library" &&
    [
      graph.treatments,
      graph.scripts,
      graph.screenplays,
      revisionStage(graph),
      graph.briefs,
      graph.shots,
      graph.filmSources,
    ].some(isActive)
  )
    throw new Error(
      "A library cannot activate narrative, screenplay-naturalness, brief, shot, or film-source layers.",
    );

  if (isActive(graph.research))
    for (const name of Object.keys(MARKDOWN) as AutoMovieAuthoredDocumentLayer[])
      if (name !== "research")
        requireCompletedParent(name, graph[name], "research", graph.research);

  for (const name of [
    "maps",
    "models",
    "spaces",
    "materials",
    "instances",
    "motions",
    "systems",
    "treatments",
    "briefs",
  ] as const)
    requireCompletedParent(name, graph[name], "settings", graph.settings);
  requireCompletedFoundations(graph);
  if (
    graph.populationScope.mode !== "complete-production-reset" ||
    graph.kind !== "film"
  ) {
    requireCompletedParent(
      "scripts",
      graph.scripts,
      "treatments",
      graph.treatments,
    );
    requireCompletedParent(
      "screenplays",
      graph.screenplays,
      "scripts",
      graph.scripts,
    );
  }
  requireCompletedParent(
    "screenplay naturalness",
    revisionStage(graph),
    "screenplays",
    graph.screenplays,
  );

  for (const name of Object.keys(SOURCES) as AutoMovieSourceRealizationBranch[]) {
    const design: "instances" | "maps" | "materials" | "models" | "motions" | "spaces" | "systems" | null = SOURCES[name].design;
    if (
      design !== null &&
      !(
        graph.populationScope.mode === "complete-production-reset" &&
        graph.kind === "library" &&
        graph[name] === "draft" &&
        graph[design] === "draft"
      )
    )
      requireCompletedParent(name, graph[name], design, graph[design]);
  }
  requireCompletedParent(
    "productionSources",
    graph.productionSources,
    "settings",
    graph.settings,
  );
  if (isActive(graph.shots)) {
    if (graph.kind === "film")
      requireCompletedParent(
        "shots",
        graph.shots,
        "screenplay naturalness",
        revisionStage(graph),
      );
    else requireCompletedParent("shots", graph.shots, "briefs", graph.briefs);
    for (const name of Object.keys(SOURCES) as AutoMovieSourceRealizationBranch[]) {
      const design: "instances" | "maps" | "materials" | "models" | "motions" | "spaces" | "systems" | null = SOURCES[name].design;
      if (design !== null && isActive(graph[design]))
        requireCompletedParent("shots", graph.shots, name, graph[name]);
    }
  }
  if (isActive(graph.filmSources)) {
    requireCompletedParent(
      "filmSources",
      graph.filmSources,
      "shots",
      graph.shots,
    );
    requireCompletedParent(
      "filmSources",
      graph.filmSources,
      "productionSources",
      graph.productionSources,
    );
  }
}
