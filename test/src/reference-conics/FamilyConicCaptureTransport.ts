import { FamilyConicCaseIdentity as Identity } from "./FamilyConicCaseIdentity";
import { FamilyConicCaseSelection as Selection } from "./FamilyConicCaseSelection";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/** Read-only recorded-input handoff; it owns no geometry, constraint or field conversion. */
export namespace FamilyConicCaptureTransport {
  /**
   * Exact complete old/current fingerprints and the recorded observation-only changes.
   *
   *
   * @evidence contracts/development/design.md#principled-representation Complete repository-relative SHA-256 scopes and exact old/new links distinguish historical generation from recorded observation; bridge validates paths and permitted changes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The transport core and file reader share this metadata boundary; production field types are not redefined.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unknown runtime fingerprints are rejected by sourcePaths and bridge; the type does not itself prove behavioral equivalence.
   * @evidence contracts/development/common.md#meaningful-documentation Members state historical/current scope and exact recorded changes.
   */
  export interface IBridge {
    /** Original catalog/round fingerprint. */
    before: Readonly<Record<string, string>>;
    /** Current RootInputs fingerprint, including both trace owners. */
    current: Readonly<Record<string, string>>;
    /** Exact recorded changes; arbitrary generation drift is refused. */
    changed: readonly { file: string; before: string | null; after: string }[];
  }
  /**
   * Serialized case identity; numerical fields remain opaque.
   *
   *
   * @evidence contracts/development/design.md#principled-representation An exact id, finite opaque JSON fields, canonical digest and complete source scope identify one recorded case; preflight validates runtime content.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The transport file reader borrows the production-selected fields without defining another body model.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unknown fields are intentional JSON metadata checked by the shared canonical identity owner, never cast into geometry.
   * @evidence contracts/development/common.md#meaningful-documentation Members name exact ids, canonical digests and the generation fingerprint.
   */
  export interface IClaim {
    /** Exact catalog id, without aliases. */
    id: string;
    /** Finite JSON fields, never converted here. */
    fields: unknown;
    /** Canonical field digest. */
    fieldsHash: string;
    /** Complete generation scope. */
    sourceHashes: Readonly<Record<string, string>>;
  }
  /**
   * Current observation identity and its exact historical case bytes.
   *
   *
   * @evidence contracts/development/design.md#principled-representation A case claim adds exact original-file bytes and the recorded finite operator-outcome comparison; admit requires a matching digest and true comparison.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The observation reader supplies these two facts from the actual RootInputs receipt.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A true finite comparison grants no full-domain or shape claim; fields retain the imported producer identity.
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish byte evidence from the limited outcome comparison.
   */
  export interface IObserved extends IClaim {
    /** Exact old per-case byte digest. */
    originalCaseByteHash: string;
    /** Only recorded finite operator outcomes, never a shape assertion. */
    unchangedObservedOutcomes: boolean;
  }
  /**
   * Display points retained separately from source definitions and skin.
   *
   *
   * @evidence contracts/development/design.md#principled-representation Existing renderer curves contain open metre samples; named unavailable rows retain gaps and absent world profiles.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the source-only display consumes these arrays; NodeCanvasTypes owns the curve shape.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No source geometry, surface or continuous loop is inferred from point samples.
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish display points from unrecorded intervals.
   */
  export interface ISubmitted {
    /** Open metre polylines through actual finite input samples. */
    curves: N.Curve[];
    /** Missing intervals and unrecorded world curves. */
    unavailable: { id: string; cause: string }[];
  }
  /**
   * Plain record admission for metadata, without coercing absent data.
   *
   *
   * @evidence contracts/development/implementation.md#principled-implementation Plain non-null non-array objects are admitted without coercion.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shape guard precedes a borrowed record return.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Absent data and arrays are refused rather than replaced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work and no data copy.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All metadata readers use this one object boundary.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No handle, retained cache or mutation is introduced.
   * @evidence contracts/development/common.md#meaningful-documentation The comment names object admission without filling missing data.
   */
  export function record(value: unknown): Record<string, unknown> {
    if (value === null || typeof value !== "object" || Array.isArray(value))
      throw new Error("Recorded capture metadata is not an object");
    return value as Record<string, unknown>;
  }
  /**
   * Exact structural identity with finite canonical JSON.
   *
   *
   * @evidence contracts/development/implementation.md#principled-implementation The shared finite canonical JSON digest tests exact structural identity.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two canonical identities are compared directly.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance, rounding or source alias enters equality.
   * @evidence contracts/development/implementation.md#efficient-algorithms Work and transient serialization are proportional to both JSON inputs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same Identity owner serves MainRound and capture.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only a boolean survives; inputs remain unmodified.
   * @evidence contracts/development/common.md#meaningful-documentation The comment states exact finite canonical identity.
   */
  export function same(a: unknown, b: unknown): boolean {
    return Identity.dataHash(a) === Identity.dataHash(b);
  }

