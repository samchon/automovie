import type { AutoMovieProductionContractClaim } from "./AutoMovieProductionContractClaim";
import type { IAutoMovieProductionObligationClaimProps } from "./IAutoMovieProductionObligationClaimProps";
import { createAutoMovieAuthoredPopulationFiles } from "./createAutoMovieAuthoredPopulationFiles";
import { createAutoMoviePopulationAccountClaim } from "./createAutoMoviePopulationAccountClaim";
import { createAutoMovieProductionContractClaim } from "./createAutoMovieProductionContractClaim";

/**
 * Creates one production-local obligation claim.
 *
 * The owning layer's H2s and a reserved aggregate account collectively cover the contract's H2 targets. Each cited target keeps its structural coverage duty. The binding retains the full eligible population and aggregate host address.
 *
 * @evidence contracts/common.md#principled-implementation Construction obligations use the full scoped authored population plus one validated aggregate account, with distributed H2 coverage.
 * @evidence contracts/common.md#clear-and-simple-design The entry point owns account-address validation and delegates shared local binding admission to the contract constructor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Naturalness obligations and non-flat account addresses are rejected instead of changing the per-unit principle contract.
 * @evidence contracts/common.md#meaningful-documentation account is docs-relative and includes its layer; returned autoMovieBinding retains the account for physical admission.
 * @evidence contracts/performance.md#efficient-algorithms Population selectors and base validation are linear in their sizes, and the result copies selector arrays once more for aggregate coverage.
 * @evidence contracts/performance.md#reuse-equivalent-work The validated base binding is reused when attaching the account; no independent side graph or cross-call cache is created.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh claim data is caller-owned; the supplied scope may remain shared and no resources survive the call.
 */
export function createAutoMovieProductionObligationClaim(
  props: IAutoMovieProductionObligationClaimProps,
): AutoMovieProductionContractClaim {
  if (props.pass === "naturalness")
    throw new Error(
      "Production-local obligations belong to construction populations; naturalness accepts per-unit principles only.",
    );
  if (typeof props.document !== "string")
    throw new Error(
      "A production-local obligation account requires one contract document.",
    );
  if (
    typeof props.account !== "string" ||
    !props.account.startsWith(`accounts/${props.layer}/`) ||
    !/^accounts\/[a-zA-Z]+\/[A-Za-z0-9][A-Za-z0-9._-]*\.md$/u.test(
      props.account,
    )
  )
    throw new Error(
      `A production-local obligation requires one normalized accounts/${props.layer}/<name>.md aggregate host address.`,
    );
  const populationFiles: string[] = createAutoMovieAuthoredPopulationFiles(
    props.layer,
    props.populationScope,
  );
  const base: AutoMovieProductionContractClaim = createAutoMovieProductionContractClaim(
    { ...props, files: populationFiles, symbol: "h2" },
    false,
  );
  return {
    ...createAutoMoviePopulationAccountClaim({
      name: base.name!,
      account: props.account,
      document: props.document,
      documentRoot: props.documentRoot ?? "docs",
      populationFiles,
      enabled: base.disabled !== true,
    }),
    autoMovieBinding: { ...base.autoMovieBinding, account: props.account },
  };
}
