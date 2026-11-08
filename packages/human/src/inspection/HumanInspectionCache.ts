import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { HumanInspectionParts } from "./HumanInspectionParts";
import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import { HumanInspectionPattern } from "./HumanInspectionPattern";

/** One input's production context and derived observations; all records borrow the same source owners. */
interface IEntry {
  /** Public example identity. */
  alias: string;
  /** Full finite plain input serialization. */
  input: string;
  /** Direct common definitions and requested source factories; explicit full preparation adds actual head/bind records. */
  prepared: AutoMovieHumanBodyLaw.IOriginal;
  /** Actual assembled source tree, retained without demanding its lazy raw getters. */
  definition: AutoMovieHumanBodyLaw.IDefinition | null;
  /** Completed full source observation, not final realization. */
  full: HumanInspectionParts.IOutput | null;
  /** Latest requested original observation with explicit unassembled-tree scope. */
  scoped: HumanInspectionParts.IOutput | null;
}

/**
 * One page's latest canonical production context, borrowed by its display
 * consumers. Reference crops and styles do not change the person's inputs, so
 * they reuse these view parts while rebuilding their own reference display.
 *
 * @evidence contracts/common.md#principled-implementation Memoizes one canonical context by alias/full plain input, with separate scoped/full observations and producer-owned lazy raw results. Changed inputs, alias or page replace it; final realization remains not-run.
 * @evidence contracts/common.md#clear-and-simple-design Keeps generation reuse beside the comparison loader, separate from reference filtering, shading and measurements.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no fixture, operator replacement or alternate construction. Scoped work uses the same prepared source factories and named raw supplier that full production consumes; tree requests retain the full path.
 * @evidence contracts/common.md#meaningful-documentation States borrowed read-only ownership, equivalence, source exceptions, not-run final realization and the page lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Compares O(P) serialized input bytes instead of repeating the body and head construction; reference geometry and deviation costs remain with their own loader.
 * @evidence contracts/performance.md#reuse-equivalent-work Alias/full input establish equivalence within one loaded module graph. Original/raw/full stages share the identical production context; a new named raw request uses its once-only supplier, while display readers borrow existing records.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One page instance retains one input string/context and at most two observation wrappers over its source references. Requested raw results belong to that context. Replacement or an exception releases the entry; page unload releases the instance. It owns no GPU resource or handle.
 */
export class HumanInspectionCache {
  /** Latest canonical context and completed observations; display callers borrow their records. */
  private latest: IEntry | null = null;

