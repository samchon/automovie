import type { ITtscEvidenceGraphClaim, ITtscEvidenceGraphMarkdownReference, ITtscEvidenceGraphReference } from "@ttsc/evidence";
import type { AutoMovieProductionContractClaim } from "./AutoMovieProductionContractClaim";
import type { IAutoMovieLocalContractProjection } from "./IAutoMovieLocalContractProjection";


/** Projects local contract targets and their eligible authored population.
 *
 * @evidence contracts/common.md#principled-implementation Already validated bindings become diagnostic host/target selectors with normalized omitted roots and symbol arrays; obligations expose their eligible population separately.
 * @evidence contracts/common.md#clear-and-simple-design One manifest projection separates enforced bindings from explicitly inapplicable audit relationships.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Projection does not reclassify false disabled state as an evidence verdict or invent symbols for omitted selectors.
 * @evidence contracts/common.md#meaningful-documentation The comment and DTO members state diagnostic identity, eligibility and omitted-selector meanings.
 * @evidence contracts/performance.md#efficient-algorithms For C claims, R references and selector strings, mapping and copying are linear in the retained population size.
 * @evidence contracts/performance.md#reuse-equivalent-work Validated original binding metadata is reused without reconstructing graph factories a second time in this projection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only diagnostic records and selector copies escape; caller declarations remain unchanged and no source or handle is retained.
 */
export function projectAutoMovieLocalContractClaims(
  claims: readonly ITtscEvidenceGraphClaim[],
): {
  localBindings: IAutoMovieLocalContractProjection[];
  localAudits: IAutoMovieLocalContractProjection[];
} {
  const localBindings: IAutoMovieLocalContractProjection[] = [];
  const localAudits: IAutoMovieLocalContractProjection[] = [];
  for (const raw of claims) {
    const claim: Partial<AutoMovieProductionContractClaim> = raw as Partial<AutoMovieProductionContractClaim>;
    if (claim.autoMovieBinding === undefined) continue;
    const binding: AutoMovieProductionContractClaim["autoMovieBinding"] = claim.autoMovieBinding;
    const references: ITtscEvidenceGraphMarkdownReference[] = (
      Array.isArray(raw.reference) ? raw.reference : [raw.reference]
    ).filter(
      (reference: ITtscEvidenceGraphReference): reference is ITtscEvidenceGraphMarkdownReference =>
        reference.type === "markdown",
    );
    const population: { root: string; files: string[]; symbols: string[]; } | undefined =
      binding.account === undefined
        ? undefined
        : {
            root: claim.root ?? ".",
            files: raw.files.slice(1),
            symbols: symbols(raw.symbol),
          };
    const projection: IAutoMovieLocalContractProjection = {
      claim: raw.name ?? "",
      layer: binding.layer,
      pass: binding.pass,
      stage: binding.stage,
      enforced: raw.disabled !== true,
      populationScope: binding.populationScope,
      relationship:
        binding.account === undefined ? "checklist" : "distributed-coverage",
      host: {
        root: claim.root ?? ".",
        files: [...raw.files],
        symbols: symbols(raw.symbol),
      },
      targets: references.map(projectReference),
      ...(population === undefined ? {} : { population }),
    };
    (binding.disposition === "binding" ? localBindings : localAudits).push(
      projection,
    );
  }
  return { localBindings, localAudits };
}


/** Retain the native omitted-selector meaning rather than inventing units. */
function symbols(value: unknown): string[] {
  return value === undefined
    ? []
    : Array.isArray(value)
      ? [...value]
      : [value as string];
}


/** Project one native reference without changing its paths or selector. */
function projectReference(
  reference: ITtscEvidenceGraphMarkdownReference,
): IAutoMovieLocalContractProjection["host"] {
  return {
    root: reference.root ?? ".",
    files: [...reference.files],
    symbols: symbols(reference.symbol),
  };
}