  /**
   * Admit only the recorded three modified engine connections and two new trace owners.
   *
   *
   * @evidence contracts/development/implementation.md#principled-implementation Complete source scopes and the recorded three modified connections plus two trace owners define this observation-only handoff.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Path validation and a unique change map precede complete before/current comparisons.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Changes outside the recorded observation owner set, missing additions and unrecorded drift fail; this does not prove whole-domain equivalence.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear scope scans and bounded five-change indexing retain proportional key arrays.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Selection.sourcePaths is the existing canonical path/digest validator.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only local maps and arrays are retained during the call.
   * @evidence contracts/development/common.md#meaningful-documentation The comment states the narrowly recorded observation changes.
   */
  export function bridge(value: IBridge): void {
    const before: string[] = Selection.sourcePaths(value.before);
    const current: string[] = Selection.sourcePaths(value.current);
    const prefix: string = "packages/engine/src/geometry/construction/";
    const modified: Set<string> = new Set(
      [
        "AutoMovieConstructionSeeds.ts",
        "AutoMovieConstructionSplitBand.ts",
        "index.ts",
      ].map((name: string): string => prefix + name),
    );
    const added: Set<string> = new Set(
      [
        "AutoMovieConstructionSplitBandTrace.ts",
        "AutoMovieConstructionSeedTrace.ts",
      ].map((name: string): string => prefix + name),
    );
    const changes: Map<string, IBridge["changed"][number]> = new Map();
    for (const change of value.changed) {
      if (
        changes.has(change.file) ||
        (!modified.has(change.file) && !added.has(change.file)) ||
        change.before !== (value.before[change.file] ?? null) ||
        change.after !== value.current[change.file] ||
        change.before === change.after ||
        added.has(change.file) !== (change.before === null)
      )
        throw new Error(
          "Invalid observation-only source bridge: " + change.file,
        );
      changes.set(change.file, change);
    }
    if (
      changes.size !== modified.size + added.size ||
      current.length !== before.length + added.size
    )
      throw new Error("Incomplete recorded observation-only source bridge");
    for (const key of before)
      if (
        value.current[key] === undefined ||
        (value.before[key] !== value.current[key] && !changes.has(key))
      )
        throw new Error("Unrecorded generation drift: " + key);
    for (const key of current)
      if (value.before[key] === undefined && !added.has(key))
        throw new Error("Unrecorded generation source: " + key);
  }

  /**
   * Match exact old/current records and return the original selected fields without rebuilding them.
   *
   *
   * @evidence contracts/development/implementation.md#principled-implementation Shared preflight admission binds exact selected fields to both complete scopes, old bytes and recorded finite outcomes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Bridge admission precedes old/current case and byte checks.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No forced alias, second solver, altered fields or shape approval is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Metadata hashing and source scans are proportional to fields and declared scopes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both reports use Selection.preflight and Identity rather than independent identity recipes.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The same selected object is returned; no input mutation or cache survives.
   * @evidence contracts/development/common.md#meaningful-documentation The comment states exact old/current records and unchanged fields.
   */
  export function admit<T extends { id: string; fields: unknown }>(
    selected: T,
    before: IClaim,
    observed: IObserved,
    scope: IBridge,
    actualOldByteHash: string,
  ): T {
    bridge(scope);
    Selection.preflight(before, selected, scope.before);
    Selection.preflight(observed, selected, scope.current);
    if (
      !/^[a-f0-9]{64}$/i.test(actualOldByteHash) ||
      observed.originalCaseByteHash !== actualOldByteHash ||
      observed.unchangedObservedOutcomes !== true
    )
      throw new Error(
        "Recorded case bytes or finite outcome comparison do not match",
      );
    return selected;
  }

  /**
   * A historical/current recorded-input handoff authorizes source-only observation exclusively.
   *
   *
   * @evidence contracts/development/implementation.md#principled-implementation Recorded-input catalog and report scopes must agree and permit source-only use exclusively.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Scope agreement is checked before full-capture refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The actual file reader supplies both exact-byte inputs; no approval token or implicit promotion exists.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scope checks allocate no geometry or data arrays.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both source-only and full capture use this same guard.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No retained state, file or task is owned.
   * @evidence contracts/development/common.md#meaningful-documentation The comment names source-only authorization and the optional pure metadata counterpart.
   */
  export function restrict(
    preflight: unknown,
    sourceOnly: boolean,
    artifact?: unknown,
  ): void {
    const reported: boolean =
      record(preflight).evidenceScope === "recorded-input-source-only";
    const catalog: boolean =
      artifact === undefined
        ? reported
        : record(artifact).evidenceScope === "recorded-input-source-only";
    if (reported !== catalog)
      throw new Error("Recorded-input catalog and preflight scopes differ");
    if ((reported || catalog) && !sourceOnly)
      throw new Error("Recorded-input evidence is restricted to --source-only");
  }

