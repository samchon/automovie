import { AutoMovieDiagnosticCode, IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Constructs the existing error diagnostic with explicit code/message, default compile phase and fixed null path.
 *
 * @evidence contracts/common.md#principled-implementation Constructs the existing error diagnostic with explicit code/message, default compile phase and fixed null path.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original service value/admission operation; project lookup, dispatch and publication sequencing remain with the service coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation The returned compact record retains strings only and owns no renderer/provider resources.
 * @evidence contracts/performance.md#efficient-algorithms Constant record construction preserves the original protocol without parsing prose or inventing recovery success.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned compact record retains strings only and owns no renderer/provider resources.
 */
export const productionRepaintServiceDiagnostic: (code: AutoMovieDiagnosticCode, target: string, message: string, phase?: IAutoMovieDiagnostic["phase"]) => IAutoMovieDiagnostic = (
  code: AutoMovieDiagnosticCode,
  target: string,
  message: string,
  phase: IAutoMovieDiagnostic["phase"] = "compile",
): IAutoMovieDiagnostic => ({
  code,
  category: "error",
  phase,
  target,
  path: null,
  message,
});
