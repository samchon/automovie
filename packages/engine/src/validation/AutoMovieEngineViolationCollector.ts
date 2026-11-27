import {
  AutoMovieViolationKind,
  IAutoMovieConstraintViolation,
  IAutoMovieQuaternion,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { describeInvalidValue } from "./describeInvalidValue";
import { directionLength } from "./internal/directionLength";
import { toValidation } from "./toValidation";
import { violation } from "./violation";

/** Largest deviation from unit norm a stated rotation may carry. */
const UNIT_QUATERNION_EPSILON: number = 1e-6;

/** Mutable insertion-ordered finding storage shared by validation predicates. */
export class AutoMovieEngineViolationCollector {
  /** Violations accumulated in insertion order. */
  public readonly items: IAutoMovieConstraintViolation[] = [];

  /** Append one canonical violation in the caller's traversal order. */
  public push(
    kind: AutoMovieViolationKind,
    path: string,
    expected: string,
    value: unknown,
    overshoot?: number,
    severity: "error" | "warning" = "error",
  ): void {
    this.items.push(
      violation(kind, path, expected, value, overshoot, severity),
    );
  }

  /**
   * Push a `"warning"`-severity violation, physical-plausibility advice that
   * does not fail validation (see
   * {@link IAutoMovieConstraintViolation.severity}).
   */
  public warn(
    kind: AutoMovieViolationKind,
    path: string,
    expected: string,
    value: unknown,
    overshoot?: number,
  ): void {
    this.push(kind, path, expected, value, overshoot, "warning");
  }

  /**
   * Range check `[min, max]`; pushes a `range` violation unless `value` lies
   * inside it.
   */
  public range(
    path: string,
    value: number,
    min: number,
    max: number,
    label: string = "value",
  ): void {
    if (!(value >= min && value <= max))
      this.push(
        "range",
        path,
        `${label} must be within [${min}, ${max}], but was ${describeInvalidValue(value)}`,
        value,
      );
  }

  /**
   * Pushes a `type` violation when `value` is empty or only whitespace; the
   * message is `<label> must be non-empty`.
   *
   * @param path Violation path of the checked string.
   * @param value String that must carry a non-whitespace character.
   * @param label Name of the field in the message.
   */
  public nonEmpty(path: string, value: string, label: string): void {
    if (value.trim().length === 0)
      this.push("type", path, `${label} must be non-empty`, value);
  }

  /**
   * Report one range violation if the direction has no representable norm
   * above the minimum.
   *
   * @param path Violation path of the checked vector.
   * @param value Direction to check. A representable norm above 1e-12 passes.
   * @param label Name of the direction in the messages.
   */
  public direction(
    path: string,
    value: IAutoMovieVector3,
    label: string,
  ): void {
    if (directionLength(value) === null)
      this.push(
        "range",
        path,
        `${label} must have a finite length greater than ${directionLength.MINIMUM}`,
        value,
      );
  }

  /**
   * Pushes a `range` violation at `path` unless a value is a finite number
   * strictly above zero; a missing value fails and is reported as `null`.
   *
   * @param path Violation path of the checked number.
   * @param value Number that must be finite and positive, or undefined.
   * @param label Name of the number in the message.
   */
  public positive(
    path: string,
    value: number | undefined,
    label: string,
  ): void {
    if (value === undefined || value <= 0)
      this.push(
        "range",
        path,
        `${label} must be a finite number > 0, but was ${value}`,
        value ?? null,
      );
  }

  /**
   * Pushes a `range` violation at `path` when a quaternion's norm is not finite
   * or differs from 1 by more than `1e-6`, reporting the norm.
   *
   * @param path Violation path of the checked rotation.
   * @param value Quaternion that must be a unit rotation.
   * @param label Name of the rotation in the message.
   */
  public unitQuaternion(
    path: string,
    value: IAutoMovieQuaternion,
    label: string,
  ): void {
    const norm: number = Math.hypot(value.x, value.y, value.z, value.w);
    if (Math.abs(norm - 1) > UNIT_QUATERNION_EPSILON)
      this.push(
        "range",
        path,
        `${label} must be a unit quaternion, but its norm was ${norm}`,
        value,
      );
  }

  /**
   * Wrap the current findings with canonical severity folding and shared
   * storage.
   */
  public toValidation(): IAutoMovieValidation {
    return toValidation(this.items);
  }
}
