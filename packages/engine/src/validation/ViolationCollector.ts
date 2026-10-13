import {
  AutoMovieViolationKind,
  IAutoMovieConstraintViolation,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { toValidation } from "./toValidation";
import { violation } from "./violation";

/** A direction this short or shorter carries no direction at all. */
const DIRECTION_EPSILON: number = 1e-12;

/**
 * A small append-only sink for violations, so each validator can push with a
 * stable path prefix without threading arrays through every call.
 */
export class ViolationCollector {
  /** Violations accumulated in insertion order. */
  public readonly items: IAutoMovieConstraintViolation[] = [];

  /** Append one violation to the collector. */
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

  /** Finite range check `[min, max]`; pushes a `range` violation if outside. */
  public range(
    path: string,
    value: number,
    min: number,
    max: number,
    label = "value",
  ): void {
    if (!Number.isFinite(value) || value < min || value > max)
      this.push(
        "range",
        path,
        `${label} must be a finite number within [${min}, ${max}], but was ${value}`,
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
   *
   * @evidence contracts/common.md#principled-implementation `String.prototype.trim` removes every ECMAScript whitespace and line terminator, so a zero trimmed length is exactly a string with no visible content.
   * @evidence contracts/common.md#clear-and-simple-design The blank-string rule lives on the collector the validators already hold, replacing the private `nonEmpty` helpers the analysis validators each declared with the same message.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No field or label is special-cased; the value is reported unchanged, untrimmed, so a reader sees what was authored.
   * @evidence contracts/common.md#meaningful-documentation The documentation states the violation kind, the condition, and the message form, and each parameter states its role.
   * @evidenceExclude contracts/performance.md#efficient-algorithms One trim and one length test, with no algorithm to choose.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A check of one string per call, coordinating no work across requests.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The trimmed copy is released on return; a refused value is appended to `items`, which grows by at most one entry per call and lives as long as the collector.
   */
  public nonEmpty(path: string, value: string, label: string): void {
    if (value.trim().length === 0)
      this.push("type", path, `${label} must be non-empty`, value);
  }

  /**
   * Checks a direction that need not be unit length: one `range` violation at
   * `<path>.<axis>` per non-finite component, or, when every component is
   * finite, one at `path` if the length is `1e-12` or shorter.
   *
   * @param path Violation path of the checked vector.
   * @param value Direction to check; any finite non-zero length passes.
   * @param label Name of the direction in the messages.
   *
   * @evidence contracts/common.md#principled-implementation Checks each component with `Number.isFinite`, then measures the length with `Vector3.length`, which stays accurate for extreme finite components, and refuses a length at or below `1e-12` because such a vector carries no reliable direction; a non-finite length is skipped because its component violation already names the fault.
   * @evidence contracts/common.md#clear-and-simple-design The direction rule lives on the collector so the environment-context and solid-plane validators share one wording and one floor instead of each keeping a private copy.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The `1e-12` floor is a named constant for every caller, and no axis or label is special-cased.
   * @evidence contracts/common.md#meaningful-documentation The documentation states the violation kind, the per-axis paths, the length floor and when it is skipped, and each parameter states its role.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Three finiteness tests and one vector length, with no algorithm to choose.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A check of one vector per call, coordinating no work across requests.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Appends at most three violations per call to `items`, three non-finite axes or one short length,, which lives as long as the collector; nothing else is retained.
   */
  public direction(
    path: string,
    value: IAutoMovieVector3,
    label: string,
  ): void {
    for (const axis of ["x", "y", "z"] as const)
      if (!Number.isFinite(value[axis]))
        this.push(
          "range",
          `${path}.${axis}`,
          `${label} ${axis} must be finite, but was ${value[axis]}`,
          value[axis],
        );
    const length: number = Vector3.length(value);
    if (Number.isFinite(length) && length <= DIRECTION_EPSILON)
      this.push("range", path, `${label} must be a non-zero direction`, value);
  }

  /** Convert the accumulated violations to the canonical validation result. */
  public toValidation(): IAutoMovieValidation {
    return toValidation(this.items);
  }
}
