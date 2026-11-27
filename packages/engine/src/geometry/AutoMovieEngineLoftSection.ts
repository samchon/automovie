import type {
  IAutoMovieLoftChain,
  IAutoMovieLoftSectionConnect,
  IAutoMovieLoftSectionJet,
  IAutoMovieLoftSectionLegacy,
  IAutoMovieLoftSectionPhase,
  IAutoMovieLoftSectionSource,
  IAutoMovieViewSectionField,
} from "@automovie/interface";

import { AutoMovieEngineLoftChain } from "./AutoMovieEngineLoftChain";
import { AutoMovieEngineLoftSectionBoundary } from "./AutoMovieEngineLoftSectionBoundary";
import { AutoMovieEngineLoftSectionConnect } from "./AutoMovieEngineLoftSectionConnect";
import { AutoMovieEngineLoftSectionLegacy } from "./AutoMovieEngineLoftSectionLegacy";
import { AutoMovieEngineLoftSectionNative } from "./AutoMovieEngineLoftSectionNative";
import { AutoMovieEngineLoftSectionSource } from "./AutoMovieEngineLoftSectionSource";
import { AutoMovieEngineLoftViewRead } from "./AutoMovieEngineLoftViewRead";

/** Local station plans of explicit source and continuation generating fields. */
export namespace AutoMovieEngineLoftSection {
  /**
   * Whether explicit source data requires its owning reader, before
   * preparation.
   */
  export function present(chain: IAutoMovieLoftChain): boolean {
    return (
      chain.nativeSource !== undefined ||
      chain.sectionSpans !== undefined ||
      chain.layers.some(
        (layer: IAutoMovieLoftChain.ILayer): boolean =>
          layer.sectionSource !== undefined,
      )
    );
  }

  /** Required local physical2 presence under the actual interval owners. */
  export function regular(chain: IAutoMovieLoftChain): boolean {
    if (!AutoMovieEngineLoftSectionSource.regular(chain)) return false;
    if (!present(chain))
      return chain.layers.every(
        (layer: IAutoMovieLoftChain.ILayer): boolean =>
          layer.curvatures !== undefined,
      );
    for (let q: number = 0; q + 1 < chain.layers.length; q++) {
      const a: IAutoMovieLoftChain.ILayer = chain.layers[q]!;
      const b: IAutoMovieLoftChain.ILayer = chain.layers[q + 1]!;
      const law: IAutoMovieLoftSectionConnect.ISpan | undefined =
        chain.sectionSpans?.find(
          (span: IAutoMovieLoftSectionConnect.ISpan): boolean => {
            const [from, to]: readonly [number, number] =
              AutoMovieEngineLoftSectionConnect.bounds(span);
            return from <= a.y && to >= b.y;
          },
        );
      if (
        law === undefined &&
        (a.sectionSource !== undefined || b.sectionSource !== undefined)
      )
        return false;
      const legacy: boolean =
        law?.kind === "basis" ||
        (law === undefined && chain.nativeSource === undefined);
      if (legacy && (a.curvatures === undefined || b.curvatures === undefined))
        return false;
    }
    return true;
  }

  /** Prepare finite values and phase derivatives, independently of physical2. */
  export function phase(
    chain: IAutoMovieLoftChain,
    station: number,
  ): ((phi: number) => IAutoMovieLoftSectionPhase) | null {
    if (!present(chain)) return null;
    const selected: Owner | null = owner(chain, station);
    if (selected === null) return null;
    if (selected.kind === "source")
      return AutoMovieEngineLoftSectionNative.phase(
        need(AutoMovieEngineLoftViewRead.values(selected.data, station)),
      );
    if (selected.kind === "family") return familyPhase(selected.field);
    const span: Owner & { kind: "span" } = selected;
    if (span.span.kind === "native")
      return AutoMovieEngineLoftSectionNative.phase(
        need(AutoMovieEngineLoftSectionBoundary.values(span.span.law, station)),
      );
    const mixed: Extract<
      IAutoMovieLoftSectionConnect.ISpan,
      { kind: "mixed" }
    > = span.span;
    const w: Weight = weight(mixed, station);
    if (w[0] === 0 && station === mixed.basis.binding.station)
      return familyPhase(mixed.basis.field);
    const native: (phi: number) => IAutoMovieLoftSectionPhase =
      AutoMovieEngineLoftSectionNative.phase(
        need(AutoMovieEngineLoftSectionBoundary.values(mixed.native, station)),
      );
    if (w[0] === 1 && (station === mixed.from || station === mixed.to))
      return native;
    const basis: IAutoMovieLoftSectionLegacy.IPrepared = extension(
      mixed,
      station,
      0,
    );
    return (phi: number): IAutoMovieLoftSectionPhase =>
      phaseProduct(
        native(phi),
        AutoMovieEngineLoftSectionLegacy.phase(basis, phi),
        w,
      );
  }