  /** Read only a finite recorded xyz value; no interpolation or source evaluation occurs. */
  function point(value: unknown): N.Point | null {
    return Array.isArray(value) &&
      value.length === 3 &&
      value.every(
        (n: unknown): boolean => typeof n === "number" && Number.isFinite(n),
      )
      ? [value[0] / 1000, value[1] / 1000, value[2] / 1000]
      : null;
  }

  /**
   * Actual submitted endpoints only; gaps break runs and no seam profile is reconstructed.
   *
   *
   * @evidence contracts/development/implementation.md#principled-implementation Only recorded finite xyz millimetres become metre display points; recorded increasing or decreasing phase order is preserved.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Each prepared event and side has its own open fragments; missing points, zero steps and reversals break them.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No phase sorting, unwrap, closure, seam evaluator or skin reconstruction is introduced; seam world profiles remain unavailable.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pass over columns and seam endpoints retains only output samples and unavailable rows for one case.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work NodeCanvasTypes owns curve representation and the existing rasterizer consumes the returned samples.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No callback, file handle or cross-case cache survives; the caller owns the one-case result arrays.
   * @evidence contracts/development/common.md#meaningful-documentation The comment and unavailable rows name point units, discontinuities and absent world profiles.
   */
  export function submitted(
    bands: readonly unknown[],
    seams: readonly unknown[],
  ): ISubmitted {
    const result: ISubmitted = { curves: [], unavailable: [] };
    for (const [attempt, raw] of bands.entries()) {
      const row: Record<string, unknown> = record(raw);
      const event: Record<string, unknown> = record(row.event);
      if (event.kind !== "prepared") continue;
      const columns: unknown[] = Array.isArray(event.columns)
        ? event.columns
        : [];
      const phases: unknown[] = Array.isArray(event.childPhases)
        ? event.childPhases
        : [];
      for (const side of ["start", "end"]) {
        const id: string =
          String(row.owner) +
          "/submitted/" +
          attempt +
          "/" +
          String(event.name) +
          "/" +
          side;
        let points: N.Point[] = [];
        let run: number = 0;
        let orientation: number = 0;
        const flush: () => void = (): void => {
          if (points.length > 0)
            result.curves.push({
              id: id + "/" + run++,
              points: points.length === 1 ? [points[0]!, points[0]!] : points,
              closed: false,
              colour: side === "start" ? "e29d24" : "218f73",
            });
          points = [];
        };
        for (let i: number = 0; i < columns.length; i++) {
          const rawColumn: unknown = columns[i];
          const column: Record<string, unknown> =
            rawColumn !== null &&
            typeof rawColumn === "object" &&
            !Array.isArray(rawColumn)
              ? record(rawColumn)
              : {};
          const endpoint: unknown = column[side];
          const p: N.Point | null =
            endpoint !== null && typeof endpoint === "object"
              ? point(record(endpoint).point)
              : null;
          const phase: unknown = phases[i];
          const previous: unknown = phases[i - 1];
          const finite: boolean =
            typeof phase === "number" && Number.isFinite(phase);
          const previousFinite: boolean =
            typeof previous === "number" && Number.isFinite(previous);
          const step: number =
            finite && previousFinite
              ? Math.sign((phase as number) - (previous as number))
              : 0;
          const ordered: boolean =
            finite &&
            (i === 0 ||
              (previousFinite &&
                step !== 0 &&
                (orientation === 0 || step === orientation)));
          if (ordered && i > 0 && orientation === 0) orientation = step;
          if (!ordered || p === null) {
            flush();
            result.unavailable.push({
              id: id + "/column/" + i,
              cause:
                "Missing/nonfinite point or discontinuous recorded child phase; sampled sequence is broken here",
            });
            continue;
          }
          points.push(p);
        }
        flush();
        if (columns.length === 0 || columns.length !== phases.length)
          result.unavailable.push({
            id,
            cause:
              "Prepared columns and recorded phases are absent or have different counts",
          });
      }
    }
    for (const [i, raw] of seams.entries()) {
      const seam: Record<string, unknown> = record(raw);
      const id: string = String(seam.owner) + "/submitted-seam/" + i;
      const endpoints: unknown[] = Array.isArray(seam.endpoints)
        ? seam.endpoints
        : [];
      for (const [j, rawEndpoint] of endpoints.entries()) {
        const endpoint: Record<string, unknown> = record(rawEndpoint);
        const jet: unknown = endpoint.fullPhysical2;
        const p: N.Point | null =
          jet !== null && typeof jet === "object" ? point(record(jet).p) : null;
        if (p !== null)
          result.curves.push({
            id: id + "/endpoint/" + j,
            points: [p, p],
            closed: false,
            colour: "b348a0",
          });
      }
      result.unavailable.push({
        id,
        cause:
          "Only actual host endpoint samples and chord-plane control metadata were recorded; the seam world profile and missing intervals are unavailable",
      });
    }
    return result;
  }
}
