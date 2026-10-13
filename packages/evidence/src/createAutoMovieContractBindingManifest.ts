import path from "node:path";
import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";
import type { AutoMovieContractRelationship } from "./AutoMovieContractRelationship";
import type { AutoMovieDesignDocumentLayer } from "./AutoMovieDesignDocumentLayer";
import type { AutoMovieEvidenceBranch } from "./AutoMovieEvidenceBranch";
import type { AutoMovieEvidenceStage } from "./AutoMovieEvidenceStage";
import type { AutoMovieSourceRealizationBranch } from "./AutoMovieSourceRealizationBranch";
import type { IAutoMovieContractBindingManifest } from "./IAutoMovieContractBindingManifest";
import type { IAutoMovieEvidenceBranchClaim } from "./IAutoMovieEvidenceBranchClaim";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import type { IAutoMovieEvidenceHeadingIdentity } from "./IAutoMovieEvidenceHeadingIdentity";
import type { IAutoMovieEvidenceTopologyDeclaration } from "./IAutoMovieEvidenceTopologyDeclaration";
import type { IAutoMovieEvidenceTopologyEdge } from "./IAutoMovieEvidenceTopologyEdge";
import type { IAutoMovieSharedContractReference } from "./IAutoMovieSharedContractReference";
import type { ITtscEvidenceGraphMarkdownReference, ITtscEvidenceGraphReference } from "@ttsc/evidence";

import { DESIGN_FOUNDATIONS } from "./DESIGN_FOUNDATIONS";
import { EXPECTED_CONTRACTS } from "./EXPECTED_CONTRACTS";
import { MARKDOWN } from "./MARKDOWN";
import { SOURCES } from "./SOURCES";
import { contractBasename } from "./contractBasename";
import { contractFamily } from "./contractFamily";
import { evidenceRoot } from "./evidenceRoot";
import { inspectAutoMovieEvidenceTopology } from "./inspectAutoMovieEvidenceTopology";
import { isActive } from "./isActive";
import { markdownIdentities } from "./markdownIdentities";
import { normalizeGlob } from "./normalizeGlob";
import { projectAutoMovieLocalContractClaims } from "./projectAutoMovieLocalContractClaims";
import { sharedClaimBindings } from "./sharedClaimBindings";
import { stageOf } from "./stageOf";
import { validateProductionGraph } from "./validateProductionGraph";

function logicalContractPath(contract: IAutoMovieSharedContractReference): string {
  return contract.file.startsWith("language/")
    ? contract.file
    : `${contractFamily(contract)}/${contract.domain}/${contractBasename(contract)}`;
}

function symbolsOf(symbol: string | readonly string[]): string[] {
  return Array.isArray(symbol) ? [...symbol] : [symbol as string];
}

function contractForReference(graph: IAutoMovieEvidenceConfigProps, reference: ITtscEvidenceGraphMarkdownReference): IAutoMovieSharedContractReference | undefined {
  const expected: IAutoMovieSharedContractReference | undefined = EXPECTED_CONTRACTS.find(
    (contract: IAutoMovieSharedContractReference): boolean => contract.file === reference.files[0],
  );
  if (expected !== undefined) return expected;
  const file: string = reference.files[0];
  if (
    file === undefined ||
    /^language\/(?:discovery|naturalness|obligations|principles)\/[a-z0-9-]+\.md$/u.test(
      file,
    ) === false
  )
    return undefined;
  return {
    domain: "core",
    file,
    anchors: markdownIdentities(
      path.join(graph.location, evidenceRoot(reference), file),
      [2],
    ).map((identity: IAutoMovieEvidenceHeadingIdentity): string => identity.anchor),
  };
}

function relationshipOf(binding: IAutoMovieEvidenceBranchClaim, reference: ITtscEvidenceGraphReference, contract: IAutoMovieSharedContractReference | undefined): AutoMovieContractRelationship {
  if (contract !== undefined)
    return ["naturalness", "principles", "upstream"].includes(
      contractFamily(contract),
    )
      ? "checklist"
      : "distributed-coverage";
  if (
    binding.claim.type === "markdown" &&
    binding.claim.files.every((file: string): boolean => file.startsWith("accounts/"))
  )
    return "population-account";
  if (
    reference.type === "markdown" &&
    (reference.uniqueEvidence === true ||
      reference.singleEvidencePerSymbol === true)
  )
    return "lineage";
  if (
    binding.claim.type === "typescript" &&
    binding.branch !== "productionSources"
  )
    return "lineage";
  return "foundation";
}