  /** Prepare actual physical station2 and phase total2 of the same generator. */
  export function jet(
    chain: IAutoMovieLoftChain,
    station: number,
  ): ((phi: number) => IAutoMovieLoftSectionJet) | null {
    if (!present(chain)) return null;
    const selected: Owner | null = owner(chain, station);
    if (selected === null) return null;
    if (selected.kind === "source")
      return AutoMovieEngineLoftSectionNative.jet(
        need(AutoMovieEngineLoftViewRead.jets(selected.data, station)),
      );
    if (selected.kind === "family") return familyJet(selected.field);
    if (selected.span.kind === "native")
      return AutoMovieEngineLoftSectionNative.jet(
        need(AutoMovieEngineLoftSectionBoundary.read(selected.span.law, station)),
      );
    const mixed: Extract<
      IAutoMovieLoftSectionConnect.ISpan,
      { kind: "mixed" }
    > = selected.span;
    const w: Weight = weight(mixed, station);
    if (w[0] === 0 && station === mixed.basis.binding.station)
      return familyJet(mixed.basis.field);
    const native: (phi: number) => IAutoMovieLoftSectionJet =
      AutoMovieEngineLoftSectionNative.jet(
        need(AutoMovieEngineLoftSectionBoundary.read(mixed.native, station)),
      );
    if (w[0] === 1 && (station === mixed.from || station === mixed.to))
      return native;
    const basis: IAutoMovieLoftSectionLegacy.IPrepared = extension(
      mixed,
      station,
      2,
    );
    return (phi: number): IAutoMovieLoftSectionJet =>
      product(native(phi), AutoMovieEngineLoftSectionLegacy.jet(basis, phi), w);
  }
}

/*
 * Both primal weights survive rounding independently; the last two are
 * native-weight derivatives.
 */
type Weight = readonly [number, number, number, number];

/*
 * An actual complete endpoint family, already expressed in the receiver.
 */
type Family = IAutoMovieLoftSectionSource.IEndpoint["field"];

/*
 * One admitted explicit station owner or genuine legacy absence.
 */
type Owner =
  | { kind: "family"; field: Family }
  | { kind: "source"; data: IAutoMovieLoftSectionSource.ISource["data"] }
  | {
      kind: "span";
      span: Exclude<IAutoMovieLoftSectionConnect.ISpan, { kind: "basis" }>;
    };

/*
 * Validate explicit original ownership before choosing its actual changed-span
 * law.
 */
function owner(chain: IAutoMovieLoftChain, station: number): Owner | null {
  const [lo, hi]: [number, number] = AutoMovieEngineLoftChain.bracket(chain, station);
  const source: IAutoMovieLoftSectionSource.ISource | null =
    AutoMovieEngineLoftSectionSource.validate(chain, lo, hi);
  const span: IAutoMovieLoftSectionConnect.ISpan | null =
    AutoMovieEngineLoftSectionConnect.active(chain, station);
  if (span !== null)
    return span.kind === "basis" ? null : { kind: "span", span };
  const layer: IAutoMovieLoftChain.ILayer | undefined = chain.layers.find(
    (value: IAutoMovieLoftChain.ILayer): boolean => value.y === station,
  );
  const endpoint: IAutoMovieLoftSectionSource.IEndpoint | null =
    layer === undefined ? null : AutoMovieEngineLoftSectionSource.endpoint(layer);
  if (endpoint !== null) return { kind: "family", field: endpoint.field };
  if (
    chain.layers[lo] !== layer &&
    chain.layers[hi] !== layer &&
    (AutoMovieEngineLoftSectionSource.endpoint(chain.layers[lo]!) !== null ||
      AutoMovieEngineLoftSectionSource.endpoint(chain.layers[hi]!) !== null)
  )
    throw new Error(
      "An explicit native boundary has no declared adjoining generating field.",
    );
  if (source !== null) return { kind: "source", data: source.data };
  return null;
}

/*
 * A premise failure is never interpreted as source absence.
 */
function need<T>(value: T | string): T {
  if (typeof value === "string") throw new Error(value);
  return value;
}

/*
 * Value-only complete endpoint functions need no physical derivative
 * evaluation.
 */