  /**
   * Read a source definition for one alias and current input value. Ordinary
   * source diagnostics remain visible and cacheable. A source exception
   * propagates without preserving stale records; final joins are not run.
   *
   * @param alias The viewer's selected person name.
   * @param parameters Current public inputs, including nested optional fields.
   * @param patterns Named/glob selections and standalone '*' choose actual originals; tree explicitly requests production assembly.
   * @param raw Request the selected actual raw results from that same production context.
   * @returns The existing producer's raw parts, borrowed read-only.
   *
   * @evidence contracts/common.md#principled-implementation Serializes typed plain JSON inputs with finite numbers, detecting nested edits. Visited nonfinite numbers and unsupported JSON values bypass retention, so NaN/Infinity cannot collide with null. Property-order changes can conservatively miss. Date.toJSON and arbitrary runtime objects are outside this typed-domain guarantee.
   * @evidence contracts/common.md#clear-and-simple-design A single entry replaces the previous person rather than accumulating a population or reference-specific copies.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Source diagnostics are not removed or presented as final acceptance; a thrown source definition prevents retention.
   * @evidence contracts/common.md#meaningful-documentation Names equivalence, borrowed ownership and source-definition versus not-run final realization.
   * @evidence contracts/performance.md#efficient-algorithms A retained original observation scans the input and copies request metadata. Missing stages prepare their actual factories; raw requests scan observed names and use once-only named loft suppliers. Canonical preparation is not constant-time on a miss.
   * @evidence contracts/performance.md#reuse-equivalent-work Reference bytes, crop, style and camera are excluded from canonical source identity; their display consumers still own their work. Scope changes borrow the same context, while full-tree requests cannot adopt a partial tree.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Clears the published entry before stage work so an exception cannot preserve stale success. One context and its scoped/full wrappers remain until replacement or page unload; original thrown objects propagate unchanged.
   */
  public get(
    alias: string,
    parameters: IAutoMovieHumanParameters,
    patterns: readonly string[] = ["*"],
    raw: boolean = false,
    treeOnly: boolean = false,
  ): HumanInspectionParts.IOutput {
    const { input, reusable }: { input: string; reusable: boolean } = this.identity(parameters);
    const stage: "scoped" | "full" =
      treeOnly || patterns.includes("tree")
        ? "full"
        : "scoped";
    const previous: IEntry | null =
      reusable && this.latest?.alias === alias && this.latest.input === input
        ? this.latest
        : null;
    const stored: HumanInspectionParts.IOutput | null = previous?.[stage] ?? null;
    const observedScope: HumanInspectionParts.IOutput["observation"]["scope"] = stored?.observation.scope;
    const kept: HumanInspectionParts.IOutput | null = stored !== null && (stage === "full" || observedScope !== undefined && observedScope.requested.length === patterns.length && observedScope.requested.every((pattern: string, i: number): boolean => pattern === patterns[i])) ? stored : null;
    if (kept !== null && stage === "full" && !raw) return kept;
    if (kept !== null && !raw)
      return this.scoped({
        ...kept,
        sourceAcquisition: {
          canonicalMilliseconds: 0,
          observationMilliseconds: 0,
          rawMilliseconds: 0,
          canonicalReused: true,
          observationReused: true,
          rawRequested: false,
        },
      }, patterns);

    this.latest = null;
    try {
      const started: number = performance.now();
      const original: AutoMovieHumanBodyLaw.IOriginal =
        previous?.prepared ?? AutoMovieHumanBodyLaw.prepareSources(parameters);
      const full: AutoMovieHumanBodyLaw.IPrepared | null = stage === "full"
        ? previous?.definition?.prepared ?? AutoMovieHumanBodyLaw.prepare(parameters, original)
        : null;
      const prepared: AutoMovieHumanBodyLaw.IOriginal = full ?? original;
      const canonical: number = performance.now();
      const definition: AutoMovieHumanBodyLaw.IDefinition | null = full === null
        ? previous?.definition ?? null
        : previous?.definition ?? AutoMovieHumanBodyLaw.define(parameters, full);
      let value: HumanInspectionParts.IOutput = stage === "scoped"
        ? HumanInspectionParts.scoped(prepared, patterns)
        : HumanInspectionParts.of(parameters, definition!.prepared, definition!);
      const observed: number = performance.now();
      if (raw) {
        const tree: Set<string> | null = treeOnly ? new Set(value.observation.treeParts) : null;
        for (const part of value.parts)
          if ((tree === null || tree.has(part.name)) && HumanInspectionPattern.matches(part.name, patterns, ""))
            HumanInspectionParts.loft(prepared, part.name, stage === "scoped" ? patterns : undefined);
        value = stage === "scoped" ? HumanInspectionParts.scoped(prepared, patterns) : HumanInspectionParts.of(parameters, definition!.prepared, definition!);
      }
      const rawRead: number = performance.now();
      value = { ...value, sourcePreparation: { ...prepared.milliseconds } };
      if (reusable)
        this.latest = {
          alias,
          input,
          prepared,
          definition,
          full: stage === "full" ? value : raw ? null : previous?.full ?? null,
          scoped: stage === "scoped" ? value : raw ? null : previous?.scoped ?? null,
        };
      if (stage === "full") return value;
      return this.scoped({
        ...value,
        sourceAcquisition: {
          canonicalMilliseconds: canonical - started,
          observationMilliseconds: observed - canonical,
          rawMilliseconds: raw ? rawRead - observed : 0,
          canonicalReused: previous !== null,
          observationReused: false,
          rawRequested: raw,
        },
      }, patterns);
    } catch (error: unknown) {
      this.latest = null;
      throw error;
    }
  }

  /**
   * Explicit common neck demand for adjoining original producers. It prepares
   * no head part, legacy cut/seat, trunk, body skeleton, raw chain or tree.
   * The existing one-input cache then lets the actual native providers borrow
   * the same generating owner, without obtaining it from a finished S00.
   */
  public neck(alias: string, parameters: IAutoMovieHumanParameters): ReturnType<AutoMovieHumanBodyLaw.IOriginal["common"]> {
    const { input, reusable }: { input: string; reusable: boolean } = this.identity(parameters);
    const previous: IEntry | null = reusable && this.latest?.alias === alias && this.latest.input === input ? this.latest : null;
    this.latest = null;
    try {
      const prepared: AutoMovieHumanBodyLaw.IOriginal = previous?.prepared ?? AutoMovieHumanBodyLaw.prepareSources(parameters);
      const shared: ReturnType<AutoMovieHumanBodyLaw.IOriginal["common"]> = prepared.common();
      if (reusable) this.latest = previous ?? { alias, input, prepared, definition: null, full: null, scoped: null };
      return shared;
    } catch (error: unknown) { this.latest = null; throw error; }
  }

  /** Serialize the same finite plain-input domain once; unsupported values still bypass retention. */
  private identity(parameters: IAutoMovieHumanParameters): { input: string; reusable: boolean } {
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

    return { input, reusable };
  }

  /** Give each caller its actual request metadata while borrowing the same family source records. */
  private scoped(value: HumanInspectionParts.IOutput, patterns: readonly string[]): HumanInspectionParts.IOutput {
    const scope: typeof value.observation.scope = value.observation.scope;
    return scope === undefined ? value : { ...value, observation: { ...value.observation, scope: { ...scope, requested: [...patterns] } } };
  }
}
