import { AutoMovieLoftChain } from "./AutoMovieLoftChain";
import { AutoMovieLoftSectionBoundary } from "./AutoMovieLoftSectionBoundary";
import { AutoMovieLoftSectionLegacy } from "./AutoMovieLoftSectionLegacy";
import { AutoMovieLoftSectionSource } from "./AutoMovieLoftSectionSource";
import { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";

/** A whole actual endpoint phase function, never a fitted Cartesian snapshot. */
type Family = AutoMovieLoftSectionSource.IEndpoint["field"];

/** Complete actual basis functions for one regular endpoint. */
type Basis = Extract<Family, { kind: "basis" }>;

/** The structural provider precedes the shared public interface connection. */
type Chain = IAutoMovieLoftChain & {
  nativeSource?: AutoMovieLoftSectionSource.ISource;
  sectionSpans?: AutoMovieLoftSectionConnect.ISpan[];
};

/** A kept/transformed layer may retain an explicit endpoint family. */
type Layer = IAutoMovieLoftChain.ILayer & {
  sectionSource?: AutoMovieLoftSectionSource.IEndpoint;
};

/**
 * Complete generating laws for the one span changed by continuation.
 *
 * @evidence contracts/common.md#principled-implementation Native/native scalar Hermite and native/basis generating-field products use actual endpoint2 and close in total order two without invented Cartesian higher mixed derivatives.
 * @evidence contracts/common.md#clear-and-simple-design Endpoint capture and span publication are separate from field evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Never fits a composed boundary to eight scalars, reads a host beyond its domain or silently substitutes a legacy field for broken native data.
 * @evidence contracts/common.md#meaningful-documentation States changed-span ownership, whole generating families, reflected directions and the composed-interior capture limit.
 * @evidence contracts/performance.md#efficient-algorithms Capturing one boundary reads one actual scalar/basis station; finalization visits layers and prepares fixed native or O(N) complete basis endpoint data.
 * @evidence contracts/performance.md#reuse-equivalent-work Published plain span laws are shared by caller-owned Point/Jet station plans.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only explicit changed-span data and complete endpoints, with no module cache or host-chain callback.
 */
export namespace AutoMovieLoftSectionConnect {
  /**
   * Explicit native, mixed or basis law on a changed regular station span.
   *
   * @evidence contracts/common.md#principled-implementation Each variant defines a full phase function over its station interval; mixed uses one positive native scalar extension and one complete coefficient extension with a C2-flat station weight.
   * @evidence contracts/common.md#clear-and-simple-design The discriminant states exactly which actual generators the reader evaluates.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Native endpoints are not Cartesian Taylor jets; basis endpoints are complete functions with all phase derivatives.
   * @evidence contracts/common.md#meaningful-documentation Native end selects weight one at that end, and all station coordinates use mm.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This stored law performs no query.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Station readers own preparation reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Fixed native data and O(N) basis rows belong to the resulting immutable chain, without an original host reference.
   */
  export type ISpan =
    | { kind: "native"; law: AutoMovieLoftSectionBoundary.IBridge }
    | { kind: "basis"; from: number; to: number }
    | {
        kind: "mixed";
        from: number;
        to: number;
        native: AutoMovieLoftSectionBoundary.IBridge;
        nativeEnd: "bottom" | "top";
        basis: AutoMovieLoftSectionSource.IEndpoint;
      };

  /**
   * Capture the actual complete family at a regular station, oriented once.
   *
   * @evidence contracts/common.md#principled-implementation Reads original scalar2, an explicit generated native family or complete actual basis2, with first-station and chart/phase signs applied together.
   * @evidence contracts/common.md#clear-and-simple-design Explicit endpoint data takes precedence, followed by an owned span and then the original base function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A mixed interior cannot be projected into a native family; unavailable source2 is a named C2 premise failure, not a lost finite Point0.
   * @evidence contracts/common.md#meaningful-documentation sign is the continuation station/chart direction; second derivatives keep their sign.
   * @evidence contracts/performance.md#efficient-algorithms Bracketing, O(N) binding checks, a layer search and O(S(L+N)) existing-law validation precede the actual scalar/basis query and its reflection.
   * @evidence contracts/performance.md#reuse-equivalent-work Captured plain endpoint data serves the shared boundary and both adjoining fields.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns independent family data or a string and retains no host or callable source.
   */
  export function capture(
    chain: Chain,
    station: number,
    sign: 1 | -1 = 1,
  ): Family | string {
    try {
      const [lo, hi]: [number, number] = AutoMovieLoftChain.bracket(
        chain,
        station,
      );
      const source: AutoMovieLoftSectionSource.ISource | null =
        AutoMovieLoftSectionSource.validate(chain, lo, hi);
      const layer: Layer | undefined = chain.layers.find(
        (value: IAutoMovieLoftChain.ILayer): boolean => value.y === station,
      );
      const endpoint: AutoMovieLoftSectionSource.IEndpoint | null =
        layer === undefined ? null : AutoMovieLoftSectionSource.endpoint(layer);
      let field: Family;
      if (endpoint !== null) field = endpoint.field;
      else {
        const span: ISpan | null = active(chain, station);
        if (span?.kind === "native") {
          const inputs: AutoMovieLoftViewRead.IJets | string =
            AutoMovieLoftSectionBoundary.read(span.law, station);
          if (typeof inputs === "string") return inputs;
          field = { kind: "native", inputs };
        } else if (span?.kind === "mixed") {
          if (station !== span.from && station !== span.to)
            return "A mixed generating-field interior cannot be captured as an eight-scalar native boundary.";
          const native: boolean =
            station === (span.nativeEnd === "bottom" ? span.from : span.to);
          if (native) {
            const inputs: AutoMovieLoftViewRead.IJets | string =
              AutoMovieLoftSectionBoundary.read(span.native, station);
            if (typeof inputs === "string") return inputs;
            field = { kind: "native", inputs };
          } else field = span.basis.field;
        } else if (span?.kind === "basis" || source === null)
          field = basis(chain, station);
        else {
          const inputs: AutoMovieLoftViewRead.IJets | string =
            AutoMovieLoftViewRead.jets(source.data, station);
          if (typeof inputs === "string") return inputs;
          field = { kind: "native", inputs };
        }
      }
      return orient(field, sign);
    } catch (error: unknown) {
      return `Boundary of ${chain.name} at ${station} mm: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Publish complete changed-span laws after kept/transformed endpoint rows exist.
   *
   * @evidence contracts/common.md#principled-implementation Uses actual matched and unchanged far endpoint2, not a new principal approximation of the ordinary source between unchanged rows.
   * @evidence contracts/common.md#clear-and-simple-design Only intervals touching explicit endpoint records receive a declared law.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses unrepresentable transformed jets and overlapping re-expression rather than dropping source ownership or adding arbitrary missing derivatives.
   * @evidence contracts/common.md#meaningful-documentation Called by the C2 construction owner; ordinary finite-value chains never need to run this operation for Point0.
   * @evidence contracts/performance.md#efficient-algorithms One layer scan and two capture operations per changed interval, including their layer/law/binding searches, precede fixed native or O(N) mixed-law storage.
   * @evidence contracts/performance.md#reuse-equivalent-work Immutable published laws are reused across every station/phase query of that span.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a shallow chain copy and explicit changed-span records; no global cache or historical registration selects geometry.
   */
  export function finish(chain: Chain): Chain {
    let spans: ISpan[] = chain.sectionSpans?.slice() ?? [];
    let changed: boolean = false;
    for (let index: number = 0; index + 1 < chain.layers.length; index++) {
      const a: Layer = chain.layers[index]!;
      const b: Layer = chain.layers[index + 1]!;
      if (a.sectionSource === undefined && b.sectionSource === undefined)
        continue;
      const first: Family | string = capture(chain, a.y);
      const last: Family | string = capture(chain, b.y);
      if (typeof first === "string" || typeof last === "string")
        throw new Error(typeof first === "string" ? first : (last as string));
      const law: ISpan | string = create(first, a, last, b);
      if (typeof law === "string") throw new Error(law);
      spans = spans.filter((old: ISpan): boolean => {
        const [low, high]: readonly [number, number] = bounds(old);
        if (low === a.y && high === b.y) return false;
        if (low < b.y && high > a.y)
          throw new Error(
            "A changed native boundary overlaps an existing composed span without re-expression.",
          );
        return true;
      });
      spans.push(law);
      changed = true;
    }
    return changed ? { ...chain, sectionSpans: spans } : chain;
  }

  /**
   * The declared changed-span law at a station, or genuine absence.
   *
   * @evidence contracts/common.md#principled-implementation Explicit stored bounds select their complete generating field independently of source cache history.
   * @evidence contracts/common.md#clear-and-simple-design One bounded law lookup preserves ordinary source spans elsewhere.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A malformed present list or unknown law never becomes a legacy fallback.
   * @evidence contracts/common.md#meaningful-documentation Bounds are regular physical stations; this lookup opens no pole domain.
   * @evidence contracts/performance.md#efficient-algorithms For S stored laws, mixed endpoint validation includes a layer search and O(N) binding comparison, giving O(S(L+N)) cold lookup work; repeated continuations do not imply a fixed two-span bound.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The pure lookup owns no cross-call result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a borrowed immutable law and retains nothing.
   */
  export function active(chain: Chain, station: number): ISpan | null {
    if (chain.sectionSpans === undefined) return null;
    if (!Array.isArray(chain.sectionSpans))
      throw new Error("The present native span list is malformed.");
    for (const span of chain.sectionSpans) {
      const [first, last]: readonly [number, number] = bounds(span);
      if (
        !(
          Number.isFinite(first) &&
          Number.isFinite(last) &&
          Number.isFinite(last - first) &&
          last > first
        )
      )
        throw new Error("A present native span has invalid physical bounds.");
      if (span.kind === "mixed") {
        if (
          span.basis === null ||
          span.basis === undefined ||
          span.basis.field?.kind !== "basis"
        )
          throw new Error(
            "The present mixed law has no complete basis endpoint.",
          );
        const layer: IAutoMovieLoftChain.ILayer | undefined = chain.layers.find(
          (entry: IAutoMovieLoftChain.ILayer): boolean =>
            entry.y === span.basis.binding.station,
        );
        if (layer !== undefined)
          AutoMovieLoftSectionSource.endpoint({
            ...layer,
            sectionSource: span.basis,
          });
      }
      if (station >= first && station <= last) return span;
    }
    return null;
  }

  /**
   * Physical station bounds of a declared generating law.
   *
   * @evidence contracts/common.md#principled-implementation Native bounds belong to the exact retained endpoints; other variants store their explicit interval.
   * @evidence contracts/common.md#clear-and-simple-design One discriminator owns the layout difference.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown present law kinds throw instead of selecting another geometry.
   * @evidence contracts/common.md#meaningful-documentation Returns lower/upper regular station in mm.
   * @evidence contracts/performance.md#efficient-algorithms Constant field reads with one returned pair.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure layout accessor coordinates no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains no input or result.
   */
  export function bounds(span: ISpan): readonly [number, number] {
    if (span?.kind === "native")
      return [span.law.ends[0].station, span.law.ends[1].station];
    if (span?.kind === "basis" || span?.kind === "mixed")
      return [span.from, span.to];
    throw new Error("The present native span kind is unsupported.");
  }
}

/** Capture a complete actual basis endpoint rather than a finite collection of phase samples. */
function basis(chain: Chain, station: number): Basis {
  const prepared: AutoMovieLoftSectionLegacy.IPrepared =
    AutoMovieLoftSectionLegacy.prepare(chain, station, 2);
  if (prepared.kind !== "jet")
    throw new Error("The endpoint has no actual complete physical basis2.");
  return { kind: "basis", order: prepared.order, rows: prepared.rows };
}

/** Reflect a whole function once, including actual station derivative signs. */
function orient(field: Family, sign: 1 | -1): Family {
  if (sign !== 1 && sign !== -1)
    throw new Error("A boundary direction must be 1 or -1.");
  if (field.kind === "native")
    return {
      kind: "native",
      inputs: AutoMovieLoftSectionBoundary.orient(field.inputs, sign),
    };
  if (sign === 1) return structuredClone(field);
  const n: number = field.order;
  const rows: number[][] = field.rows.map(
    (row: number[], derivative: number): number[] => {
      const values: number[] = new Array<number>(2 * n);
      const stationSign: number = derivative === 1 ? -1 : 1;
      for (let q: number = 0; q < n; q++) {
        const reversed: number = (n - q) % n;
        values[q] = stationSign * row[reversed]!;
        values[n + q] = -stationSign * row[n + reversed]!;
      }
      return values;
    },
  );
  return { kind: "basis", order: n, rows: [rows[0]!, rows[1]!, rows[2]!] };
}

/** Actual native endpoint2 defines a positive extension whose free far end is explicitly constant. */
function create(
  first: Family,
  lower: IAutoMovieLoftChain.ILayer,
  last: Family,
  upper: IAutoMovieLoftChain.ILayer,
): AutoMovieLoftSectionConnect.ISpan | string {
  const from: number = lower.y;
  const to: number = upper.y;
  if (
    !(
      Number.isFinite(from) &&
      Number.isFinite(to) &&
      Number.isFinite(to - from) &&
      to > from
    )
  )
    return "A continuation span needs increasing finite physical bounds.";
  if (first.kind === "basis" && last.kind === "basis")
    return { kind: "basis", from, to };
  const nativeEnd: "bottom" | "top" =
    first.kind === "native" ? "bottom" : "top";
  const native: Extract<Family, { kind: "native" }> =
    first.kind === "native"
      ? first
      : (last as Extract<Family, { kind: "native" }>);
  const start: AutoMovieLoftViewRead.IJets =
    first.kind === "native" ? first.inputs : constant(native.inputs);
  const end: AutoMovieLoftViewRead.IJets =
    last.kind === "native" ? last.inputs : constant(native.inputs);
  const law: AutoMovieLoftSectionBoundary.IBridge | string =
    AutoMovieLoftSectionBoundary.create(
      { station: from, inputs: start },
      { station: to, inputs: end },
    );
  if (typeof law === "string") return law;
  if (first.kind === "native" && last.kind === "native")
    return { kind: "native", law };
  const other: Basis = first.kind === "basis" ? first : (last as Basis);
  return {
    kind: "mixed",
    from,
    to,
    native: law,
    nativeEnd,
    basis: AutoMovieLoftSectionSource.bind(
      nativeEnd === "bottom" ? upper : lower,
      other,
    ),
  };
}

/** These zero derivatives define the free constant extension, never an unavailable actual source. */
function constant(
  inputs: AutoMovieLoftViewRead.IJets,
): AutoMovieLoftViewRead.IJets {
  return {
    extents: inputs.extents.map(
      (jet: readonly number[]): [number, number, number] => [jet[0]!, 0, 0],
    ),
    shoulders: inputs.shoulders.map(
      (jet: readonly number[]): [number, number, number] => [jet[0]!, 0, 0],
    ),
  };
}
