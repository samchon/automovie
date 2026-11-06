import type { IAutoMovieHumanParameters } from "../../src/structures/IAutoMovieHumanParameters";
import { HumanDebugViewParts } from "./HumanDebugViewParts";

/**
 * One page's latest comparison source definition, borrowed by its read-only display
 * consumers. Reference crops and styles do not change the person's inputs, so
 * they reuse these view parts while rebuilding their own reference display.
 *
 * @evidence contracts/common.md#principled-implementation Memoizes one completed source definition by alias/full plain input value; changed inputs, another alias or a new page's source rebuild it. Final realization remains not-run.
 * @evidence contracts/common.md#clear-and-simple-design Keeps generation reuse beside the comparison loader, separate from reference filtering, shading and measurements.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no fixture selector, operator replacement or alternate construction; the existing producer runs unchanged on a miss.
 * @evidence contracts/common.md#meaningful-documentation States borrowed read-only ownership, equivalence, source exceptions, not-run final realization and the page lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Compares O(P) serialized input bytes instead of repeating the body and head construction; reference geometry and deviation costs remain with their own loader.
 * @evidence contracts/performance.md#reuse-equivalent-work Alias and a full input snapshot establish equivalence within one loaded module graph. ViewCurves, ReferencePieces and ViewDeviation only read the stored part and section records; a hit needs no new source assembly.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One page-owned instance retains at most one input string and one person's raw source parts, proportional to its sections and controls. Replacement or a thrown definition releases the old entry; page unload releases the instance. It owns no GPU resources or handles.
 */
export class HumanDebugViewPartsCache {
  /** Latest complete result; callers borrow its records without mutating them. */
  private latest: {
    alias: string;
    input: string;
    value: HumanDebugViewParts.IOutput;
  } | null = null;

  /**
   * Read a source definition for one alias and current input value. Ordinary
   * source diagnostics remain visible and cacheable. A source exception
   * propagates without preserving stale records; final joins are not run.
   *
   * @param alias The viewer's selected person name.
   * @param parameters Current public inputs, including nested optional fields.
   * @returns The existing producer's raw parts, borrowed read-only.
   *
   * @evidence contracts/common.md#principled-implementation Serializes typed plain JSON inputs with finite numbers, detecting nested edits. Visited nonfinite numbers and unsupported JSON values bypass retention, so NaN/Infinity cannot collide with null. Property-order changes can conservatively miss. Date.toJSON and arbitrary runtime objects are outside this typed-domain guarantee.
   * @evidence contracts/common.md#clear-and-simple-design A single entry replaces the previous person rather than accumulating a population or reference-specific copies.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Source diagnostics are not removed or presented as final acceptance; a thrown source definition prevents retention.
   * @evidence contracts/common.md#meaningful-documentation Names equivalence, borrowed ownership and source-definition versus not-run final realization.
   * @evidence contracts/performance.md#efficient-algorithms A hit scans only the bounded input record; a miss runs the existing construction once, then retains its result without copying the geometry.
   * @evidence contracts/performance.md#reuse-equivalent-work Reference pack bytes, crop, style and camera are excluded because none reaches HumanDebugViewParts.of; their consumers still run on every comparison load.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Clears the previous entry before defining, so an exception cannot preserve stale source records; one completed definition remains until replacement or page unload.
   */
  public get(
    alias: string,
    parameters: IAutoMovieHumanParameters,
  ): HumanDebugViewParts.IOutput {
    let reusable: boolean = true;
    let input: string;
    try {
      input = JSON.stringify(
        parameters,
        (_key: string, value: unknown): unknown => {
          const kind: string = typeof value;
          if (
            (kind === "number" && !Number.isFinite(value)) ||
            !["object", "number", "string", "boolean"].includes(kind)
          )
            reusable = false;
          if (
            value !== null &&
            kind === "object" &&
            !Array.isArray(value) &&
            Object.getPrototypeOf(value) !== Object.prototype
          )
            reusable = false;
          return value;
        },
      );
    } catch (error: unknown) {
      this.latest = null;
      throw error;
    }
    if (reusable && this.latest?.alias === alias && this.latest.input === input)
      return this.latest.value;

    this.latest = null;
    const value: HumanDebugViewParts.IOutput =
      HumanDebugViewParts.of(parameters);
    if (reusable) this.latest = { alias, input, value };
    return value;
  }
}