const TOPOLOGY_ORDER: Readonly<Record<AutoMovieAuthoredDocumentLayer, number>> = {
  settings: 0,
  research: 1,
  maps: 1,
  spaces: 2,
  models: 3,
  materials: 4,
  instances: 5,
  motions: 6,
  systems: 6,
  treatments: 1,
  scripts: 2,
  screenplays: 3,
  briefs: 7,
};

/** Project the complete selected foundation matrix and audit it in one pass. */
function topologyOf(graph: IAutoMovieEvidenceConfigProps): IAutoMovieContractBindingManifest["topology"] {
  const branches: { name: "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments"; active: boolean; order: number; }[] = (Object.keys(MARKDOWN) as AutoMovieAuthoredDocumentLayer[]).map((name: "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments"): { name: "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments"; active: boolean; order: number; } => ({
    name,
    active: isActive(graph[name]),
    order: TOPOLOGY_ORDER[name],
  }));
  const expected: IAutoMovieEvidenceTopologyEdge[] = [
    ...(Object.keys(MARKDOWN) as AutoMovieAuthoredDocumentLayer[])
      .filter((consumer: "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments"): boolean => !["settings", "research"].includes(consumer))
      .map((consumer: "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments"): { provider: string; consumer: "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments"; } => ({ provider: "settings", consumer })),
    ...(
      Object.entries(DESIGN_FOUNDATIONS) as [
        AutoMovieAuthoredDocumentLayer,
        readonly AutoMovieDesignDocumentLayer[],
      ][]
    ).flatMap(([consumer, providers]: ["briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments", readonly ("instances" | "maps" | "materials" | "models" | "motions" | "spaces" | "systems")[]]): { provider: "instances" | "maps" | "materials" | "models" | "motions" | "spaces" | "systems"; consumer: "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments"; simultaneous: boolean; }[] =>
      providers.map((provider: "instances" | "maps" | "materials" | "models" | "motions" | "spaces" | "systems"): { provider: "instances" | "maps" | "materials" | "models" | "motions" | "spaces" | "systems"; consumer: "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments"; simultaneous: boolean; } => ({
        provider,
        consumer,
        simultaneous:
          (provider === "motions" && consumer === "systems") ||
          (provider === "systems" && consumer === "motions"),
      })),
    ),
  ];
  const active: Map<string, boolean> = new Map<string, boolean>(
    branches.map((branch: { name: "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments"; active: boolean; order: number; }): ["briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments", boolean] => [branch.name, branch.active]),
  );
  const declarations: IAutoMovieEvidenceTopologyDeclaration[] = expected.map(
    (edge: IAutoMovieEvidenceTopologyEdge): { provider: string; consumer: string; status: "inapplicable" | "uses"; reason: string; } => {
      const status: "inapplicable" | "uses" =
        active.get(edge.provider) === true && active.get(edge.consumer) === true
          ? "uses"
          : "inapplicable";
      return {
        provider: edge.provider,
        consumer: edge.consumer,
        status,
        reason:
          status === "uses"
            ? `${edge.consumer} consumes the selected ${edge.provider} foundation population.`
            : `${edge.consumer} or its ${edge.provider} foundation is outside the selected production population.`,
      };
    },
  );
  return {
    branches,
    expected,
    declarations,
    diagnostics: inspectAutoMovieEvidenceTopology({
      branches,
      expected,
      declarations,
    }),
  };
}

/** The authored Markdown branch selected by a project-local population. */
function referencedMarkdownBranch(reference: ITtscEvidenceGraphMarkdownReference): AutoMovieAuthoredDocumentLayer | undefined {
  // No root guard. Every reference this walks declares `docs`, so a guard on
  // that would be an alternative nothing reaches, and the lookup below already
  // answers `undefined` for any first segment that is not a layer name --
  // which is what a reference rooted elsewhere would produce anyway.
  const roots: Set<string> = new Set(
    reference.files.map((file: string): string => normalizeGlob(file).split("/")[0]!),
  );
  const root: string = [...roots][0]!;
  return (Object.keys(MARKDOWN) as AutoMovieAuthoredDocumentLayer[]).find(
    (branch: "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments"): boolean => branch === root,
  );
}

