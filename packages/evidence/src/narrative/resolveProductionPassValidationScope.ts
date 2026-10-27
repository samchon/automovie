import {
  type IEvidenceCheckAnalysis,
  type IEvidenceCheckClaim,
  type IEvidenceCheckObligation,
  type IEvidenceConfig,
  type IEvidenceConfigPlan,
  type IEvidenceConfigPlanReference,
  type IEvidenceGraphClaim,
  type IEvidenceGraphClaimResult,
  type IEvidenceGraphObligation,
  type IEvidenceGraphReference,
  type IEvidenceInventory,
  type IEvidenceReference,
  type IEvidenceSourceAddress,
  type IEvidenceSourceFile,
  createEvidenceConfigPlan,
} from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "./AuthoredLayer";
import type { IProductionClaimOwner } from "./IProductionClaimOwner";
import type { IProductionConfigProps } from "./IProductionConfigProps";
import type { IProductionGateKey } from "./IProductionGateKey";
import type { IProductionPassValidationScope } from "./IProductionPassValidationScope";
import type { ProductionGatePass } from "./ProductionGatePass";
import { AUTHORED_LAYERS } from "./internal/AUTHORED_LAYERS";
import { ProductionAnalysisCapture } from "./internal/ProductionAnalysisCapture";
import type { ProductionPathCapture } from "./internal/ProductionPathCapture";
import { assertProductionSupportAnalysis } from "./internal/assertProductionSupportAnalysis";
import { hasNaturalness } from "./internal/hasNaturalness";
import { authoredPathOwner } from "./internal/passScope/authoredPathOwner";
import { bodyLayers } from "./internal/passScope/bodyLayers";
import { collectProductionSourcePasses } from "./internal/passScope/collectProductionSourcePasses";
import { createProductionPassKeys } from "./internal/passScope/createProductionPassKeys";
import { declaredProductionPasses } from "./internal/passScope/declaredProductionPasses";
import { indexProductionAnalysis } from "./internal/passScope/indexProductionAnalysis";
import { inspectProductionAnalysis } from "./internal/passScope/inspectProductionAnalysis";
import { inventoryPaths } from "./internal/passScope/inventoryPaths";
import { productionLayers } from "./internal/productionLayers";
import { inspectProductionTopology } from "./internal/topology/inspectProductionTopology";
import { resolveConstruction } from "./internal/utilities/resolveConstruction";
import { validationOwner } from "./internal/validationOwner";
import { passId } from "./passId";

/**
 * Resolves dependencies from the original config and analyzeProductionPass snapshot.
 *
 * Captured physical aliases and source identities define ownership. Unbound
 * analyses are rejected instead of inferring missing provenance from live files.
 *
 * @evidence contracts/common.md#principled-implementation Original-config provenance and bound path capture precede indexing the complete plan/input/result/report; explicit canon edges and actual captured reference ownership build a pass graph whose DFS closure defines prerequisites. Complete empty current review/verdict populations may await their first reader; incomplete captures and inactive authored or upstream duties remain issues.
 * @evidence contracts/common.md#clear-and-simple-design The scope resolver owns dependency/readiness boundaries while native Evidence owns evaluation and topology helpers own document/lineage checks; the captured canonical resolver prevents live filesystem reinterpretation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Known route and authored-pass relationships are domain rules; custom claims receive the same materialization/ownership checks, support stays global, and cycles in any active authored boundary remain blocking even outside the current closure.
 * @evidence contracts/common.md#meaningful-documentation The prose states snapshot-only aliases/source identity and unbound-analysis rejection; the returned scope exposes required original indices, input paths and issues without changing native diagnostics.
 * @evidence contracts/performance.md#efficient-algorithms Plan and analysis maps avoid repeated top-level joins, but reference/report finds, expected-index membership, custom review-host source intersections, alias/boundary scans and issue deduplication retain nested costs in claims, references, sources and findings. The pass graph has at most six supported keys; topology validation additionally processes captured document bytes. Maps, sets and scope arrays scale with the complete analyzed graph.
 * @evidence contracts/performance.md#reuse-equivalent-work One indexed plan/analysis and captured path resolver are shared throughout the scope build; physical aliases and input bytes come from the evaluated snapshot. The config is revalidated and scope recomputed for each key rather than caching caller-editable analysis-derived results.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All dependency/index maps and DFS sets are local; the returned scope retains owners, required keys and input-path strings while the weak capture registry owns saved metadata with its analysis. No live filesystem handle or task is acquired.
 */
