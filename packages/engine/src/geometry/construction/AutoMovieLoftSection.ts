import { AutoMovieLoftChain } from "./AutoMovieLoftChain";
import { AutoMovieLoftSectionBoundary } from "./AutoMovieLoftSectionBoundary";
import { AutoMovieLoftSectionConnect } from "./AutoMovieLoftSectionConnect";
import { AutoMovieLoftSectionLegacy } from "./AutoMovieLoftSectionLegacy";
import { AutoMovieLoftSectionNative } from "./AutoMovieLoftSectionNative";
import { AutoMovieLoftSectionSource } from "./AutoMovieLoftSectionSource";
import { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";

/** Local mm and phase-radian derivatives without a station-jet requirement. */
type Phase = ReturnType<typeof AutoMovieLoftSectionLegacy.phase>;

/** Only the six required total-order-two local components. */
type Jet = ReturnType<typeof AutoMovieLoftSectionLegacy.jet>;

/** Both primal weights survive rounding independently; the last two are native-weight derivatives. */
type Weight = readonly [number, number, number, number];

/** A structural source carrier also works before public interface wiring. */
type Chain = IAutoMovieLoftChain & {
  nativeSource?: AutoMovieLoftSectionSource.ISource;
  sectionSpans?: AutoMovieLoftSectionConnect.ISpan[];
};

/** An actual complete endpoint family, already expressed in the receiver. */
type Family = AutoMovieLoftSectionSource.IEndpoint["field"];

/** One admitted explicit station owner or genuine legacy absence. */
type Owner =
  | { kind: "family"; field: Family }
  | { kind: "source"; data: AutoMovieLoftSectionSource.ISource["data"] }
  | {
      kind: "span";
      span: Exclude<AutoMovieLoftSectionConnect.ISpan, { kind: "basis" }>;
    };

/**
 * Local station plans of explicit source and continuation generating fields.
 *
 * @evidence contracts/common.md#principled-implementation Original scalar fields and declared changed-span generators determine values and total2, while genuine source absence keeps the existing basis reader.
 * @evidence contracts/common.md#clear-and-simple-design Capability-specific factories share one explicit ownership selection and a total2 product rule for mixed fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Never promotes finite Point0 to a physical-jet requirement, fits a boundary, reads outside a host domain or hides a broken present source behind legacy geometry.
 * @evidence contracts/common.md#meaningful-documentation Separates local phase-only results, physical station derivatives, changed spans and immutable data ownership.
 * @evidence contracts/performance.md#efficient-algorithms Cold preparation includes binding comparison, a layer search and O(S(L+N)) changed-law validation before original scalar lookup or native/O(N) mixed preparation; phase reads use the selected generators.
 * @evidence contracts/performance.md#reuse-equivalent-work Each caller-owned closure reuses its station preparation across phases; this module does not merge existing Point and Jet caches.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No module cache exists; the caller owns prepared geometry and complete basis rows until its closure is released.
 */
export namespace AutoMovieLoftSection {
  /**
   * Whether explicit source data requires its owning reader, before preparation.
   *
   * @evidence contracts/common.md#principled-implementation Presence of original, span or endpoint data selects explicit validation rather than a registration history.
   * @evidence contracts/common.md#clear-and-simple-design This presence predicate only routes station preparation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not certify physical derivatives or turn malformed present data into absence.
   * @evidence contracts/common.md#meaningful-documentation Immutable source presence is distinct from value and derivative admission.
   * @evidence contracts/performance.md#efficient-algorithms Constant chain-field checks precede a layer scan only for endpoint-only carriers.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure predicate owns no preparation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains no input or result.
   */
  export function present(chain: Chain): boolean {
    return (
      chain.nativeSource !== undefined ||
      chain.sectionSpans !== undefined ||
      chain.layers.some(
        (
          layer: IAutoMovieLoftChain.ILayer & {
            sectionSource?: AutoMovieLoftSectionSource.IEndpoint;
          },
        ): boolean => layer.sectionSource !== undefined,
      )
    );
  }

  /**
   * Required local physical2 presence under the actual interval owners.
   *
   * @evidence contracts/common.md#principled-implementation Original source status and complete native/mixed laws supply local2 independently of projection curvature; actual legacy intervals still require their coefficient curvature rows.
   * @evidence contracts/common.md#clear-and-simple-design One local capability predicate is shared by world Jet and exact-frame adaptation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This presence predicate neither prepares missing derivatives nor certifies arbitrary numeric outputs; every query retains actual source admission.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes complete endpoint/span families from compatibility arrays, separately from frame and physical-pole availability.
   * @evidence contracts/performance.md#efficient-algorithms A source-status scan includes binary binding lookup for clipped rows, followed by O(L*S) interval/law-presence work for L layers and S laws; no phase inverse or source2 query occurs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The pure predicate owns no station preparation or cross-call result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains no input or output and adds no cache.
   */
  export function regular(chain: Chain): boolean {
    if (!AutoMovieLoftSectionSource.regular(chain)) return false;
    if (!present(chain))
      return chain.layers.every(
        (layer: IAutoMovieLoftChain.ILayer): boolean =>
          layer.curvatures !== undefined,
      );
    if (chain.sectionSpans !== undefined && !Array.isArray(chain.sectionSpans))
      throw new Error("The present local generating-law list is malformed.");
    for (let q: number = 0; q + 1 < chain.layers.length; q++) {
      const a: IAutoMovieLoftChain.ILayer = chain.layers[q]!;
      const b: IAutoMovieLoftChain.ILayer = chain.layers[q + 1]!;
      const law: AutoMovieLoftSectionConnect.ISpan | undefined =
        chain.sectionSpans?.find(
          (span: AutoMovieLoftSectionConnect.ISpan): boolean => {
            const [from, to]: readonly [number, number] =
              AutoMovieLoftSectionConnect.bounds(span);
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

  /**
   * Prepare finite values and phase derivatives, independently of physical2.
   *
   * @evidence contracts/common.md#principled-implementation NUMBER geometry reads actual scalar values or the explicit continuation generating function at the requested station.
   * @evidence contracts/common.md#clear-and-simple-design Null means genuine legacy ownership, never a failed present source.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not request physical source2 or replace unavailable derivatives with zeros.
   * @evidence contracts/common.md#meaningful-documentation Returns local p/t/tt in mm and radians; source and chain data must remain immutable.
   * @evidence contracts/performance.md#efficient-algorithms Original scalar knot lookup and fixed native preparation, or O(N) complete basis extension for a mixed span, happen once per station closure.
   * @evidence contracts/performance.md#reuse-equivalent-work Every requested phase reuses the prepared station geometry and mixed weight.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-owned closures retain their geometry/rows; results own fresh local vectors and there is no cache insertion.
   */
  export function phase(
    chain: Chain,
    station: number,
  ): ((phi: number) => Phase) | null {
    if (!present(chain)) return null;
    const selected: Owner | null = owner(chain, station);
    if (selected === null) return null;
    if (selected.kind === "source")
      return AutoMovieLoftSectionNative.phase(
        need(AutoMovieLoftViewRead.values(selected.data, station)),
      );
    if (selected.kind === "family") return familyPhase(selected.field);
    const span: Owner & { kind: "span" } = selected;
    if (span.span.kind === "native")
      return AutoMovieLoftSectionNative.phase(
        need(AutoMovieLoftSectionBoundary.values(span.span.law, station)),
      );
    const mixed: Extract<AutoMovieLoftSectionConnect.ISpan, { kind: "mixed" }> =
      span.span;
    const w: Weight = weight(mixed, station);
    if (w[0] === 0 && station === mixed.basis.binding.station)
      return familyPhase(mixed.basis.field);
    const native: (phi: number) => Phase = AutoMovieLoftSectionNative.phase(
      need(AutoMovieLoftSectionBoundary.values(mixed.native, station)),
    );
    if (w[0] === 1 && (station === mixed.from || station === mixed.to))
      return native;
    const basis: AutoMovieLoftSectionLegacy.IPrepared = extension(
      mixed,
      station,
      0,
    );
    return (phi: number): Phase =>
      phaseProduct(
        native(phi),
        AutoMovieLoftSectionLegacy.phase(basis, phi),
        w,
      );
  }

  /**
   * Prepare actual physical station2 and phase total2 of the same generator.
   *
   * @evidence contracts/common.md#principled-implementation Analytic source2 and total2 product rules differentiate the same source/span function that phase reads.
   * @evidence contracts/common.md#clear-and-simple-design Required physical jets are prepared only through this entry point.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing physical2 throws with its premise; no Cartesian third/fourth derivative or hidden legacy fallback is constructed.
   * @evidence contracts/common.md#meaningful-documentation Local derivatives use physical station mm and phase radians; a finite phase-only plan need not admit this operation.
   * @evidence contracts/performance.md#efficient-algorithms Source2 lookup plus fixed native preparation or O(N) complete basis extension precede each station's phase traversal.
   * @evidence contracts/performance.md#reuse-equivalent-work The returned reader shares one prepared station and mixed weight across all phases.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Geometry/rows belong to the caller's closure; each returned total2 owns new vectors and no global cache is added.
   */
  export function jet(
    chain: Chain,
    station: number,
  ): ((phi: number) => Jet) | null {
    if (!present(chain)) return null;
    const selected: Owner | null = owner(chain, station);
    if (selected === null) return null;
    if (selected.kind === "source")
      return AutoMovieLoftSectionNative.jet(
        need(AutoMovieLoftViewRead.jets(selected.data, station)),
      );
    if (selected.kind === "family") return familyJet(selected.field);
    if (selected.span.kind === "native")
      return AutoMovieLoftSectionNative.jet(
        need(AutoMovieLoftSectionBoundary.read(selected.span.law, station)),
      );
    const mixed: Extract<AutoMovieLoftSectionConnect.ISpan, { kind: "mixed" }> =
      selected.span;
    const w: Weight = weight(mixed, station);
    if (w[0] === 0 && station === mixed.basis.binding.station)
      return familyJet(mixed.basis.field);
    const native: (phi: number) => Jet = AutoMovieLoftSectionNative.jet(
      need(AutoMovieLoftSectionBoundary.read(mixed.native, station)),
    );
    if (w[0] === 1 && (station === mixed.from || station === mixed.to))
      return native;
    const basis: AutoMovieLoftSectionLegacy.IPrepared = extension(
      mixed,
      station,
      2,
    );
    return (phi: number): Jet =>
      product(native(phi), AutoMovieLoftSectionLegacy.jet(basis, phi), w);
  }
}

/** Validate explicit original ownership before choosing its actual changed-span law. */
function owner(chain: Chain, station: number): Owner | null {
  const [lo, hi]: [number, number] = AutoMovieLoftChain.bracket(chain, station);
  const source: AutoMovieLoftSectionSource.ISource | null =
    AutoMovieLoftSectionSource.validate(chain, lo, hi);
  const span: AutoMovieLoftSectionConnect.ISpan | null =
    AutoMovieLoftSectionConnect.active(chain, station);
  if (span !== null)
    return span.kind === "basis" ? null : { kind: "span", span };
  const layer: IAutoMovieLoftChain.ILayer | undefined = chain.layers.find(
    (value: IAutoMovieLoftChain.ILayer): boolean => value.y === station,
  );
  const endpoint: AutoMovieLoftSectionSource.IEndpoint | null =
    layer === undefined ? null : AutoMovieLoftSectionSource.endpoint(layer);
  if (endpoint !== null) return { kind: "family", field: endpoint.field };
  if (
    chain.layers[lo] !== layer &&
    chain.layers[hi] !== layer &&
    (AutoMovieLoftSectionSource.endpoint(chain.layers[lo]!) !== null ||
      AutoMovieLoftSectionSource.endpoint(chain.layers[hi]!) !== null)
  )
    throw new Error(
      "An explicit native boundary has no declared adjoining generating field.",
    );
  if (source !== null) return { kind: "source", data: source.data };
  return null;
}

/** A premise failure is never interpreted as source absence. */
function need<T>(value: T | string): T {
  if (typeof value === "string") throw new Error(value);
  return value;
}

/** Value-only complete endpoint functions need no physical derivative evaluation. */
function familyPhase(field: Family): (phi: number) => Phase {
  if (field.kind === "native")
    return AutoMovieLoftSectionNative.phase({
      extents: field.inputs.extents.map(
        (row: readonly number[]): number => row[0]!,
      ),
      shoulders: field.inputs.shoulders.map(
        (row: readonly number[]): number => row[0]!,
      ),
    });
  const basis: AutoMovieLoftSectionLegacy.IPrepared = {
    kind: "value",
    order: field.order,
    rows: [field.rows[0]],
  };
  return (phi: number): Phase => AutoMovieLoftSectionLegacy.phase(basis, phi);
}

/** Exact retained source2 owns an endpoint's complete local jet. */
function familyJet(field: Family): (phi: number) => Jet {
  if (field.kind === "native")
    return AutoMovieLoftSectionNative.jet(field.inputs);
  const basis: AutoMovieLoftSectionLegacy.IPrepared = {
    kind: "jet",
    order: field.order,
    rows: field.rows,
  };
  return (phi: number): Jet => AutoMovieLoftSectionLegacy.jet(basis, phi);
}

/** Define the complete legacy field on the receiving span, not beyond its host. */
function extension(
  span: Extract<AutoMovieLoftSectionConnect.ISpan, { kind: "mixed" }>,
  station: number,
  order: 0 | 2,
): AutoMovieLoftSectionLegacy.IPrepared {
  const field: Family = span.basis.field;
  if (field.kind !== "basis")
    throw new Error("The mixed extension has no actual basis endpoint2.");
  return AutoMovieLoftSectionLegacy.extend(
    field.rows,
    field.order,
    station - span.basis.binding.station,
    order,
  );
}

/** Quintic flat weight has zero first/second derivatives at both exact ends. */
function weight(
  span: Extract<AutoMovieLoftSectionConnect.ISpan, { kind: "mixed" }>,
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

/** Shared value/phase product rule uses a station-only scalar weight. */
function phaseProduct(a: Phase, b: Phase, w: Weight): Phase {
  const out: Phase = { p: [0, 0], t: [0, 0], tt: [0, 0] };
  for (const key of ["p", "t", "tt"] as const)
    for (let q: number = 0; q < 2; q++)
      out[key][q] = w[0] * a[key][q]! + w[1] * b[key][q]!;
  return admit(out);
}

/** The whole-field product closes with total2, without source3/4. */
function product(a: Jet, b: Jet, w: Weight): Jet {
  const out: Jet = {
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

/** Only requested result vectors are required finite; no absent derivative is requested. */
function admit<T extends Phase>(out: T): T {
  if (
    !Object.values(out).every(
      (row: unknown): boolean =>
        Array.isArray(row) && row.every(Number.isFinite),
    )
  )
    throw new Error(
      "The mixed generating field has no finite requested local reading.",
    );
  return out;
}
