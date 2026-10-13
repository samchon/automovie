import {
  AutoMovieViolationKind,
  IAutoMovieConstraintViolation,
  IAutoMovieValidation,
} from "@automovie/interface";

import { toValidation } from "./toValidation";
import { violation } from "./violation";

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

  /** Convert the accumulated violations to the canonical validation result. */
  public toValidation(): IAutoMovieValidation {
    return toValidation(this.items);
  }
}
