import type {
  IAutoMovieFamily,
  IAutoMovieLoftChain,
  IAutoMovieLoftSectionBoundary,
  IAutoMovieLoftSectionConnect,
  IAutoMovieLoftSectionLegacy,
  IAutoMovieLoftSectionSource,
  IAutoMovieLoftViewRead,
} from "@automovie/interface";

import { AutoMovieLoftChain } from "./AutoMovieLoftChain";
import { AutoMovieLoftSectionBoundary } from "./AutoMovieLoftSectionBoundary";
import { AutoMovieLoftSectionLegacy } from "./AutoMovieLoftSectionLegacy";
import { AutoMovieLoftSectionOriginal } from "./AutoMovieLoftSectionOriginal";
import { AutoMovieLoftSectionSource } from "./AutoMovieLoftSectionSource";
import { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";

/** Complete actual basis functions for one regular endpoint. */
type Basis = Extract<IAutoMovieFamily, { kind: "basis" }>;

/** A kept/transformed layer may retain an explicit endpoint family. */
type Layer = IAutoMovieLoftChain.ILayer & {
  sectionSource?: IAutoMovieLoftSectionSource.IEndpoint;
};

/**
 * Complete generating laws for the one span changed by continuation.
 */
export namespace AutoMovieLoftSectionConnect {
  /**
   * Capture the actual complete family at a regular station, oriented once.
   */
  export function capture(
    chain: IAutoMovieLoftChain,
    station: number,
    sign: 1 | -1 = 1,
  ): IAutoMovieFamily | string {
    try {
      if (AutoMovieLoftSectionOriginal.active(chain.originalSection, station))
        return "An original section span has no lossless scalar continuation endpoint at this station.";
      const [lo, hi]: [number, number] = AutoMovieLoftChain.bracket(
        chain,
        station,
      );
      const source: IAutoMovieLoftSectionSource.ISource | null =
        AutoMovieLoftSectionSource.validate(chain, lo, hi);
      const layer: Layer | undefined = chain.layers.find(
        (value: IAutoMovieLoftChain.ILayer): boolean => value.y === station,
      );
      const endpoint: IAutoMovieLoftSectionSource.IEndpoint | null =
        layer === undefined ? null : AutoMovieLoftSectionSource.endpoint(layer);
      let field: IAutoMovieFamily;
      if (endpoint !== null) field = endpoint.field;
      else {
        const span: IAutoMovieLoftSectionConnect.ISpan | null = active(
          chain,
          station,
        );
        if (span?.kind === "native") {
          const inputs: IAutoMovieLoftViewRead.IJets | string =
            AutoMovieLoftSectionBoundary.read(span.law, station);
          if (typeof inputs === "string") return inputs;
          field = { kind: "native", inputs };
        } else if (span?.kind === "mixed") {
          if (station !== span.from && station !== span.to)
            return "A mixed generating-field interior cannot be captured as an eight-scalar native boundary.";
          const native: boolean =
            station === (span.nativeEnd === "bottom" ? span.from : span.to);
          if (native) {
            const inputs: IAutoMovieLoftViewRead.IJets | string =
              AutoMovieLoftSectionBoundary.read(span.native, station);
            if (typeof inputs === "string") return inputs;
            field = { kind: "native", inputs };
          } else field = span.basis.field;
        } else if (span?.kind === "basis" || source === null)
          field = basis(chain, station);
        else {
          const inputs: IAutoMovieLoftViewRead.IJets | string =
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
   */
  export function finish(chain: IAutoMovieLoftChain): IAutoMovieLoftChain {
    let spans: IAutoMovieLoftSectionConnect.ISpan[] =
      chain.sectionSpans?.slice() ?? [];
    let changed: boolean = false;
    for (let index: number = 0; index + 1 < chain.layers.length; index++) {
      const a: Layer = chain.layers[index]!;
      const b: Layer = chain.layers[index + 1]!;
      if (a.sectionSource === undefined && b.sectionSource === undefined)
        continue;
      if (chain.originalSection !== undefined && a.y < chain.originalSection.domain[1] && b.y > chain.originalSection.domain[0])
        throw new Error("A changed continuation interval overlaps an original section field.");
      const first: IAutoMovieFamily | string = capture(chain, a.y);
      const last: IAutoMovieFamily | string = capture(chain, b.y);
      if (typeof first === "string" || typeof last === "string")
        throw new Error(typeof first === "string" ? first : (last as string));
      const law: IAutoMovieLoftSectionConnect.ISpan | string = create(
        first,
        a,
        last,
        b,
      );
      if (typeof law === "string") throw new Error(law);
      spans = spans.filter(
        (old: IAutoMovieLoftSectionConnect.ISpan): boolean => {
          const [low, high]: readonly [number, number] = bounds(old);
          if (low === a.y && high === b.y) return false;
          if (low < b.y && high > a.y)
            throw new Error(
              "A changed native boundary overlaps an existing composed span without re-expression.",
            );
          return true;
        },
      );
      spans.push(law);
      changed = true;
    }
    return changed ? { ...chain, sectionSpans: spans } : chain;
  }

  /**
   * The declared changed-span law at a station, or genuine absence.
   */
  export function active(
    chain: IAutoMovieLoftChain,
    station: number,
  ): IAutoMovieLoftSectionConnect.ISpan | null {
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
   */
  export function bounds(
    span: IAutoMovieLoftSectionConnect.ISpan,
  ): readonly [number, number] {
    if (span?.kind === "native")
      return [span.law.ends[0].station, span.law.ends[1].station];
    if (span?.kind === "basis" || span?.kind === "mixed")
      return [span.from, span.to];
    throw new Error("The present native span kind is unsupported.");
  }
}

/** Capture a complete actual basis endpoint rather than a finite collection of phase samples. */
function basis(chain: IAutoMovieLoftChain, station: number): Basis {
  const prepared: IAutoMovieLoftSectionLegacy.IPrepared =
    AutoMovieLoftSectionLegacy.prepare(chain, station, 2);
  if (prepared.kind !== "jet")
    throw new Error("The endpoint has no actual complete physical basis2.");
  return { kind: "basis", order: prepared.order, rows: prepared.rows };
}

/** Reflect a whole function once, including actual station derivative signs. */
function orient(field: IAutoMovieFamily, sign: 1 | -1): IAutoMovieFamily {
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
  first: IAutoMovieFamily,
  lower: IAutoMovieLoftChain.ILayer,
  last: IAutoMovieFamily,
  upper: IAutoMovieLoftChain.ILayer,
): IAutoMovieLoftSectionConnect.ISpan | string {
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
  const native: Extract<IAutoMovieFamily, { kind: "native" }> =
    first.kind === "native"
      ? first
      : (last as Extract<IAutoMovieFamily, { kind: "native" }>);
  const start: IAutoMovieLoftViewRead.IJets =
    first.kind === "native" ? first.inputs : constant(native.inputs);
  const end: IAutoMovieLoftViewRead.IJets =
    last.kind === "native" ? last.inputs : constant(native.inputs);
  const law: IAutoMovieLoftSectionBoundary.IBridge | string =
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
  inputs: IAutoMovieLoftViewRead.IJets,
): IAutoMovieLoftViewRead.IJets {
  return {
    extents: inputs.extents.map(
      (jet: readonly number[]): [number, number, number] => [jet[0]!, 0, 0],
    ),
    shoulders: inputs.shoulders.map(
      (jet: readonly number[]): [number, number, number] => [jet[0]!, 0, 0],
    ),
  };
}
