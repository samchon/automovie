import {
  type IEvidenceCheckAnalysis,
  type IEvidenceCheckClaim,
  type IEvidenceCheckObligation,
  type IEvidenceConfig,
  type IEvidenceConfigPlan,
  type IEvidenceConfigPlanClaim,
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
import { assertProductionSupportAnalysis } from "./internal/assertProductionSupportAnalysis";
import { hasNaturalness } from "./internal/hasNaturalness";
import { authoredPathOwner } from "./internal/passScope/authoredPathOwner";
import { bodyLayers } from "./internal/passScope/bodyLayers";
import { collectProductionSourcePasses } from "./internal/passScope/collectProductionSourcePasses";
import { declaredProductionPasses } from "./internal/passScope/declaredProductionPasses";
import { inspectProductionAnalysis } from "./internal/passScope/inspectProductionAnalysis";
import { inventoryPaths } from "./internal/passScope/inventoryPaths";
import { productionLayers } from "./internal/productionLayers";
import { resolveConstruction } from "./internal/utilities/resolveConstruction";
import { validationOwner } from "./internal/validationOwner";
import { passId } from "./passId";

/** Resolves whole pass dependencies from declarations and the full captured analysis. */
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
  assertProductionSupportAnalysis(props.location, owners, analysis);
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
  const planned: Map<number, IEvidenceConfigPlanClaim> = new Map(
    plan.claims.map(
      (claim: IEvidenceConfigPlanClaim): [number, IEvidenceConfigPlanClaim] => [
        claim.index,
        claim,
      ],
    ),
  );
  const inputs: Map<number | undefined, IEvidenceGraphClaim> = new Map(
    analysis.graphInput.claims.map(
      (
        claim: IEvidenceGraphClaim,
      ): [number | undefined, IEvidenceGraphClaim] => [claim.index, claim],
    ),
  );
  const results: Map<number, IEvidenceGraphClaimResult> = new Map(
    analysis.graph.claims.map(
      (
        claim: IEvidenceGraphClaimResult,
      ): [number, IEvidenceGraphClaimResult] => [claim.claim, claim],
    ),
  );
  const reports: Map<number, IEvidenceCheckClaim> = new Map(
    analysis.report.claims.map(
      (claim: IEvidenceCheckClaim): [number, IEvidenceCheckClaim] => [
        claim.claim,
        claim,
      ],
    ),
  );
  for (const message of inspectProductionAnalysis(
    props.location,
    analysis,
    planned,
  ))
    issue(message);

  const stage: (pass: IProductionGateKey) => string = (
    pass: IProductionGateKey,
  ): string =>
    pass.pass === "construction"
      ? resolveConstruction(props.construction[pass.layer])[0]
      : props.naturalness[pass.layer as "scripts" | "screenplay"];
  const dependencies: Map<string, Set<string>> = new Map<string, Set<string>>();
  const keys: Map<string, IProductionGateKey> = new Map<
    string,
    IProductionGateKey
  >();
  for (const layer of AUTHORED_LAYERS)
    for (const pass of ["construction", "naturalness"] as const) {
      if (pass === "naturalness" && !hasNaturalness(layer)) continue;
      const entry: {
        layer: AuthoredLayer;
        pass: "construction" | "naturalness";
      } = { layer, pass };
      keys.set(passId(entry), entry);
      dependencies.set(passId(entry), new Set());
    }
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
            authoredPathOwner(props.location, address) !== undefined,
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
    if (
      !input.inventory.complete ||
      !result.active ||
      !result.complete ||
      !report.active ||
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
        obligation.active !== true ||
        obligation.claim !== claim.index ||
        reported?.complete !== true ||
        reported.active !== true ||
        reported.claim !== claim.index
      )
        issue(
          `Claim ${claim.index} reference ${reference.index} is incomplete.`,
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
  return scope;
}