function familyPhase(
  field: Family,
): (phi: number) => IAutoMovieLoftSectionPhase {
  // Point and derivative readers must keep the same declared native geometry.
  if (field.kind === "native")
    return AutoMovieEngineLoftSectionNative.phase({
      extents: field.inputs.extents.map(
        (row: readonly number[]): number => row[0]!,
      ),
      shoulders: field.inputs.shoulders.map(
        (row: readonly number[]): number => row[0]!,
      ),
      ...(field.inputs.touch === undefined
        ? {}
        : {
            touch: field.inputs.touch.map(
              (row: readonly number[]): number => row[0]!,
            ),
          }),
      ...(field.inputs.splits === undefined
        ? {}
        : {
            splits: field.inputs.splits.map(
              (split: IAutoMovieViewSectionField.IStationJet[]): number[] =>
                split.map((row: readonly number[]): number => row[0]!),
            ),
          }),
      ...(field.inputs.pieces === undefined
        ? {}
        : {
            pieces: field.inputs.pieces.map(
              (
                pieces: IAutoMovieViewSectionField.IStationJet[][],
              ): number[][] =>
                pieces.map(
                  (split: IAutoMovieViewSectionField.IStationJet[]): number[] =>
                    split.map((row: readonly number[]): number => row[0]!),
                ),
            ),
          }),
    });
  const basis: IAutoMovieLoftSectionLegacy.IPrepared = {
    kind: "value",
    order: field.order,
    rows: [field.rows[0]],
  };
  return (phi: number): IAutoMovieLoftSectionPhase =>
    AutoMovieEngineLoftSectionLegacy.phase(basis, phi);
}

/*
 * Exact retained source2 owns an endpoint's complete local jet.
 */
function familyJet(field: Family): (phi: number) => IAutoMovieLoftSectionJet {
  if (field.kind === "native")
    return AutoMovieEngineLoftSectionNative.jet(field.inputs);
  const basis: IAutoMovieLoftSectionLegacy.IPrepared = {
    kind: "jet",
    order: field.order,
    rows: field.rows,
  };
  return (phi: number): IAutoMovieLoftSectionJet =>
    AutoMovieEngineLoftSectionLegacy.jet(basis, phi);
}

/*
 * Define the complete legacy field on the receiving span, not beyond its host.
 */
function extension(
  span: Extract<IAutoMovieLoftSectionConnect.ISpan, { kind: "mixed" }>,
  station: number,
  order: 0 | 2,
): IAutoMovieLoftSectionLegacy.IPrepared {
  const field: Family = span.basis.field;
  if (field.kind !== "basis")
    throw new Error("The mixed extension has no actual basis endpoint2.");
  return AutoMovieEngineLoftSectionLegacy.extend(
    field.rows,
    field.order,
    station - span.basis.binding.station,
    order,
  );
}

/*
 * Quintic flat weight has zero first/second derivatives at both exact ends.
 */
function weight(
  span: Extract<IAutoMovieLoftSectionConnect.ISpan, { kind: "mixed" }>,
  station: number,
): Weight {
  const h: number = span.to - span.from;
  const u: number = (station - span.from) / h;
  const v: number = (span.to - station) / h;
  const small: number = Math.min(u, v);
  const q: number =
    small * small * small * (10 - 15 * small + 6 * small * small);
  const rising: number = u <= 0.5 ? q : 1 - q;
  const falling: number = u <= 0.5 ? 1 - q : q;
  const sign: number = span.nativeEnd === "top" ? 1 : -1;
  return [
    span.nativeEnd === "top" ? rising : falling,
    span.nativeEnd === "top" ? falling : rising,
    (sign * 30 * u * u * v * v) / h,
    (sign * 60 * u * v * (1 - 2 * u)) / h / h,
  ];
}

/*
 * Shared value/phase product rule uses a station-only scalar weight.
 */
function phaseProduct(
  a: IAutoMovieLoftSectionPhase,
  b: IAutoMovieLoftSectionPhase,
  w: Weight,
): IAutoMovieLoftSectionPhase {
  const out: IAutoMovieLoftSectionPhase = { p: [0, 0], t: [0, 0], tt: [0, 0] };
  for (const key of ["p", "t", "tt"] as const)
    for (let q: number = 0; q < 2; q++)
      out[key][q] = w[0] * a[key][q]! + w[1] * b[key][q]!;
  return admit(out);
}

/*
 * The whole-field product closes with total2, without source3/4.
 */
function product(
  a: IAutoMovieLoftSectionJet,
  b: IAutoMovieLoftSectionJet,
  w: Weight,
): IAutoMovieLoftSectionJet {
  const out: IAutoMovieLoftSectionJet = {
    ...phaseProduct(a, b, w),
    s: [0, 0],
    ss: [0, 0],
    st: [0, 0],
  };
  for (let q: number = 0; q < 2; q++) {
    out.s[q] = w[0] * a.s[q]! + w[1] * b.s[q]! + w[2] * (a.p[q]! - b.p[q]!);
    out.ss[q] =
      w[0] * a.ss[q]! +
      w[1] * b.ss[q]! +
      2 * w[2] * (a.s[q]! - b.s[q]!) +
      w[3] * (a.p[q]! - b.p[q]!);
    out.st[q] = w[0] * a.st[q]! + w[1] * b.st[q]! + w[2] * (a.t[q]! - b.t[q]!);
  }
  return admit(out);
}

/*
 * Only requested result vectors are required finite; no absent derivative is
 * requested.
 */
function admit<T extends IAutoMovieLoftSectionPhase>(out: T): T {
  return out;
}
