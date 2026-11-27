import type {
  IAutoMovieConicArcField,
  IAutoMovieConicFieldJet,
  IAutoMovieLoftSectionJet,
  IAutoMovieLoftSectionNative,
  IAutoMovieLoftSectionPhase,
  IAutoMovieLoftViewRead,
  IAutoMoviePolarSector,
  IAutoMovieViewChain,
  IAutoMovieViewConic,
  IAutoMovieViewSectionField,
} from "@automovie/interface";

import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieViewChain } from "./AutoMovieViewChain";
import { AutoMovieViewConic } from "./AutoMovieViewConic";
import { AutoMovieViewSectionField } from "./AutoMovieViewSectionField";
import { AutoMovieViewSectionReading } from "./AutoMovieViewSectionReading";

/**
 * Cartesian readings of the original native scalar generating field. Explicit
 * numeric rejection uses the internal admission error; exceptions raised by
 * input getters are not intercepted or reclassified here.
 *
 * A source that declares touch offsets or quarter split points
 * (`IAutoMovieViewPart.ITop`) is read as its conic chain
 * (`AutoMovieViewChain`): the guide on support line q stands at its extent
 * along the chart axis and its touch offset across it, with the tangent of that
 * support line; each split point of a quarter stands at its own (u, v) with the
 * tangent at its angle, in the quarter's order; each arc keeps its own
 * shoulder. Every chain reading takes its point and direction from the chain's
 * one ray reader, so Point0 and value read the arc point alone and the
 * derivative capabilities add their jets on that same ray. The chain is G1, so
 * its radius is C1 in phase; at a join whose curvatures differ the second phase
 * derivatives are the starting arc's alone. Such a source therefore has no
 * eight-scalar boundary law (`AutoMovieLoftSectionBoundary` refuses it) and its
 * loft declares C1 (`AutoMovieViewLoft`). A source without them keeps the
 * four-quarter reading unchanged.
 */
export namespace AutoMovieLoftSectionNative {
  /**
   * Prepare the numeric source once when a consumer needs Point0 inversion and
   * a later phase tangent.
   */
  export function curve(
    inputs: IAutoMovieLoftViewRead.IValues,
  ): IAutoMovieLoftSectionNative.ICurve {
    if (declares(inputs)) {
      const input: IAutoMovieViewChain.IFieldInput = need(valued(inputs));
      return {
        point: chainPoint(section(input)),
        phase: chainPhase(reader(input)),
      };
    }
    const geometry: IAutoMovieViewConic.ICurve = prepare(inputs);
    return { point: pointFrom(geometry), phase: phaseFrom(geometry) };
  }

  /** Prepare finite value/phase geometry using NUMBER alone. */
  export function phase(
    inputs: IAutoMovieLoftViewRead.IValues,
  ): (phi: number) => IAutoMovieLoftSectionPhase {
    if (declares(inputs)) return chainPhase(reader(need(valued(inputs))));
    return phaseFrom(prepare(inputs));
  }

  /** Prepare the existing radial phase jet without inspection partitions. */
  export function radial(
    inputs: IAutoMovieLoftViewRead.IValues,
  ): (phi: number) => IAutoMoviePolarSector.Jet {
    if (declares(inputs)) {
      const input: IAutoMovieViewChain.IFieldInput | string = valued(inputs);
      const read: Reader | string =
        typeof input === "string" ? input : AutoMovieViewChain.jets(input);
      if (typeof read === "string")
        return (): IAutoMoviePolarSector.Jet => [NaN, NaN, NaN];
      return (phi: number): IAutoMoviePolarSector.Jet => {
        const at: IAutoMovieViewChain.IReading | null = read(phi);
        return at === null
          ? [NaN, NaN, NaN]
          : [at.radial[0], at.radial[2], at.radial[5]];
      };
    }
    const geometry: IAutoMovieViewConic.ICurve = prepare(inputs);
    return (phi: number): IAutoMoviePolarSector.Jet =>
      AutoMovieViewConic.radius(geometry, phi);
  }

