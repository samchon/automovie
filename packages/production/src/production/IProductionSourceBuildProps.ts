import type { IAutoMovieDefinedShotContract } from "@automovie/interface";
import type { IValidation } from "typia";


/**
 * Select an authored Node export, its supplied context and its result validator.
 *
 * Normalized source text records the attempt's provenance; Node resolves the resident module rather than executing that text buffer. The caller owns current-input fencing, project module eviction and deterministic-authoring obligations.
 *
 * @evidence contracts/common.md#principled-implementation Exact module/export selection, optional defineShot identity and a synchronous typia-compatible validator describe buildSourceExport's admission boundary; the type itself validates neither filesystem ownership nor authored effects.
 * @evidence contracts/common.md#clear-and-simple-design Diagnostic identity and source selection travel with their context and validator, while ordinary Node loading and the outer compiling attempt retain their distinct responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The source text is not a sandbox or executed snapshot; arbitrary context and validator callbacks remain caller-supplied capabilities, and currentness is not inferred from a matching path.
 * @evidence contracts/common.md#meaningful-documentation Defines diagnostic labels, resident module/export selection, provenance text, context, physical root, optional registration and synchronous result admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased input interface selects no runtime algorithm; buildSourceExport pays loader, authored computation, contract encoding and validator costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration establishes no equivalence across changed module bytes, context, owner registration or validator behavior; the compiling attempt owns module-cache invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns referenced context, registration and validator until evaluation completes; this erased type opens no resource and does not release authored tasks or Node cache entries.
 * @author Samchon
 */
export interface IProductionSourceBuildProps<T> {
  /** Diagnostic address of the selected shot or film. */
  target: string;

  /** Human description of the expected synchronous result in refusal messages. */
  label: string;

  /** Selected module path resolved against sourceRoot by Node. */
  path: string;

  /** Exact named registration whose build member is invoked. */
  exportName: string;

  /** Observed normalized bytes as text for provenance; Node loads the file. */
  source: string;

  /** Caller-owned context passed unchanged as the build argument. */
  context: unknown;

  /** Physical project root used by Node's ordinary module resolver. */
  sourceRoot: string;

  /** Expected source-owned defineShot registration, for one shot module. */
  registration?: {
    /** Required shot id matched before executing build. */
    id: string;

    /** Measurable design contract compared through canonical JSON identity. */
    contract: IAutoMovieDefinedShotContract;
  };

  /**
   * Admit the actual authored return value through the caller's synchronous schema.
   *
   * buildSourceExport invokes this after registration and object-thenable checks, with the props object as receiver. A successful result supplies validated data; failure supplies schema findings, and thrown validation values enter the loader's execution-failure boundary.
   *
   * @evidence contracts/common.md#principled-implementation IValidation's success/data or failure/errors result describes the selected validator's schema decision over the actual unknown return value. Current shot/film providers supply typia validation; this erased signature implements no checks and cannot prove arbitrary caller validators truthful.
   * @evidence contracts/common.md#clear-and-simple-design The callback owns returned-value shape admission while the loader owns Node execution, registration identity and diagnostic projection, preserving a single schema owner rather than duplicating its predicates.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The real value is passed unchanged with the original props receiver; no fixture result or expected answer is substituted. Validator effects and exceptions remain caller-owned, and schema success is not proof of deterministic effects or physical publication.
   * @evidence contracts/common.md#meaningful-documentation States invocation order, receiver, actual input, success/failure result use, provider ownership and thrown-validation handling.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This bodyless method signature selects no algorithm; the supplied validator pays its complete input/schema traversal and arbitrary callback effects during loader evaluation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature defines no result cache or equivalence key across changed values or validator behavior; the loader invokes the current callback for each actual build result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the validator capability and the compiling attempt owns its validation result until data/errors are projected; this erased declaration acquires no handle, task or retained population.
   */
  validate(input: unknown): IValidation<T>;
}
