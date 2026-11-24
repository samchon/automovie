import type {
  IAutoMovieLoftSectionBoundary,
  IAutoMovieLoftSectionBoundaryControls,
  IAutoMovieLoftViewRead,
  IAutoMovieViewSectionField,
} from "@automovie/interface";

import { overflowsBinary64 } from "../../math/overflowsBinary64";
import { AutoMovieStationHermite } from "./AutoMovieStationHermite";

/** Actual or explicitly generated scalar value/physical-station derivatives. */
type Scalar = IAutoMovieViewSectionField.IStationJet;

/**
 * A continuation-owned native generating law on one changed station span.
 *
 * A source declaring touch offsets or quarter splits is a G1 conic chain
 * (`AutoMovieViewChain`), whose phase reading is C1 with sided second
 * derivatives at its joins and whose inputs are more than these eight scalars;
 * it has no law here, and every entry refuses it by name rather than carrying
 * its four-quarter part alone.
 */
export namespace AutoMovieLoftSectionBoundary {
  /** Define one changed span from actual effective native scalar endpoint2. */
  export function create(
    first: IAutoMovieLoftSectionBoundary.IEnd,
    last: IAutoMovieLoftSectionBoundary.IEnd,
  ): IAutoMovieLoftSectionBoundary.IBridge | string {
    if (chained(first?.inputs) || chained(last?.inputs)) return CHAIN;
    if (
      first === null ||
      first === undefined ||
      last === null ||
      last === undefined ||
      !(last.station > first.station) ||
      !valid(first.inputs) ||
      !valid(last.inputs)
    )
      return "A native continuation needs two increasing finite stations and actual positive extent/effective shoulder source2.";
    const a: IAutoMovieLoftSectionBoundaryControls = transform(first.inputs);
    const b: IAutoMovieLoftSectionBoundaryControls = transform(last.inputs);
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
   * Read the declared full scalar field, preserving its exact original
   * endpoints.
   */
  export function read(
    bridge: IAutoMovieLoftSectionBoundary.IBridge,
    station: number,
  ): IAutoMovieLoftViewRead.IJets | string {
    const fault: string | null = admit(bridge, station);
    if (fault !== null) return fault;
    const [a, b]: readonly [
      IAutoMovieLoftSectionBoundary.IEnd,
      IAutoMovieLoftSectionBoundary.IEnd,
    ] = bridge.ends;
    if (station === a.station) return copy(a.inputs);
    if (station === b.station) return copy(b.inputs);
    const H: number = b.station - a.station;
    // The second station derivative scales by 1 / H^2, which a span this
    // narrow cannot hold in binary64.
    if (overflowsBinary64(1 / (H * H)))
      return "The native continuation's physical second derivative is not representable over this span.";
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
    const inputs: IAutoMovieLoftViewRead.IJets = {
      extents: values.slice(0, 4),
      shoulders: values.slice(4),
    };
    return valid(inputs)
      ? inputs
      : "The native continuation's effective scalar2 overflows, underflows or reaches a shoulder boundary.";
  }

  /** Evaluate only the value of an already declared boundary law. */
  export function values(
    bridge: IAutoMovieLoftSectionBoundary.IBridge,
    station: number,
  ): IAutoMovieLoftViewRead.IValues | string {
    const fault: string | null = admit(bridge, station);
    if (fault !== null) return fault;
    const [a, b]: readonly [
      IAutoMovieLoftSectionBoundary.IEnd,
      IAutoMovieLoftSectionBoundary.IEnd,
    ] = bridge.ends;
    const endpoint: IAutoMovieLoftViewRead.IJets | null =
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
        (v: number, q: number): boolean => v > 0 && (q < 4 || v < 1),
      )
    )
      return "The native continuation value overflows, underflows or reaches a shoulder boundary.";
    return { extents: restored.slice(0, 4), shoulders: restored.slice(4) };
  }

  /**
   * Re-express source2 for opposite chart direction, once before native
   * preparation.
   */
  export function orient(
    inputs: IAutoMovieLoftViewRead.IJets,
    sign: 1 | -1,
  ): IAutoMovieLoftViewRead.IJets {
    if (chained(inputs)) throw new Error(CHAIN);
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

/** The refusal of a chain source at a boundary. */
const CHAIN: string =
  "A touch-offset or split-quarter source is a G1 conic chain, phase C1 with sided second derivatives at its joins; it has no eight-scalar boundary law.";

/** Inputs declaring touch offsets or splits belong to a chain. */
function chained(
  inputs: IAutoMovieLoftViewRead.IJets | null | undefined,
): boolean {
  return (
    inputs !== null &&
    inputs !== undefined &&
    (inputs.touch !== undefined ||
      inputs.splits !== undefined ||
      inputs.pieces !== undefined)
  );
}

/**
 * Validate the explicit generating-law coefficients without evaluating a
 * requested derivative.
 */
function admit(
  bridge: IAutoMovieLoftSectionBoundary.IBridge,
  station: number,
): string | null {
  if (
    bridge === null ||
    bridge === undefined ||
    bridge.kind !== "native" ||
    bridge.ends.length !== 2 ||
    bridge.controls.length !== 2
  )
    return "The present native continuation law is malformed.";
  const [a, b]: readonly [
    IAutoMovieLoftSectionBoundary.IEnd,
    IAutoMovieLoftSectionBoundary.IEnd,
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
    !(b.station > a.station) ||
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

/**
 * Actual scalar2 admission is distinct from value-only source availability; a
 * chain's inputs are not eight scalars.
 */
function valid(inputs: IAutoMovieLoftViewRead.IJets): boolean {
  return (
    inputs !== null &&
    inputs !== undefined &&
    !chained(inputs) &&
    inputs.extents.length === 4 &&
    inputs.shoulders.length === 4 &&
    [...inputs.extents, ...inputs.shoulders].every(
      (jet: Scalar, q: number): boolean =>
        jet.length === 3 && jet[0] > 0 && (q < 4 || jet[0] < 1),
    )
  );
}

/**
 * Complete fixed-size transformed rows cannot silently select another
 * interpolation law.
 */
function control(value: IAutoMovieLoftSectionBoundaryControls): boolean {
  return (
    value !== null &&
    value !== undefined &&
    [value.value, value.slope, value.curvature].every(
      (row: number[]): boolean => row.length === 8,
    )
  );
}

/** Explicit value copies retain the same exact endpoint/control relation. */
function matches(
  inputs: IAutoMovieLoftViewRead.IJets,
  controls: IAutoMovieLoftSectionBoundaryControls,
): boolean {
  const expected: IAutoMovieLoftSectionBoundaryControls = transform(inputs);
  return expected.value.every(
    (v: number, q: number): boolean =>
      v === controls.value[q] &&
      expected.slope[q] === controls.slope[q] &&
      expected.curvature[q] === controls.curvature[q],
  );
}

/**
 * The original exact endpoint data is never replaced by inverse-transform
 * rounding.
 */
function copy(
  inputs: IAutoMovieLoftViewRead.IJets,
): IAutoMovieLoftViewRead.IJets {
  return {
    extents: inputs.extents.map((jet: Scalar): Scalar => [...jet]),
    shoulders: inputs.shoulders.map((jet: Scalar): Scalar => [...jet]),
  };
}

/** Log and logit chain rules use actual physical endpoint derivatives. */
function transform(
  inputs: IAutoMovieLoftViewRead.IJets,
): IAutoMovieLoftSectionBoundaryControls {
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

/**
 * A stable logistic complement is computed directly rather than by subtracting
 * a rounded one.
 */
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