  /** Prepare the original radius value required by scalar dimension constraints. */
  export function value(
    inputs: IAutoMovieLoftViewRead.IValues,
  ): (phi: number) => number {
    if (declares(inputs)) {
      const input: IAutoMovieViewChain.IFieldInput | string = valued(inputs);
      if (typeof input === "string") return (): number => NaN;
      const chain: IAutoMovieViewChain.ISection = AutoMovieViewChain.of(
        AutoMovieViewChain.primal(input),
      );
      return (phi: number): number => AutoMovieViewChain.radius(chain, phi);
    }
    const geometry: IAutoMovieViewConic.ICurve = prepare(inputs);
    return (phi: number): number => AutoMovieViewConic.value(geometry, phi);
  }

  /** The numeric chain of a source declaring touch offsets or split points. */
  export function chain(
    inputs: IAutoMovieLoftViewRead.IValues,
  ): IAutoMovieViewChain.ISection | string {
    if (!declares(inputs))
      return "the source declares no touch offset or split; it is a four-quarter section";
    const input: IAutoMovieViewChain.IFieldInput | string = valued(inputs);
    if (typeof input === "string") return input;
    const prepared: IAutoMovieViewChain.ISection = AutoMovieViewChain.of(
      AutoMovieViewChain.primal(input),
    );
    return prepared.fault ?? prepared;
  }

  /** Prepare exactly the finite Cartesian value capability of the native source. */
  export function point(
    inputs: IAutoMovieLoftViewRead.IValues,
  ): (phi: number) => [number, number] {
    if (declares(inputs)) return chainPoint(section(need(valued(inputs))));
    return pointFrom(prepare(inputs));
  }

  /** Prepare actual physical source2 and retain its one numeric primal lookup. */
  export function jet(
    inputs: IAutoMovieLoftViewRead.IJets,
  ): (phi: number) => IAutoMovieLoftSectionJet {
    if (declares(inputs)) {
      const read: Reader = reader(
        need(
          controls(
            inputs.extents,
            inputs.shoulders,
            inputs.touch,
            need(lists(inputs.splits, inputs.pieces)),
          ),
        ),
      );
      return (phi: number): IAutoMovieLoftSectionJet => {
        const at: IAutoMovieViewChain.IReading = met(read, phi);
        return cartesianJet(towards(at.point), at.radial);
      };
    }
    const source:
      | IAutoMovieViewSectionField.IPrepared
      | IAutoMovieConicArcField.IFailure = AutoMovieViewSectionField.prepare(
      inputs.extents,
      inputs.shoulders,
    );
    if (source.kind === "failure")
      throw new AutoMovieLoftAdmissionError(
        `Native physical source2: ${source.detail}`,
      );

    /*
     * Successful metadata validation of these unexposed, copied numeric
     * records.
     */
    let verified: boolean = false;
    return (phi: number): IAutoMovieLoftSectionJet => {
      const ray: IAutoMovieViewConic.IRay = locate(source.geometry, phi);
      const fault: string | null = verified
        ? null
        : AutoMovieViewSectionReading.validate(source);
      if (fault === null) verified = true;
      const radial: IAutoMovieViewSectionField.IRead =
        fault === null
          ? AutoMovieViewSectionReading.evaluate(source, ray)
          : { kind: "failure", detail: fault };
      if ("kind" in radial)
        throw new AutoMovieLoftAdmissionError(
          `Native physical source2: ${radial.detail}`,
        );
      return cartesianJet(direction(ray), radial);
    };
  }
}

/*
 * The same primal point supplies its normalized radial and quarter rotation.
 */
interface Direction {
  p: [number, number];
  radial: [number, number];
  turn: [number, number];
}

/*
 * A scalar `[value, ds, dss]` in physical station mm.
 */
type Station = IAutoMovieViewSectionField.IStationJet;

/*
 * A chain's phase reader.
 */
type Reader = (phi: number) => IAutoMovieViewChain.IReading | null;

/*
 * A source declaring touch offsets, splits or split lists is read as its chain.
 */
function declares(inputs: {
  touch?: unknown;
  splits?: unknown;
  pieces?: unknown;
}): boolean {
  return (
    inputs.touch !== undefined ||
    inputs.splits !== undefined ||
    inputs.pieces !== undefined
  );
}

/*
 * Each quarter's ordered split points: one split as a one-point list, a split
 * list as it stands; a source declaring both is refused.
 */
