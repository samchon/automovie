import type { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";
import { AutoMovieStationHermite } from "./AutoMovieStationHermite";
import type { AutoMovieViewSectionField } from "./AutoMovieViewSectionField";

/** Actual or explicitly generated scalar value/physical-station derivatives. */
type Scalar = AutoMovieViewSectionField.IStationJet;

/** Eight effective native inputs, with the cap law already applied once. */
type Inputs = AutoMovieLoftViewRead.IJets;

/** Three complete rows in the transformed scalar coordinate. */
interface Controls {
  /** Eight log-extents and logit-shoulders. */
  value: number[];

  /** Their first physical station derivatives. */
  slope: number[];

  /** Their second physical station derivatives. */
  curvature: number[];
}

/**
 * A continuation-owned native generating law on one changed station span.
 *
 * @evidence contracts/common.md#principled-implementation Quintic Hermite of actual log-extent/logit-shoulder endpoint2 defines a full scalar generating field, so native total2 needs no Cartesian third/fourth mixed derivatives.
 * @evidence contracts/common.md#clear-and-simple-design Original endpoint tuples, transformed rows and one span completely determine the bridge.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not reinterpolate ordinary source spans, fit an endpoint to eight scalars, clamp a shoulder or replace an unavailable actual jet.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes continuation ownership, physical station jets, effective inputs and finite-arithmetic admission.
 * @evidence contracts/performance.md#efficient-algorithms Eight scalar transforms prepare two fixed endpoints; a read combines three eight-entry rows and applies their inverse chain rule.
 * @evidence contracts/performance.md#reuse-equivalent-work Every phase at a station reuses the resulting scalar inputs through its native station preparation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-owned fixed endpoint/control arrays have no layer-sized or global cache.
 */
export namespace AutoMovieLoftSectionBoundary {
  /**
   * Actual native-family scalar2 at one regular boundary.
   *
   * @evidence contracts/common.md#principled-implementation The eight effective scalar2 tuples describe the same native family and physical station used by the boundary.
   * @evidence contracts/common.md#clear-and-simple-design One station and the shared native input record preserve endpoint ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A composed non-native endpoint cannot acquire this type by fitting; actual physical jets must be available.
   * @evidence contracts/common.md#meaningful-documentation Inputs include cap effects once and station uses mm.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This endpoint record has no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Creation and reading own reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns eight copied scalar triples and one station.
   */
  export interface IEnd {
    /** Location in the receiving chain's physical station, mm. */
    station: number;

    /** Exact original effective endpoint2, retained without a log/exp round trip. */
    inputs: Inputs;
  }

  /**
   * One explicit positive native scalar generating field.
   *
   * @evidence contracts/common.md#principled-implementation Original endpoints and transformed Hermite rows determine the field independently of registration history.
   * @evidence contracts/common.md#clear-and-simple-design A discriminator, two endpoints and two complete transformed rows suffice.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not claim monotonicity, proximity to the replaced child span or binary64 positivity without read-time admission.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes exact endpoint tuples from the declared interior log/logit interpolation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This stored law performs no interpolation itself.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Its readers coordinate station preparation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Two endpoint records and two fixed three-row controls belong to the containing immutable chain.
   */
  export interface IBridge {
    /** Distinguishes this native-family law from any mixed generating field. */
    kind: "native";

    /** Exact lower and upper effective scalar2 boundary data. */
    ends: readonly [IEnd, IEnd];

    /** Corresponding log/logit rows with physical, rather than normalized, derivatives. */
    controls: readonly [Controls, Controls];
  }

  /**
   * Define one changed span from actual effective native scalar endpoint2.
   *
   * @evidence contracts/common.md#principled-implementation Transforms actual derivatives by the log/logit chain rule and retains their original endpoint tuples exactly.
   * @evidence contracts/common.md#clear-and-simple-design Admission, copying and fixed-size transformation are one preparation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses missing/nonfinite jets and invalid source values; no derivative limiting, fitting or fallback is selected.
   * @evidence contracts/common.md#meaningful-documentation Requires increasing physical stations and actual native-family rather than composed endpoint data.
   * @evidence contracts/performance.md#efficient-algorithms Constant eight-scalar endpoint work without phase inverses or layer traversal.
   * @evidence contracts/performance.md#reuse-equivalent-work The transformed endpoint rows serve all later station reads.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns copied endpoint/control arrays or a diagnostic and retains no caller object globally.
   */
  export function create(first: IEnd, last: IEnd): IBridge | string {
    if (
      first === null ||
      first === undefined ||
      last === null ||
      last === undefined ||
      !(
        Number.isFinite(first.station) &&
        Number.isFinite(last.station) &&
        Number.isFinite(last.station - first.station) &&
        last.station > first.station
      ) ||
      !valid(first.inputs) ||
      !valid(last.inputs)
    )
      return "A native continuation needs two increasing finite stations and actual positive extent/effective shoulder source2.";
    const a: Controls = transform(first.inputs);
    const b: Controls = transform(last.inputs);
    if (!control(a) || !control(b))
      return "The native continuation's log/logit endpoint2 is not finitely representable.";
    return {
      kind: "native",
      ends: [
        { station: first.station, inputs: copy(first.inputs) },
        { station: last.station, inputs: copy(last.inputs) },
      ],
      controls: [a, b],
    };
  }

  /**
   * Read the declared full scalar field, preserving its exact original endpoints.
   *
   * @evidence contracts/common.md#principled-implementation Physical-station quintic weights and inverse log/logit derivatives produce actual scalar2 for the native section factory.
   * @evidence contracts/common.md#clear-and-simple-design Exact-end reads and interior interpolation are explicit branches of the same declared law.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses malformed present data, outside stations, overflow/underflow and logistic endpoint saturation; no clamp or fake missing jet is used.
   * @evidence contracts/common.md#meaningful-documentation Returns effective inputs without applying the cap again; positivity is admitted in actual binary64 output.
   * @evidence contracts/performance.md#efficient-algorithms Three fixed eight-entry Hermite combinations and eight inverse transforms take constant work per station.
   * @evidence contracts/performance.md#reuse-equivalent-work The caller prepares native geometry once from this result for all of that station's phases.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Every result owns fresh triples; this owner retains no queried station.
   */
  export function read(bridge: IBridge, station: number): Inputs | string {
    const fault: string | null = admit(bridge, station);
    if (fault !== null) return fault;
    const [a, b]: readonly [IEnd, IEnd] = bridge.ends;
    if (station === a.station) return copy(a.inputs);
    if (station === b.station) return copy(b.inputs);
    const H: number = b.station - a.station;
    const u: number = (station - a.station) / H;
    const rows: number[][] = [0, 1, 2].map((order: number): number[] =>
      AutoMovieStationHermite.combine(
        bridge.controls[0],
        bridge.controls[1],
        AutoMovieStationHermite.weights(u, H, order as 0 | 1 | 2, true),
      ),
    );
    const values: Scalar[] = Array.from(
      { length: 8 },
      (_: unknown, q: number): Scalar =>
        inverse([rows[0]![q]!, rows[1]![q]!, rows[2]![q]!], q < 4),
    );
    const inputs: Inputs = {
      extents: values.slice(0, 4),
      shoulders: values.slice(4),
    };
    return valid(inputs)
      ? inputs
      : "The native continuation's effective scalar2 overflows, underflows or reaches a shoulder boundary.";
  }

  /**
   * Evaluate only the value of an already declared boundary law.
   *
   * @evidence contracts/common.md#principled-implementation The same transformed coefficient function is evaluated at order0 and inverse-transformed without computing its physical derivative outputs.
   * @evidence contracts/common.md#clear-and-simple-design Stored coefficient admission remains separate from the requested value capability.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A finite generated value survives unavailable/nonrepresentable interior physical derivatives; no derivative row is fabricated or queried.
   * @evidence contracts/common.md#meaningful-documentation Effective values include the cap once and retain exact original endpoint values.
   * @evidence contracts/performance.md#efficient-algorithms One fixed eight-entry Hermite combination and eight inverse values, without derivative weights.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the declared transformed endpoint coefficients for a value-only station plan.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns two fresh four-entry arrays and retains no query.
   */
  export function values(
    bridge: IBridge,
    station: number,
  ): AutoMovieLoftViewRead.IValues | string {
    const fault: string | null = admit(bridge, station);
    if (fault !== null) return fault;
    const [a, b]: readonly [IEnd, IEnd] = bridge.ends;
    const endpoint: Inputs | null =
      station === a.station
        ? a.inputs
        : station === b.station
          ? b.inputs
          : null;
    if (endpoint !== null)
      return {
        extents: endpoint.extents.map((jet: Scalar): number => jet[0]),
        shoulders: endpoint.shoulders.map((jet: Scalar): number => jet[0]),
      };
    const H: number = b.station - a.station;
    const row: number[] = AutoMovieStationHermite.combine(
      bridge.controls[0],
      bridge.controls[1],
      AutoMovieStationHermite.weights((station - a.station) / H, H, 0, true),
    );
    const restored: number[] = row.map((v: number, q: number): number => {
      if (q < 4) return Math.exp(v);
      const t: number = Math.exp(-Math.abs(v));
      return v >= 0 ? 1 / (1 + t) : t / (1 + t);
    });
    if (
      !restored.every(
        (v: number, q: number): boolean =>
          Number.isFinite(v) && v > 0 && (q < 4 || v < 1),
      )
    )
      return "The native continuation value overflows, underflows or reaches a shoulder boundary.";
    return { extents: restored.slice(0, 4), shoulders: restored.slice(4) };
  }

  /**
   * Re-express source2 for opposite chart direction, once before native preparation.
   *
   * @evidence contracts/common.md#principled-implementation Matching ends reflect +v/-v, reverse quarter ownership and negate the actual first station derivative; second derivatives retain their sign.
   * @evidence contracts/common.md#clear-and-simple-design One signed permutation covers the two end-direction cases.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Native geometry already contains this phase reflection afterward, so callers must not apply another minus-phi transform.
   * @evidence contracts/common.md#meaningful-documentation States station/quarter reflection separately from the native provider's internal ray reflection.
   * @evidence contracts/performance.md#efficient-algorithms Copies eight triples with constant indexing work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This value transform owns no reusable station plan.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns independent tuples and retains no source or output.
   */
  export function orient(inputs: Inputs, sign: 1 | -1): Inputs {
    if (!valid(inputs) || (sign !== 1 && sign !== -1))
      throw new Error(
        "A native endpoint reflection needs actual scalar2 and a direction sign of 1 or -1.",
      );
    if (sign === 1) return copy(inputs);
    const change: (jet: Scalar) => Scalar = (jet: Scalar): Scalar => [
      jet[0],
      -jet[1],
      jet[2],
    ];
    return {
      extents: [0, 3, 2, 1].map(
        (q: number): Scalar => change(inputs.extents[q]!),
      ),
      shoulders: [3, 2, 1, 0].map(
        (q: number): Scalar => change(inputs.shoulders[q]!),
      ),
    };
  }
}

/** Validate the explicit generating-law coefficients without evaluating a requested derivative. */
function admit(
  bridge: AutoMovieLoftSectionBoundary.IBridge,
  station: number,
): string | null {
  if (
    bridge === null ||
    bridge === undefined ||
    bridge.kind !== "native" ||
    !Array.isArray(bridge.ends) ||
    bridge.ends.length !== 2 ||
    !Array.isArray(bridge.controls) ||
    bridge.controls.length !== 2
  )
    return "The present native continuation law is malformed.";
  const [a, b]: readonly [
    AutoMovieLoftSectionBoundary.IEnd,
    AutoMovieLoftSectionBoundary.IEnd,
  ] = bridge.ends;
  if (
    a === null ||
    a === undefined ||
    b === null ||
    b === undefined ||
    !valid(a.inputs) ||
    !valid(b.inputs) ||
    !control(bridge.controls[0]) ||
    !control(bridge.controls[1]) ||
    !(
      Number.isFinite(a.station) &&
      Number.isFinite(b.station) &&
      Number.isFinite(b.station - a.station) &&
      b.station > a.station
    ) ||
    !Number.isFinite(station) ||
    station < a.station ||
    station > b.station
  )
    return "The native continuation has malformed endpoint data or an outside station.";
  if (
    !matches(a.inputs, bridge.controls[0]) ||
    !matches(b.inputs, bridge.controls[1])
  )
    return "The native continuation's transformed controls differ from its exact source endpoints.";
  return null;
}

/** Actual scalar2 admission is distinct from value-only source availability. */
function valid(inputs: Inputs): boolean {
  return (
    inputs !== null &&
    inputs !== undefined &&
    Array.isArray(inputs.extents) &&
    Array.isArray(inputs.shoulders) &&
    inputs.extents.length === 4 &&
    inputs.shoulders.length === 4 &&
    [...inputs.extents, ...inputs.shoulders].every(
      (jet: Scalar, q: number): boolean =>
        Array.isArray(jet) &&
        jet.length === 3 &&
        jet.every(Number.isFinite) &&
        jet[0] > 0 &&
        (q < 4 || jet[0] < 1),
    )
  );
}

/** Complete fixed-size transformed rows cannot silently select another interpolation law. */
function control(value: Controls): boolean {
  return (
    value !== null &&
    value !== undefined &&
    [value.value, value.slope, value.curvature].every(
      (row: number[]): boolean =>
        Array.isArray(row) && row.length === 8 && row.every(Number.isFinite),
    )
  );
}

/** Explicit value copies retain the same exact endpoint/control relation. */
function matches(inputs: Inputs, controls: Controls): boolean {
  const expected: Controls = transform(inputs);
  return expected.value.every(
    (v: number, q: number): boolean =>
      v === controls.value[q] &&
      expected.slope[q] === controls.slope[q] &&
      expected.curvature[q] === controls.curvature[q],
  );
}

/** The original exact endpoint data is never replaced by inverse-transform rounding. */
function copy(inputs: Inputs): Inputs {
  return {
    extents: inputs.extents.map((jet: Scalar): Scalar => [...jet]),
    shoulders: inputs.shoulders.map((jet: Scalar): Scalar => [...jet]),
  };
}

/** Log and logit chain rules use actual physical endpoint derivatives. */
function transform(inputs: Inputs): Controls {
  const jets: Scalar[] = [...inputs.extents, ...inputs.shoulders].map(
    (jet: Scalar, q: number): Scalar => {
      const [v, first, second]: Scalar = jet;
      if (q < 4) {
        const slope: number = first / v;
        return [Math.log(v), slope, second / v - slope * slope];
      }
      const slope: number = first / v / (1 - v);
      return [
        Math.log(v) - Math.log1p(-v),
        slope,
        second / v / (1 - v) + (2 * v - 1) * slope * slope,
      ];
    },
  );
  return {
    value: jets.map((jet: Scalar): number => jet[0]),
    slope: jets.map((jet: Scalar): number => jet[1]),
    curvature: jets.map((jet: Scalar): number => jet[2]),
  };
}

/** A stable logistic complement is computed directly rather than by subtracting a rounded one. */
function inverse(jet: Scalar, extent: boolean): Scalar {
  if (extent) {
    const value: number = Math.exp(jet[0]);
    return [value, value * jet[1], value * (jet[2] + jet[1] * jet[1])];
  }
  const t: number = Math.exp(-Math.abs(jet[0]));
  const value: number = jet[0] >= 0 ? 1 / (1 + t) : t / (1 + t);
  const complement: number = jet[0] >= 0 ? t / (1 + t) : 1 / (1 + t);
  const factor: number = value * complement;
  return [
    value,
    factor * jet[1],
    factor * (jet[2] + (complement - value) * jet[1] * jet[1]),
  ];
}