/**
 * Derive the selected common-contract and population routes from the same validated claims used by `createAutoMovieEvidenceConfig`.
 *
 * @evidence contracts/common.md#principled-implementation The production graph is validated before projecting active branches, native references, local bindings and the foundation topology.
 * @evidence contracts/common.md#clear-and-simple-design The manifest derives from the same shared claim constructors as compiler configuration, preserving enforcement and target identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Draft relationships remain visible while enforced reflects claim.disabled; topology reasons describe selected branches rather than certify authored prose.
 * @evidence contracts/common.md#meaningful-documentation Paths are logical contract routes or population selectors; returned arrays are read-only types without a deep-freeze guarantee.
 * @evidence contracts/performance.md#efficient-algorithms Validation reads project populations, then route projection scans claims and references; per-reference inventory searches and language heading reads are currently repeated.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared inventory and claim builders are reused; repeated calls revalidate mutable files instead of assuming location alone establishes equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns fresh manifest records and copied selector arrays; scope and local projection data may share references, with no retained factory cache.
 */
export function createAutoMovieContractBindingManifest(graph: IAutoMovieEvidenceConfigProps): IAutoMovieContractBindingManifest {
  validateProductionGraph(graph);
  const branches: { name: "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments" | "screenplayNaturalness" | AutoMovieSourceRealizationBranch; stage: AutoMovieEvidenceStage; }[] = [
    ...(Object.keys(MARKDOWN) as AutoMovieAuthoredDocumentLayer[]),
    "screenplayNaturalness" as const,
    ...(Object.keys(SOURCES) as AutoMovieSourceRealizationBranch[]),
  ]
    .filter((branch: "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments" | "screenplayNaturalness" | AutoMovieSourceRealizationBranch): boolean => isActive(stageOf(graph, branch)))
    .map((name: "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments" | "screenplayNaturalness" | AutoMovieSourceRealizationBranch): { name: "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments" | "screenplayNaturalness" | AutoMovieSourceRealizationBranch; stage: AutoMovieEvidenceStage; } => ({ name, stage: stageOf(graph, name) }));
  const active: Set<AutoMovieEvidenceBranch> = new Set<AutoMovieEvidenceBranch>(branches.map((branch: { name: "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments" | "screenplayNaturalness" | AutoMovieSourceRealizationBranch; stage: AutoMovieEvidenceStage; }): "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments" | "screenplayNaturalness" | AutoMovieSourceRealizationBranch => branch.name));
  const bindings: IAutoMovieContractBindingManifest["bindings"][number][] = [];
  for (const binding of sharedClaimBindings(graph)) {
    if (!active.has(binding.branch)) continue;
    const references: ITtscEvidenceGraphReference[] = Array.isArray(binding.claim.reference)
      ? binding.claim.reference
      : [binding.claim.reference];
    for (const sourceReference of references) {
      const reference: ITtscEvidenceGraphMarkdownReference & { files: string[]; symbol: string | string[]; } =
        sourceReference as ITtscEvidenceGraphMarkdownReference & {
          files: string[];
          symbol: string | string[];
        };
      const contract: IAutoMovieSharedContractReference | undefined = contractForReference(graph, reference);
      const referencedBranch: "briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments" | undefined = referencedMarkdownBranch(reference);
      if (
        contract === undefined &&
        referencedBranch !== undefined &&
        !isActive(graph[referencedBranch])
      )
        continue;
      bindings.push({
        branch: binding.branch,
        stage: stageOf(graph, binding.branch),
        enforced: binding.claim.disabled !== true,
        claim: binding.claim.name!,
        relationship: relationshipOf(binding, reference, contract),
        severity: reference.severity,
        requireReview: reference.requireReview,
        host: {
          type: binding.claim.type as "markdown" | "typescript",
          root: evidenceRoot(binding.claim),
          files: [...binding.claim.files],
          symbols: symbolsOf(
            binding.claim.symbol as string | readonly string[],
          ),
        },
        target:
          contract === undefined
            ? {
                type: "population",
                root: evidenceRoot(reference),
                files: [...reference.files],
                symbols: symbolsOf(reference.symbol),
              }
            : {
                type: "contract",
                family: contractFamily(contract),
                domain: contract.domain,
                path: logicalContractPath(contract),
                anchors: [...contract.anchors],
              },
      });
    }
  }
  const { localBindings, localAudits }: ReturnType<typeof projectAutoMovieLocalContractClaims> = projectAutoMovieLocalContractClaims(
    graph.claims ?? [],
  );
  return {
    kind: graph.kind,
    language: graph.language,
    populationScope: graph.populationScope,
    branches,
    bindings,
    localBindings,
    localAudits,
    topology: topologyOf(graph),
  };
}