function lists<T>(
  splits: readonly T[] | undefined,
  pieces: readonly (readonly T[])[] | undefined,
): (readonly T[])[] | undefined | string {
  if (splits !== undefined && pieces !== undefined)
    return "the source declares both one split per quarter and a split list per quarter";
  if (splits !== undefined) return splits.map((split: T): T[] => [split]);
  return pieces === undefined
    ? undefined
    : pieces.map((list: readonly T[]): readonly T[] => list);
}

/*
 * A chain fault is an admission refusal for the readers that require a section.
 */
function need<T>(value: T | string): T {
  if (typeof value === "string")
    throw new AutoMovieLoftAdmissionError(
      `Native split-quarter chain: ${value}`,
    );
  return value;
}

/*
 * A value-only source's chain inputs at constant station jets.
 */
function valued(
  inputs: IAutoMovieLoftViewRead.IValues,
): IAutoMovieViewChain.IFieldInput | string {
  const lift = (v: number): Station => [v, 0, 0];
  const quarters: (readonly number[][])[] | undefined | string = lists(
    inputs.splits,
    inputs.pieces,
  );
  if (typeof quarters === "string") return quarters;
  return controls(
    inputs.extents.map(lift),
    inputs.shoulders.map(lift),
    inputs.touch?.map(lift),
    quarters?.map((list: readonly number[][]): Station[][] =>
      list.map((split: number[]): Station[] => split.map(lift)),
    ),
  );
}

/*
 * The view source's chain at one station: guide q on its support line at its
 * extent along the chart axis and its touch offset (the `v` of the `+u`/`-u`
 * guides, the `u` of the `+v`/`-v` guides) across it, tangent along that line
 * in increasing phase; then quarter q's split points in order, each at its (u,
 * v) with the tangent at its angle; the arcs' shoulders in chain order (the
 * quarter's own shoulder for the arc leaving its guide, each split point's
 * shoulder for the arc it starts).
 */
function controls(
  extents: readonly Station[],
  shoulders: readonly Station[],
  touch: readonly Station[] | undefined,
  quarters: readonly (readonly (readonly Station[])[])[] | undefined,
): IAutoMovieViewChain.IFieldInput | string {
  if (
    extents.length !== 4 ||
    shoulders.length !== 4 ||
    (touch !== undefined && touch.length !== 4) ||
    (quarters !== undefined &&
      (quarters.length !== 4 ||
        quarters.some((list: readonly (readonly Station[])[]): boolean =>
          list.some((split: readonly Station[]): boolean => split.length !== 4),
        )))
  )
    return "a chain section needs four extents, shoulders and touch offsets and four quarters of four-role split points";
  type R = IAutoMovieConicFieldJet.IJet;
  const J = AutoMovieConicFieldJet.fromStation;
  const constant = (c: number): R => [c, 0, 0, 0, 0, 0];
  const negate = (j: R): R => [-j[0], -j[1], -j[2], -j[3], -j[4], -j[5]];
  const across = (q: number): R =>
    touch === undefined ? constant(0) : J(touch[q]!);
  const guides: [R, R][] = [
    [J(extents[0]!), across(0)],
    [across(1), J(extents[1]!)],
    [negate(J(extents[2]!)), across(2)],
    [across(3), negate(J(extents[3]!))],
  ];
  const lines: [number, number][] = [
    [0, 1],
    [-1, 0],
    [0, -1],
    [1, 0],
  ];
  const points: [R, R][] = [];
  const tangents: [R, R][] = [];
  const pieces: R[] = [];
  for (let q: number = 0; q < 4; ++q) {
    points.push(guides[q]!);
    tangents.push([constant(lines[q]![0]), constant(lines[q]![1])]);
    pieces.push(J(shoulders[q]!));
    for (const split of quarters?.[q] ?? []) {
      const [u, v, angle, shoulder] = split as readonly [
        Station,
        Station,
        Station,
        Station,
      ];

      // cos and sin of the angle's station jet, by the chain rule.
      const [a, a1, a2] = angle;
      const c: number = Math.cos(a);
      const s: number = Math.sin(a);
      points.push([J(u), J(v)]);
      tangents.push([
        J([c, -s * a1, -c * a1 * a1 - s * a2]),
        J([s, c * a1, -s * a1 * a1 + c * a2]),
      ]);
      pieces.push(J(shoulder));
    }
  }
  return { points, tangents, shoulders: pieces };
}