export function resolveProductionPassValidationScope(
  config: IEvidenceConfig,
  key: IProductionGateKey,
  analysis: IEvidenceCheckAnalysis,
): IProductionPassValidationScope {
  const {
    props,
    owners,
  }: { props: IProductionConfigProps; owners: IProductionClaimOwner[] } =
    validationOwner(config);
  const captured: ProductionPathCapture = ProductionAnalysisCapture.get(
    config,
    analysis,
  );
  const canonical: (filename: string, logicalRoot?: string) => string = (
    filename: string,
    logicalRoot?: string,
  ): string => captured.resolve(filename, logicalRoot);
  assertProductionSupportAnalysis(captured, owners, analysis);
  if (
    !productionLayers(props).includes(key.layer) ||
    !["construction", "naturalness"].includes(key.pass)
  )
    throw new Error("Unknown pass validation layer/pass.");
  if (key.pass === "naturalness" && !hasNaturalness(key.layer))
    throw new Error("Only scripts and screenplay have a naturalness pass.");
  const scope: IProductionPassValidationScope = {
    key: { ...key },
    owners,
    requiredPasses: [],
    requiredClaimIndices: [],
    inputs: [],
    issues: [],
  };
  const issue: (message: string) => void = (message: string): void => {
    if (!scope.issues.includes(message)) scope.issues.push(message);
  };
  const plan: IEvidenceConfigPlan = createEvidenceConfigPlan(
    config,
    analysis.report.configFile,
  );
  const {
    planned,
    inputs,
    results,
    reports,
  }: ReturnType<typeof indexProductionAnalysis> = indexProductionAnalysis(
    plan,
    analysis,
  );
  for (const message of inspectProductionAnalysis(
    props.location,
    analysis,
    planned,
    canonical,
  ))
    issue(message);

  const stage: (pass: IProductionGateKey) => string = (
    pass: IProductionGateKey,
  ): string =>
    pass.pass === "construction"
      ? resolveConstruction(props.construction[pass.layer])[0]
      : props.naturalness[pass.layer as "scripts" | "screenplay"];
  const keys: Map<string, IProductionGateKey> = createProductionPassKeys();
  const dependencies: Map<string, Set<string>> = new Map(
    [...keys.keys()].map((id: string): [string, Set<string>] => [
      id,
      new Set(),
    ]),
  );
  const add: (from: IProductionGateKey, to: IProductionGateKey) => void = (
    from: IProductionGateKey,
    to: IProductionGateKey,
  ): void => {
    if (passId(from) !== passId(to))
      dependencies.get(passId(from))!.add(passId(to));
  };
  // Documentary canon flows through treatments; screenplay alone selects a revised parent.
  for (const layer of AUTHORED_LAYERS) {
    if (hasNaturalness(layer))
      add({ layer, pass: "naturalness" }, { layer, pass: "construction" });
    if (props.mode !== "long") continue;
    if (layer === "treatments")
      add(
        { layer, pass: "construction" },
        { layer: "settings", pass: "construction" },
      );
    if (layer === "scripts" || layer === "screenplay")
      add(
        { layer, pass: "construction" },
        { layer: "treatments", pass: "construction" },
      );
    if (layer === "screenplay")
      add(
        { layer, pass: "construction" },
        {
          layer: "scripts",
          pass: resolveConstruction(props.construction.screenplay)[1]
            ? "naturalness"
            : "construction",
        },
      );
  }

  // Actual physical identity and logical aliases must agree about authored ownership.
  const sourceOwners: Map<string, Set<string>> = new Map<string, Set<string>>();
  const collectSource: (inventory: IEvidenceInventory) => Set<string> = (
    inventory: IEvidenceInventory,
  ): Set<string> =>
    collectProductionSourcePasses(
      inventory,
      props.location,
      keys,
      sourceOwners,
      issue,
      canonical,
    );
  const declared: (
    selectedRoot: string | undefined,
    files: string[] | undefined,
    empty: boolean,
  ) => Set<string> = (
    selectedRoot: string | undefined,
    files: string[] | undefined,
    empty: boolean,
  ): Set<string> =>
    declaredProductionPasses(
      props.location,
      selectedRoot,
      files,
      empty,
      keys,
      issue,
      canonical,
    );
  for (const owner of owners) {
    if (
      owner.kind === "review" ||
      owner.kind === "verdict" ||
      owner.kind === "support"
    )
      continue;
    const input: IEvidenceGraphClaim | undefined = inputs.get(owner.index);
    if (input === undefined) continue;
    for (const source of input.inventory.sources) {
      const existing: Set<string> =
        sourceOwners.get(source.id) ?? new Set<string>();
      // Discovery hosts are contract documents, not authored source passes.
      if (
        [
          source.physicalPath,
          ...source.addresses.map(
            (address: IEvidenceSourceAddress): string => address.absolute,
          ),
        ].some(
          (address: string): boolean =>
            authoredPathOwner(props.location, address, canonical) !== undefined,
        )
      )
        existing.add(passId(owner));
      sourceOwners.set(source.id, existing);
    }
  }

  for (const claim of plan.claims) {
    const owner: IProductionClaimOwner = owners[claim.index];
    const input: IEvidenceGraphClaim | undefined = inputs.get(claim.index);
    const result: IEvidenceGraphClaimResult | undefined = results.get(
      claim.index,
    );
    const report: IEvidenceCheckClaim | undefined = reports.get(claim.index);
    if (
      owner === undefined ||
      input === undefined ||
      result === undefined ||
      report === undefined
    ) {
      issue(`Claim ${claim.index} is absent from the full analysis.`);
      continue;
    }
    if (owner.kind === "support") {
      if (!input.inventory.complete || !result.complete || !report.complete)
        issue(`Support claim ${claim.index} is incomplete.`);
      continue;
    }
    // Empty current review hosts await the reader; their captured references
    // must still be complete and retain every planned boundary and dependency.
    const awaitingReview: boolean =
      passId(owner) === passId(key) &&
      (owner.kind === "review" || owner.kind === "verdict") &&
      input.unitIds.length === 0;
    if (
      !input.inventory.complete ||
      (!result.active && !awaitingReview) ||
      !result.complete ||
      (!report.active && !awaitingReview) ||
      !report.complete
    )
      issue(`Claim ${claim.index} has incomplete or inactive materialization.`);
    const expected: number[] = claim.references.map(
      (reference: IEvidenceConfigPlanReference): number => reference.index,
    );
    for (const actual of [
      input.references.map(
        (reference: IEvidenceGraphReference): number | undefined =>
          reference.index,
      ),
      result.obligations.map(
        (obligation: IEvidenceGraphObligation): number => obligation.reference,
      ),
      report.obligations.map(
        (obligation: IEvidenceCheckObligation): number => obligation.reference,
      ),
    ])
      if (
        actual.length !== expected.length ||
        new Set(actual).size !== actual.length ||
        actual.some(
          (index: number | undefined): boolean =>
            index === undefined || !expected.includes(index),
        )
      )
        issue(`Claim ${claim.index} does not retain every active reference.`);
    const hostPasses: Set<string> = collectSource(input.inventory);
    if (owner.kind === "custom") {
      for (const pass of declared(
        claim.population.root,
        claim.population.files,
        input.inventory.sources.length === 0,
      ))
        hostPasses.add(pass);
      if (
        [
          ...bodyLayers(
            props.location,
            claim.population.root,
            claim.population.files,
            input.inventory,
            canonical,
          ),
        ].some((layer: AuthoredLayer): boolean => layer !== owner.layer)
      )
        issue(
          `Custom claim ${claim.index} hosts disagree with gate.claimScopes.`,
        );
    }
    if (
      owner.kind === "custom" &&
      [...hostPasses].some((pass: string): boolean => pass !== passId(owner))
    )
      issue(
        `Custom claim ${claim.index} hosts disagree with gate.claimScopes.`,
      );
    for (const reference of input.references) {
      const obligation: IEvidenceGraphObligation | undefined =
        result.obligations.find(
          (obligation: IEvidenceGraphObligation): boolean =>
            obligation.reference === reference.index,
        );
      const reported: IEvidenceCheckObligation | undefined =
        report.obligations.find(
          (obligation: IEvidenceCheckObligation): boolean =>
            obligation.reference === reference.index,
        );
      if (
        !reference.inventory.complete ||
        obligation?.complete !== true ||
        (obligation.active !== true && !awaitingReview) ||
        obligation.claim !== claim.index ||
        reported?.complete !== true ||
        (reported.active !== true && !awaitingReview) ||
        reported.claim !== claim.index
      )
        issue(
          `Claim ${claim.index} reference ${reference.index} is incomplete or inactive.`,
        );
      for (const resolution of [
        ...reference.resolutions,
        ...(reference.reviewResolutions ?? []),
      ])
        if (["ambiguous", "incomplete"].includes(resolution.resolution.status))
          issue(
            `Claim ${claim.index} reference ${reference.index} has ambiguous or incomplete resolution.`,
          );
      for (const pass of collectSource(reference.inventory))
        add(owner, keys.get(pass)!);
      const selection: IEvidenceReference = claim.references.find(
        (entry: IEvidenceConfigPlanReference): boolean =>
          entry.index === reference.index,
      )!.population;
      for (const pass of declared(
        selection.root,
        "files" in selection ? selection.files : undefined,
        reference.inventory.sources.length === 0,
      ))
        add(owner, keys.get(pass)!);
      if ("files" in selection)
        for (const layer of bodyLayers(
          props.location,
          selection.root,
          selection.files,
          reference.inventory,
          canonical,
        )) {
          if (layer === owner.layer) continue;
          const upstream: "construction" | "naturalness" =
            hasNaturalness(layer) &&
            (owner.pass === "naturalness" ||
              (owner.layer === "screenplay" &&
                resolveConstruction(props.construction.screenplay)[1]))
              ? "naturalness"
              : "construction";
          add(owner, { layer, pass: upstream });
        }
      // A custom reference to a review host requires that review's entire pass.
      if (owner.kind === "custom")
        for (const candidate of owners) {
          const other: IEvidenceGraphClaim | undefined = inputs.get(
            candidate.index,
          );
          if (
            other === undefined ||
            (candidate.kind !== "review" && candidate.kind !== "verdict")
          )
            continue;
          if (
            reference.inventory.sources.some(
              (source: IEvidenceSourceFile): boolean =>
                other.inventory.sources.some(
                  (host: IEvidenceSourceFile): boolean => host.id === source.id,
                ),
            )
          )
            add(owner, candidate);
        }
    }
  }

  const visiting: Set<string> = new Set<string>();
  const visited: Set<string> = new Set<string>();
  const visit: (id: string) => void = (id: string): void => {
    if (visiting.has(id)) {
      issue(`Pass dependencies contain a cycle at ${id}.`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of dependencies.get(id)!) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  };
  visit(passId(key));
  scope.requiredPasses = [...visited].map(
    (id: string): { layer: AuthoredLayer; pass: ProductionGatePass } => ({
      ...keys.get(id)!,
    }),
  );
  // An invalid cycle in any active custom boundary cannot be certified as a
  // frozen policy finding by the current pass.
  for (const owner of owners)
    if (owner.kind !== "support" && planned.has(owner.index))
      visit(passId(owner));
  for (const required of scope.requiredPasses) {
    if (stage(required) !== "evidence")
      issue(`Required pass ${passId(required)} is disabled.`);
    // A separately staged generated duty still belongs to the whole pass.
    for (const owner of owners)
      if (
        passId(owner) === passId(required) &&
        owner.kind === "generated" &&
        !planned.has(owner.index)
      )
        issue(
          `Required pass ${passId(required)} has disabled generated duty ${owner.index}.`,
        );
    const claims: IProductionClaimOwner[] = owners.filter(
      (owner: IProductionClaimOwner): boolean =>
        owner.kind !== "support" &&
        passId(owner) === passId(required) &&
        planned.has(owner.index),
    );
    if (
      !claims.some(
        (owner: IProductionClaimOwner): boolean =>
          owner.authored === true &&
          (inputs.get(owner.index)?.unitIds.length ?? 0) > 0,
      )
    )
      issue(
        `Required pass ${passId(required)} has no active authored population.`,
      );
    // Upstream review must exist; the current pass may be ready for its first reread.
    if (passId(required) !== passId(key))
      for (const kind of ["review", "verdict"] as const)
        if (
          !claims.some(
            (owner: IProductionClaimOwner): boolean =>
              owner.kind === kind &&
              (inputs.get(owner.index)?.unitIds.length ?? 0) > 0,
          )
        )
          issue(
            `Required upstream pass ${passId(required)} has no active ${kind}.`,
          );
    for (const owner of claims) {
      scope.requiredClaimIndices.push(owner.index);
      const input: IEvidenceGraphClaim | undefined = inputs.get(owner.index);
      if (input === undefined) continue;
      scope.inputs.push({
        claim: owner.index,
        paths: inventoryPaths(input.inventory),
      });
      for (const reference of input.references)
        scope.inputs.push({
          claim: owner.index,
          reference: reference.index,
          paths: inventoryPaths(reference.inventory),
        });
    }
  }
  scope.requiredClaimIndices.sort(
    (left: number, right: number): number => left - right,
  );
  for (const message of inspectProductionTopology(
    props,
    owners,
    analysis,
    scope.requiredPasses,
  ))
    issue(message);
  return scope;
}
