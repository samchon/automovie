import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieViolationKind } from "./AutoMovieViolationKind";
import type { IAutoMovieConstraintViolation } from "./IAutoMovieConstraintViolation";
import type { IAutoMovieValidation } from "./IAutoMovieValidation";

/** Mutable insertion-ordered finding storage shared by validation predicates. */
export interface IAutoMovieViolationCollector {
  /** Violations accumulated in insertion order. */
  readonly items: IAutoMovieConstraintViolation[];

  /** Append one canonical violation in the caller's traversal order. */
  push(
    kind: AutoMovieViolationKind,
    path: string,
    expected: string,
    value: unknown,
    overshoot?: number,
    severity?: "error" | "warning",
  ): void;

  /**
   * Push a `"warning"`-severity violation, physical-plausibility advice that
   * does not fail validation (see
   * {@link IAutoMovieConstraintViolation.severity}).
   */
  warn(
    kind: AutoMovieViolationKind,
    path: string,
    expected: string,
    value: unknown,
    overshoot?: number,
  ): void;

  /**
   * Finite range check `[min, max]`; pushes a `range` violation unless `value`
   * is a finite number inside it. `value` is `unknown` so a field read off an
   * untyped payload is narrowed here rather than cast to `number` first. Failed
   * string conversion changes only the diagnostic representation to `an
   * uninspectable value`; the finding retains the original value.
   */
  range(
    path: string,
    value: number,
    min: number,
    max: number,
    label?: string,
  ): void;

  /**
   * Pushes a `type` violation when `value` is empty or only whitespace; the
   * message is `<label> must be non-empty`.
   *
   * @param path Violation path of the checked string.
   * @param value String that must carry a non-whitespace character.
   * @param label Name of the field in the message.
   */
  nonEmpty(path: string, value: string, label: string): void;

  /**
   * Checks a direction that need not be unit length: one `range` violation at
   * `<path>.<axis>` per non-finite component, or, when every component is
   * finite, one at `path` if the length is `1e-12` or shorter.
   *
   * @param path Violation path of the checked vector.
   * @param value Direction to check; a finite measured length above 1e-12
   *   passes.
   * @param label Name of the direction in the messages.
   */
  direction(path: string, value: IAutoMovieVector3, label: string): void;

  /**
   * Pushes a `range` violation at `path` unless a value is a finite number
   * strictly above zero; a missing value fails and is reported as `null`.
   *
   * @param path Violation path of the checked number.
   * @param value Number that must be finite and positive, or undefined.
   * @param label Name of the number in the message.
   */
  positive(path: string, value: number | undefined, label: string): void;

  /**
   * Pushes a `range` violation at `path` when a quaternion's norm is not finite
   * or differs from 1 by more than `1e-6`, reporting the norm.
   *
   * @param path Violation path of the checked rotation.
   * @param value Quaternion that must be a unit rotation.
   * @param label Name of the rotation in the message.
   */
  unitQuaternion(
    path: string,
    value: IAutoMovieQuaternion,
    label: string,
  ): void;

  /**
   * Wrap the current findings with canonical severity folding and shared
   * storage.
   */
  toValidation(): IAutoMovieValidation;
}