/*
 * The admitted numeric chain of these inputs.
 */
function section(
  input: IAutoMovieViewChain.IFieldInput,
): IAutoMovieViewChain.ISection {
  const chain: IAutoMovieViewChain.ISection = AutoMovieViewChain.of(
    AutoMovieViewChain.primal(input),
  );
  if (chain.fault !== null)
    throw new AutoMovieLoftAdmissionError(
      `Native split-quarter chain: ${chain.fault}`,
    );
  return chain;
}

/*
 * The admitted jet reader of these inputs.
 */
function reader(input: IAutoMovieViewChain.IFieldInput): Reader {
  return need(AutoMovieViewChain.jets(input));
}

/*
 * A met ray's reading, or the refusal.
 */
function met(read: Reader, phi: number): IAutoMovieViewChain.IReading {
  const at: IAutoMovieViewChain.IReading | null = read(phi);
  if (at === null)
    throw new AutoMovieLoftAdmissionError(
      "The split-quarter chain has no admitted finite phase reading.",
    );
  return at;
}

/*
 * Point0 of a chain: its ray reader's arc point, with no derivative.
 */
function chainPoint(
  chain: IAutoMovieViewChain.ISection,
): (phi: number) => [number, number] {
  return (phi: number): [number, number] => {
    const at: IAutoMovieViewChain.IRead | null = AutoMovieViewChain.read(
      chain,
      phi,
    );
    if (at === null)
      throw new AutoMovieLoftAdmissionError(
        "The split-quarter chain has no admitted finite phase reading.",
      );
    return towards(at.point).p;
  };
}

/*
 * A chain's point and its first two phase derivatives on its ray reader's
 * direction.
 */
function chainPhase(read: Reader): (phi: number) => IAutoMovieLoftSectionPhase {
  return (phi: number): IAutoMovieLoftSectionPhase => {
    const at: IAutoMovieViewChain.IReading = met(read, phi);
    return polarPhase(towards(at.point), [
      at.radial[0],
      at.radial[2],
      at.radial[5],
    ]);
  };
}

/*
 * The direction of an arc point, admitted finite and away from the course
 * point.
 */
function towards(point: readonly [number, number]): Direction {
  const size: number = Math.hypot(point[0], point[1]);
  if (!(size > 0))
    throw new AutoMovieLoftAdmissionError(
      "The native primal point has no finite positive norm.",
    );
  const radial: [number, number] = [point[0] / size, point[1] / size];
  return { p: [point[0], point[1]], radial, turn: [-radial[1], radial[0]] };
}

/*
 * The six Cartesian vectors of a radial Hessian `[r, s, phi, ss, sphi, phiphi]`
 * along one ray.
 */
function cartesianJet(
  at: Direction,
  radial: readonly number[],
): IAutoMovieLoftSectionJet {
  const value: IAutoMovieLoftSectionPhase = polarPhase(at, [
    radial[0]!,
    radial[2]!,
    radial[5]!,
  ]);
  return admit({
    ...value,
    s: [radial[1]! * at.radial[0], radial[1]! * at.radial[1]],
    ss: [radial[3]! * at.radial[0], radial[3]! * at.radial[1]],
    st: [
      radial[4]! * at.radial[0] + radial[1]! * at.turn[0],
      radial[4]! * at.radial[1] + radial[1]! * at.turn[1],
    ],
  });
}

/*
 * Share one caller-owned numeric station without changing this capability's
 * admission.
 */
function phaseFrom(
  geometry: IAutoMovieViewConic.ICurve,
): (phi: number) => IAutoMovieLoftSectionPhase {
  if (geometry.failure !== null)
    throw new AutoMovieLoftAdmissionError(
      `Native value source: ${geometry.failure}`,
    );
  return (phi: number): IAutoMovieLoftSectionPhase => {
    const ray: IAutoMovieViewConic.IRay = locate(geometry, phi);
    const at: Direction = direction(ray);
    return polarPhase(at, ray.radial);
  };
}

/*
 * Share one caller-owned numeric station without changing this capability's
 * admission.
 */
