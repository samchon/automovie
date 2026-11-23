import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieViolationKind } from "./AutoMovieViolationKind";
import type { IAutoMovieConstraintViolation } from "./IAutoMovieConstraintViolation";
import type { IAutoMovieValidation } from "./IAutoMovieValidation";

/**
 * Mutable insertion-ordered finding storage shared by validation predicates.
 *
 * @evidence contracts/development/design.md#principled-representation Canonical violation construction and toValidation severity folding preserve warning-only success and error failure, with field-specific predicates appending in call order.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A shared collector eliminates repeated array threading and common scalar/vector/rotation policies; callers supply their own paths and semantic limits.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The public items array is mutable and returned validation aliases it, so append-only usage is a caller discipline rather than enforced immutable publication; no severity or offending value is silently repaired.
 * @evidence contracts/development/common.md#meaningful-documentation Documents insertion order, public mutable storage, shared result ownership and error-versus-warning folding, with no automatic freeze or population ceiling.
 */
export interface IAutoMovieViolationCollector {
  /** Violations accumulated in insertion order. */
  readonly items: IAutoMovieConstraintViolation[];

  /**
   * Append one canonical violation in the caller's traversal order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States insertion order, default error severity and the retained offending-value reference.
   */
  push(
    kind: AutoMovieViolationKind,
    path: string,
    expected: string,
    value: unknown,
    overshoot?: number,
    severity?: "error" | "warning",
  ): void;

  /**
   * Push a `"warning"`-severity violation, physical-plausibility advice that does not fail validation (see {@link IAutoMovieConstraintViolation.severity}).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names warning severity, unchanged caller fields and the successful-warning envelope produced by toValidation.
   */
  warn(
    kind: AutoMovieViolationKind,
    path: string,
    expected: string,
    value: unknown,
    overshoot?: number,
  ): void;

  /**
   * Finite range check `[min, max]`; pushes a `range` violation unless `value` is a finite number inside it. `value` is `unknown` so a field read off an untyped payload is narrowed here rather than cast to `number` first. Failed string conversion changes only the diagnostic representation to `an uninspectable value`; the finding retains the original value.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States closed endpoints, finite tested values, range-kind result, the unknown-input shape check and the representation fallback without changing the retained value.
   */
  range(
    path: string,
    value: unknown,
    min: number,
    max: number,
    label?: string,
  ): void;

  /**
   * Pushes a `type` violation when `value` is empty or only whitespace; the message is `<label> must be non-empty`.
   *
   * @param path Violation path of the checked string.
   * @param value String that must carry a non-whitespace character.
   * @param label Name of the field in the message.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The documentation states the violation kind, the condition, and the message form, and each parameter states its role.
   */
  nonEmpty(path: string, value: string, label: string): void;

  /**
   * Checks a direction that need not be unit length: one `range` violation at `<path>.<axis>` per non-finite component, or, when every component is finite, one at `path` if the length is `1e-12` or shorter.
   *
   * @param path Violation path of the checked vector.
   * @param value Direction to check; a finite measured length above 1e-12 passes.
   * @param label Name of the direction in the messages.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The documentation states the violation kind, the per-axis paths, the length floor and when it is skipped, and each parameter states its role.
   */
  direction(path: string, value: IAutoMovieVector3, label: string): void;

  /**
   * Pushes one `range` violation at `<path>.<axis>` for each non-finite component of a vector, worded `<label> <axis> must be finite, but was <value>`.
   *
   * @param path Violation path of the checked vector.
   * @param value Vector whose three components must be finite.
   * @param label Name of the vector in the messages.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The documentation states the violation kind, the per-axis path, the message form, and each parameter's role.
   */
  finiteVector(path: string, value: IAutoMovieVector3, label: string): void;

  /**
   * Pushes a `range` violation at `path` unless a value is a finite number strictly above zero; a missing value fails and is reported as `null`.
   *
   * @param path Violation path of the checked number.
   * @param value Number that must be finite and positive, or undefined.
   * @param label Name of the number in the message.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The documentation states the accepted interval, the missing-value case and how it is reported, and each parameter's role.
   */
  positive(path: string, value: number | undefined, label: string): void;

  /**
   * Pushes a `range` violation at `path` when a quaternion's norm is not finite or differs from 1 by more than `1e-6`, reporting the norm.
   *
   * @param path Violation path of the checked rotation.
   * @param value Quaternion that must be a unit rotation.
   * @param label Name of the rotation in the message.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The documentation states the violation kind, the tolerance, the non-finite case, what the message reports, and each parameter's role.
   */
  unitQuaternion(
    path: string,
    value: IAutoMovieQuaternion,
    label: string,
  ): void;

  /**
   * Wrap the current findings with canonical severity folding and shared storage.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents empty, warning and failure outcomes plus shared mutable ownership instead of promising an immutable snapshot.
   */
  toValidation(): IAutoMovieValidation;
}
