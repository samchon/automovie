import {
  AutoMovieViolationKind,
  IAutoMovieConstraintViolation,
  IAutoMovieQuaternion,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { toValidation } from "./toValidation";
import { violation } from "./violation";

/** A direction this short or shorter carries no direction at all. */
const DIRECTION_EPSILON: number = 1e-12;

/** Largest deviation from unit norm a stated rotation may carry. */
const UNIT_QUATERNION_EPSILON: number = 1e-6;

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

  /**
   * Finite range check `[min, max]`; pushes a `range` violation unless `value`
   * is a finite number inside it. `value` is `unknown` so a field read off an
   * untyped payload is narrowed here rather than cast to `number` first.
   */
  public range(
    path: string,
    value: unknown,
    min: number,
    max: number,
    label: string = "value",
  ): void {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < min ||
      value > max
    )
      this.push(
        "range",
        path,
        `${label} must be a finite number within [${min}, ${max}], but was ${String(value)}`,
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
    this.finiteVector(path, value, label);
    const length: number = Vector3.length(value);
    if (Number.isFinite(length) && length <= DIRECTION_EPSILON)
      this.push("range", path, `${label} must be a non-zero direction`, value);
  }

  /**
   * Pushes one `range` violation at `<path>.<axis>` for each non-finite
   * component of a vector, worded `<label> <axis> must be finite, but was
   * <value>`.
   *
   * @param path Violation path of the checked vector.
   * @param value Vector whose three components must be finite.
   * @param label Name of the vector in the messages.
   *
   * @evidence contracts/common.md#principled-implementation `Number.isFinite` is exactly the test that excludes `NaN` and both infinities, the values no position or direction arithmetic can carry, and each axis is judged on its own so every bad component is named.
   * @evidence contracts/common.md#clear-and-simple-design The component rule `direction` and the building validators share, replacing the private `finiteVector` copies they kept with this same wording.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No axis, label or value is special-cased; the value is reported as given.
   * @evidence contracts/common.md#meaningful-documentation The documentation states the violation kind, the per-axis path, the message form, and each parameter's role.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Three finiteness tests, with no algorithm to choose.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Judges the components of one vector per call; validators call it once per vector they hold and share nothing between calls.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Appends at most three violations per call to `items`, which lives as long as the collector; nothing else is retained.
   */
  public finiteVector(
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
  }

  /**
   * Pushes a `range` violation at `path` unless a value is a finite number
   * strictly above zero; a missing value fails and is reported as `null`.
   *
   * @param path Violation path of the checked number.
   * @param value Number that must be finite and positive, or undefined.
   * @param label Name of the number in the message.
   *
   * @evidence contracts/common.md#principled-implementation One finiteness test and one strict comparison define the open interval `(0, Infinity)` that a length, scale or spacing must lie in; `undefined` fails because an optional field that a rule requires carries no value.
   * @evidence contracts/common.md#clear-and-simple-design The positivity rule the building validators share, replacing the private `positive` copies they kept with this same wording.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No label or value is special-cased, and zero is refused rather than tolerated as a degenerate size.
   * @evidence contracts/common.md#meaningful-documentation The documentation states the accepted interval, the missing-value case and how it is reported, and each parameter's role.
   * @evidenceExclude contracts/performance.md#efficient-algorithms One finiteness test and one comparison, with no algorithm to choose.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A check of one number per call, coordinating no work across requests.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Appends at most one violation per call to `items`, which lives as long as the collector; nothing else is retained.
   */
  public positive(
    path: string,
    value: number | undefined,
    label: string,
  ): void {
    if (value === undefined || !Number.isFinite(value) || value <= 0)
      this.push(
        "range",
        path,
        `${label} must be a finite number > 0, but was ${value}`,
        value ?? null,
      );
  }

  /**
   * Pushes a `range` violation at `path` when a quaternion's norm is not
   * finite or differs from 1 by more than `1e-6`, reporting the norm.
   *
   * @param path Violation path of the checked rotation.
   * @param value Quaternion that must be a unit rotation.
   * @param label Name of the rotation in the message.
   *
   * @evidence contracts/common.md#principled-implementation Only a unit quaternion is a pure rotation, so a stated rotation is accepted when its `Math.hypot` norm is within `1e-6` of 1, the drift a hand-written or serialized unit quaternion carries; a non-finite norm also fails, which covers any non-finite component.
   * @evidence contracts/common.md#clear-and-simple-design The unit-rotation rule the building validators share, replacing the private `unitQuaternion` copies they kept with this same wording and tolerance.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The tolerance is the one named constant for every caller, and no rotation is normalized to pass.
   * @evidence contracts/common.md#meaningful-documentation The documentation states the violation kind, the tolerance, the non-finite case, what the message reports, and each parameter's role.
   * @evidenceExclude contracts/performance.md#efficient-algorithms One four-component norm and one comparison, with no algorithm to choose.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A check of one rotation per call, coordinating no work across requests.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Appends at most one norm violation per call to `items`, held for the collector's lifetime; the computed norm is discarded on return.
   */
  public unitQuaternion(
    path: string,
    value: IAutoMovieQuaternion,
    label: string,
  ): void {
    const norm: number = Math.hypot(value.x, value.y, value.z, value.w);
    if (!Number.isFinite(norm) || Math.abs(norm - 1) > UNIT_QUATERNION_EPSILON)
      this.push(
        "range",
        path,
        `${label} must be a unit quaternion, but its norm was ${norm}`,
        value,
      );
  }

  /** Convert the accumulated violations to the canonical validation result. */
  public toValidation(): IAutoMovieValidation {
    return toValidation(this.items);
  }
}