function pointFrom(
  geometry: IAutoMovieViewConic.ICurve,
): (phi: number) => [number, number] {
  if (geometry.failure !== null)
    throw new AutoMovieLoftAdmissionError(
      `Native value source: ${geometry.failure}`,
    );
  return (phi: number): [number, number] => {
    const ray: Pick<IAutoMovieViewConic.IRay, "point" | "quarter"> | null =
      AutoMovieViewConic.point(geometry, phi);
    if (ray === null)
      throw new AutoMovieLoftAdmissionError(
        "The native source has no admitted finite phase reading.",
      );
    const p: [number, number] = cartesian(ray);
    const size: number = Math.hypot(p[0], p[1]);
    if (!(size > 0))
      throw new AutoMovieLoftAdmissionError(
        "The native primal point has no finite positive norm.",
      );
    return p;
  };
}

/*
 * The shared geometry-only preparation preserves NUMBER operation and input
 * order.
 */
function prepare(
  inputs: IAutoMovieLoftViewRead.IValues,
): IAutoMovieViewConic.ICurve {
  const ops: IAutoMovieConicFieldJet.IAlgebra<number> =
    AutoMovieConicFieldJet.NUMBER;
  const extents: IAutoMovieLoftViewRead.IValues["extents"] = inputs.extents;
  const shoulders: IAutoMovieLoftViewRead.IValues["shoulders"] =
    inputs.shoulders;
  const curvatures: [number, number, number, number] =
    AutoMovieViewConic.curvatures(ops, inputs.extents, inputs.shoulders);
  const geometry: IAutoMovieViewConic.ICurve =
    AutoMovieViewConic.prepareGeometry(ops, extents, shoulders, curvatures);
  if (geometry.failure === null) return geometry;

  // This tuple was computed by this numeric preparation. Do not reread
  // caller-owned extent/shoulder accessors to decorate a failed result.
  // Report the curvature operands without another solve.
  return {
    ...geometry,
    failure: geometry.failure + "; operands=" + JSON.stringify({ curvatures }),
  };
}

/*
 * Forward the raw requested phase to its one numeric owner, including tiny
 * negative distances.
 */
function locate(
  geometry: IAutoMovieViewConic.ICurve,
  phi: number,
): IAutoMovieViewConic.IRay {
  const ray: IAutoMovieViewConic.IRay | null = AutoMovieViewConic.read(
    geometry,
    phi,
  );
  if (ray === null)
    throw new AutoMovieLoftAdmissionError(
      "The native source has no admitted finite phase reading.",
    );
  return ray;
}

/*
 * Quarter rotations are exact sign/swaps; the native inverse has already
 * restored its own reflection.
 */
function direction(ray: IAutoMovieViewConic.IRay): Direction {
  const p: [number, number] = cartesian(ray);
  const size: number = Math.hypot(p[0], p[1]);
  if (!(size > 0))
    throw new AutoMovieLoftAdmissionError(
      "The native primal point has no finite positive norm.",
    );
  const radial: [number, number] = [p[0] / size, p[1] / size];
  return { p, radial, turn: [-radial[1], radial[0]] };
}

/*
 * Preserve the exact quarter sign/swaps, including signed zero, for both
 * capabilities.
 */
function cartesian(
  ray: Pick<IAutoMovieViewConic.IRay, "point" | "quarter">,
): [number, number] {
  const [x, z]: readonly [number, number] = ray.point;
  return ray.quarter === 0
    ? [x, z]
    : ray.quarter === 1
      ? [-z, x]
      : ray.quarter === 2
        ? [-x, -z]
        : [z, -x];
}

/*
 * Exactly value/phase/phase2 of rho*er; physical source partials are not
 * required here.
 */
function polarPhase(
  at: Direction,
  radial: readonly [number, number, number],
): IAutoMovieLoftSectionPhase {
  return admit({
    p: [...at.p],
    t: [
      radial[1] * at.radial[0] + radial[0] * at.turn[0],
      radial[1] * at.radial[1] + radial[0] * at.turn[1],
    ],
    tt: [
      (radial[2] - radial[0]) * at.radial[0] + 2 * radial[1] * at.turn[0],
      (radial[2] - radial[0]) * at.radial[1] + 2 * radial[1] * at.turn[1],
    ],
  });
}

/*
 * Each capability validates exactly its required returned vectors after
 * conversion.
 */
function admit<T extends IAutoMovieLoftSectionPhase>(out: T): T {
  return out;
}
