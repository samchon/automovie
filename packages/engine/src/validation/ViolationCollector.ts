import { AutoMovieViolationKind, IAutoMovieConstraintViolation, IAutoMovieQuaternion, IAutoMovieValidation, IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";
import { toValidation } from "./toValidation";
import { violation } from "./violation";
/** A direction this short or shorter carries no direction at all. */
const DIRECTION_EPSILON: number = 1e-12;

/** Largest deviation from unit norm a stated rotation may carry. */
const UNIT_QUATERNION_EPSILON: number = 1e-6;

/**
 * Mutable insertion-ordered finding storage shared by validation predicates.
 *
 * @evidence contracts/common.md#principled-implementation Canonical violation construction and toValidation severity folding preserve warning-only success and error failure, with field-specific predicates appending in call order.
 * @evidence contracts/common.md#clear-and-simple-design A shared collector eliminates repeated array threading and common scalar/vector/rotation policies; callers supply their own paths and semantic limits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The public items array is mutable and returned validation aliases it, so append-only usage is a caller discipline rather than enforced immutable publication; no severity or offending value is silently repaired.
 * @evidence contracts/common.md#meaningful-documentation Documents insertion order, public mutable storage, shared result ownership and error-versus-warning folding, with no automatic freeze or population ceiling.
 * @evidence contracts/performance.md#efficient-algorithms Individual predicates have scalar/string costs, appending F findings uses O(F) storage, and toValidation scans until an error or the end; labels and retained offending values add their own size.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical scalar/vector/quaternion methods and violation/result owners serve all gates; mutable value verdicts are not cached across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The collector and its aliased result own the same finding array for as long as callers retain it, including referenced offending objects; no external handle is acquired or released by this sink.
 * @author Samchon
 */
export class ViolationCollector {
  /** Violations accumulated in insertion order. */
  public readonly items: IAutoMovieConstraintViolation[] = [];

  /**
   * Append one canonical violation in the caller's traversal order.
   *
   * @evidence contracts/common.md#principled-implementation Delegates kind, path, expectation, offending value, optional overshoot and severity to violation without altering their numerical or reporting meaning.
   * @evidence contracts/common.md#clear-and-simple-design The collector owns insertion and the canonical constructor owns record shape, so validators retain only their field-specific decisions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No value coercion, severity promotion, path repair or deduplication suppresses the supplied finding.
   * @evidence contracts/common.md#meaningful-documentation States insertion order, default error severity and the retained offending-value reference.
   * @evidence contracts/performance.md#efficient-algorithms One record construction and amortized array append take constant work, excluding caller-prepared strings and retained value size.
   * @evidence contracts/performance.md#reuse-equivalent-work All collector predicates reuse the same constructor and insertion operation rather than independent finding schemas.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The finding and offending reference remain in public items and any aliased validation result until callers discard or mutate them; no host resource is acquired.
   */
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
   *
   * @evidence contracts/common.md#principled-implementation Delegates the exact supplied finding to push with severity=warning, retaining optional measured overshoot without failing warning-only canonical validation.
   * @evidence contracts/common.md#clear-and-simple-design Physical advice uses the same finding shape and ordered collector as structural errors, with severity expressing its different consequence.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No physics-intent interpretation or automatic suppression occurs here; the detector decides whether to call this method.
   * @evidence contracts/common.md#meaningful-documentation Names warning severity, unchanged caller fields and the successful-warning envelope produced by toValidation.
   * @evidence contracts/performance.md#efficient-algorithms One delegation and append take constant additional work beyond constructing the supplied finding text.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses push and violation instead of a parallel warning record or separate retention list.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The shared items array retains the warning and offending value; this method adds no callback, task or independent storage owner.
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
   *
   * @evidence contracts/common.md#principled-implementation Type and Number.isFinite checks precede inclusive min/max comparisons; internal infinite bounds are permitted while the tested value must be finite.
   * @evidence contracts/common.md#clear-and-simple-design The shared collector supplies one unknown-scalar interval policy while each gate supplies the field path, label and bounds.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid values are reported unchanged rather than clamped or coerced; bounds are caller policy and are not reordered here.
   * @evidence contracts/common.md#meaningful-documentation States closed endpoints, finite tested values, range-kind result and the unknown-input shape check.
   * @evidence contracts/performance.md#efficient-algorithms Fixed scalar checks take constant work; only refusal renders the value and allocates its message and finding.
   * @evidence contracts/performance.md#reuse-equivalent-work One interval predicate serves distinct fields without memoizing mutable input values or rebuilding an admission table.
   * @evidence contracts/performance.md#bound-retention-and-release-resources At most one finding retains the offending value in items; accepted values acquire no storage or host resource.
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
   * @evidence contracts/common.md#principled-implementation String.prototype.trim removes ECMAScript whitespace and line terminators, so zero trimmed length denotes an empty or whitespace-only string; non-whitespace invisible characters are not refused by this rule.
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
   * @param value Direction to check; a finite measured length above 1e-12 passes.
   * @param label Name of the direction in the messages.
   *
   * @evidence contracts/common.md#principled-implementation Checks each component with Number.isFinite, then uses Vector3.length and refuses a finite length at or below 1e-12. A nonfinite measured length is skipped; finite components can still overflow the representable norm, so this is not a finite-normalized-output certificate.
   * @evidence contracts/common.md#clear-and-simple-design The direction rule lives on the collector so the environment-context and solid-plane validators share one wording and one floor instead of each keeping a private copy.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The `1e-12` floor is a named constant for every caller, and no axis or label is special-cased.
   * @evidence contracts/common.md#meaningful-documentation The documentation states the violation kind, the per-axis paths, the length floor and when it is skipped, and each parameter states its role.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Three finiteness tests and one vector length, with no algorithm to choose.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A check of one vector per call, coordinating no work across requests.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Appends at most three violations per call to items, either non-finite axes or one short length, held for the collector's lifetime; nothing else is retained.
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

  /**
   * Wrap the current findings with canonical severity folding and shared storage.
   *
   * @evidence contracts/common.md#principled-implementation toValidation scans for any error, otherwise returns warning-only success or empty clean success; a nonempty result aliases this collector's items array.
   * @evidence contracts/common.md#clear-and-simple-design Severity meaning has one canonical owner and the collector only supplies its accumulated insertion-ordered population.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Findings are neither sorted nor filtered, and publication does not freeze or clone items; later caller mutation remains observable through an aliased result.
   * @evidence contracts/common.md#meaningful-documentation Documents empty, warning and failure outcomes plus shared mutable ownership instead of promising an immutable snapshot.
   * @evidence contracts/performance.md#efficient-algorithms F findings require at most O(F) scanning with early error exit and one fixed wrapper allocation; no finding copy is made.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the same severity fold all standalone validator arrays use, with no cached result that could conceal later items mutation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Caller and collector share the nonempty result array and offending references until released; an empty wrapper retains no array or external handle.
   */
  public toValidation(): IAutoMovieValidation {
    return toValidation(this.items);
  }
}
