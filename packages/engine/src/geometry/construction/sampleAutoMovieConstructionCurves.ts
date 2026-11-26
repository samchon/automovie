import type {
  IAutoMovieConstructionCurve,
  IAutoMovieConstructionRealization,
  IAutoMovieLoftChain,
  IAutoMovieSampleConstructionCurves,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieConstructionViews } from "./AutoMovieConstructionViews";

/**
 * Sample the construction lines of every lofted chain of a realization as
 * polylines in metres: its section rings, its four guide rails and its axis, so
 * an inspection can draw what a form was built from.
 *
 * Each chain is read through the surface of its own name, a map from station in
 * millimetres and phase in radians to a point in millimetres, through `point`
 * when the surface has one and `jet(...).p` otherwise. The chain's owned
 * station range is the surface's `domain`, or its first to last layer when the
 * surface names none. Points are divided by `AutoMovieConstructionViews.SCALE`,
 * so they come out in metres in the construction tree's frame.
 *
 * A `section` is the closed ring at one principal layer station inside the
 * owned range, sampled at `options.phases` uniform phases starting at phase 0,
 * and its id carries the layer's ordinal in the chain. A `guide` is the open
 * rail at one quarter phase, `0`, `pi / 2`, `pi` and `3 pi / 2` for quarters 0
 * to 3. The `axis` is the open line through the mean of each ring's samples.
 * Guides and axis share one station list: both ends of the owned range, every
 * layer station inside it, and `options.steps` equal subdivisions of each
 * interval between consecutive ones, in ascending order. A guide point is its
 * ring's sample at that quarter, so guide 0 passes through the first point of
 * every section.
 *
 * The axis is the centroid line of the sampled rings, the plain mean of
 * uniform-phase samples. It is not the authored frame origin of the chain,
 * which a section need not surround evenly, and it is neither the arc-length
 * nor the area centroid of the ring.
 *
 * A sample with a non-finite component is left out and flags its curve. An axis
 * point is left out, and the axis flagged, whenever its ring has such a sample.
 * A curve left with fewer than two points is not returned. Every curve of a
 * chain whose name equals a diagnostic's `node` is flagged. Curves come chain
 * by chain in the realization's order: sections in layer order, guides 0 to 3,
 * then the axis. A terminal multi-chart face publishes its two true section
 * loops, evaluated in the original owners' charts, without an artificial loft.
 *
 * It throws a named `Error` for `phases` that is not a whole number of at least
 * 8 that four divides, for `steps` that is not a positive whole number, for a
 * chain with no surface of its name, and for a chain whose owned range is not
 * finite and ordered. An error thrown by the surface itself propagates.
 *
 * @param realization The chains, their surfaces and the diagnostics of one
 *   realization. It is read and not changed.
 * @param options `phases` is the samples per ring, default 48. `steps` is the
 *   subdivisions of each station interval along a guide and the axis, default
 *   8.
 * @returns The curves of every chain, in the documented order.
 */
export function sampleAutoMovieConstructionCurves(
  realization: Pick<
    IAutoMovieConstructionRealization.IRealization,
    "chains" | "surfaces" | "diagnostics"
  > &
    Partial<Pick<IAutoMovieConstructionRealization.IRealization, "body">>,
  options?: IAutoMovieSampleConstructionCurves.IOptions,
): IAutoMovieConstructionCurve[] {
  /** Samples per ring. */
  const phases: number = options?.phases ?? 48;

  /** Subdivisions of each station interval along a guide and the axis. */
  const steps: number = options?.steps ?? 8;

  // Four must divide the phase count so that every quarter phase is one of the ring's own samples.
  if (!(phases >= 8 && phases % 4 === 0))
    throw new Error(
      `sampleAutoMovieConstructionCurves: phases ${phases} is not a whole number of at least 8 that four divides`,
    );
  if (!(steps >= 1))
    throw new Error(
      `sampleAutoMovieConstructionCurves: steps ${steps} is not a positive whole number`,
    );

  /** Names of the nodes a diagnostic was reported on. */
  const blamed: Set<string> = new Set();
  for (const diagnostic of realization.diagnostics) blamed.add(diagnostic.node);

  /**
   * Surface by name; the first of a name wins, which is the chain's own, listed
   * before any blend's.
   */
  const surfaces: Map<string, IAutoMovieSolidSurface> = new Map();
  for (const surface of realization.surfaces)
    if (!surfaces.has(surface.name)) surfaces.set(surface.name, surface);

  /** Every chain's curves, in the realization's chain order. */
  const curves: IAutoMovieConstructionCurve[] = [];
  const body = realization.body;
  for (const chain of realization.chains) {
    const terminal = body?.faces.find(
      ({ chain: name, terminal }) =>
        name === chain.name && terminal !== undefined,
    );
    if (terminal !== undefined && body !== undefined) {
      for (const [index, cycle] of terminal.cycles.entries()) {
        const points: number[] = [];
        let flagged = blamed.has(chain.name);
        for (const id of cycle.points) {
          const {
            chain: owner,
            chart: [u, v],
          } = body.points[id]!;
          const surface = surfaces.get(owner);
          const point = surface?.point?.(u, v) ?? surface?.jet(u, v).p;
          if (point === undefined || !point.every(Number.isFinite)) {
            flagged = true;
            continue;
          }
          points.push(
            point[0] / AutoMovieConstructionViews.SCALE,
            point[1] / AutoMovieConstructionViews.SCALE,
            point[2] / AutoMovieConstructionViews.SCALE,
          );
        }
        if (points.length >= 6)
          curves.push({
            id: chain.name + "/section/" + index,
            part: chain.name,
            kind: "section",
            points,
            closed: true,
            flagged,
          });
      }
      continue;
    }
    /** The chain's lofted surface. */
    const surface: IAutoMovieSolidSurface | undefined = surfaces.get(
      chain.name,
    );
    if (surface === undefined)
      throw new Error(
        `sampleAutoMovieConstructionCurves: chain "${chain.name}" has no surface of its name`,
      );
    for (const curve of sampleChain(
      chain,
      surface,
      phases,
      steps,
      blamed.has(chain.name),
    ))
      curves.push(curve);
  }
  return curves;
}

/**
 * The curves of one chain: its sections in layer order, its guides by quarter,
 * then its axis, without any curve left with fewer than two points.
 *
 * @param chain The chain, whose layers give the principal stations in
 *   millimetres.
 * @param surface Its lofted surface.
 * @param phases Samples per ring, a multiple of four.
 * @param steps Subdivisions of each station interval.
 * @param blamed Whether a diagnostic names this chain, which flags every curve
 *   from the start.
 * @returns The chain's curves in metres.
 */
function sampleChain(
  chain: IAutoMovieLoftChain,
  surface: IAutoMovieSolidSurface,
  phases: number,
  steps: number,
  blamed: boolean,
): IAutoMovieConstructionCurve[] {
  /** Lowest owned station, mm: the surface's own bound, else the first layer. */
  const low: number | undefined = surface.domain?.[0] ?? chain.layers[0]?.y;

  /** Highest owned station, mm: the surface's own bound, else the last layer. */
  const high: number | undefined =
    surface.domain?.[1] ?? chain.layers[chain.layers.length - 1]?.y;
  if (low === undefined || high === undefined || !(low <= high))
    throw new Error(
      `sampleAutoMovieConstructionCurves: chain "${chain.name}" owns no station range, from ${low} to ${high}`,
    );

  /**
   * Ascending stations of the guides and the axis, and per station its layer
   * ordinal or -1.
   */
  const [stations, ordinals]: [number[], number[]] = stationsOf(
    chain.layers,
    low,
    high,
    steps,
  );

  /** Section rings met so far, which is layer order because stations ascend. */
  const sections: IAutoMovieConstructionCurve[] = [];

  /** The four rails, by quarter. */
  const guides: IAutoMovieConstructionCurve[] = [0, 1, 2, 3].map(
    (quarter: number): IAutoMovieConstructionCurve => ({
      id: `${chain.name}/guide/${quarter}`,
      kind: "guide",
      part: chain.name,
      closed: false,
      points: [],
      flagged: blamed,
    }),
  );

  /** The centroid line of the sampled rings. */
  const axis: IAutoMovieConstructionCurve = {
    id: `${chain.name}/axis`,
    kind: "axis",
    part: chain.name,
    closed: false,
    points: [],
    flagged: blamed,
  };

  /** The current station's ring in metres, flat xyz; reused across stations. */
  const ring: Float64Array = new Float64Array(3 * phases);
  for (let s: number = 0; s < stations.length; ++s) {
    sampleRing(surface, stations[s]!, ring);

    // A principal layer station publishes its whole ring as a section.
    if (ordinals[s]! >= 0) {
      /** The ring's samples in phase order. */
      const points: number[] = Array.from(ring);
      sections.push({
        id: `${chain.name}/section/${ordinals[s]}`,
        kind: "section",
        part: chain.name,
        closed: true,
        points,
        flagged: blamed,
      });
    }

    // Every station extends each rail by the ring's sample at that rail's quarter.
    for (let quarter: number = 0; quarter < 4; ++quarter) {
      /** Offset of the quarter's sample in the ring. */
      const at: number = 3 * quarter * (phases / 4);

      /** The rail this quarter extends. */
      const guide: IAutoMovieConstructionCurve = guides[quarter]!;
      guide.points.push(ring[at]!, ring[at + 1]!, ring[at + 2]!);
    }

    /** Sum of the ring's samples per axis. */
    const sum: [number, number, number] = [0, 0, 0];
    for (let k: number = 0; k < phases; ++k) {
      sum[0] += ring[3 * k]!;
      sum[1] += ring[3 * k + 1]!;
      sum[2] += ring[3 * k + 2]!;
    }
    axis.points.push(sum[0] / phases, sum[1] / phases, sum[2] / phases);
  }
  return [...sections, ...guides, axis].filter(
    (curve: IAutoMovieConstructionCurve): boolean => curve.points.length >= 6,
  );
}

/**
 * The ascending stations a chain's guides and axis are sampled at, with the
 * layer ordinal of each station that is a principal layer.
 *
 * The knots are the low end, every layer station inside the range and the high
 * end, without repeats; between consecutive knots the interval is cut into
 * `steps` equal parts. A layer on an end of the range gives that end its
 * ordinal.
 *
 * @param layers The chain's layers, stations strictly increasing.
 * @param low Lowest owned station, mm.
 * @param high Highest owned station, mm, at least `low`.
 * @param steps Subdivisions of each interval between knots, a positive whole
 *   number.
 * @returns The stations in millimetres and, index for index, the layer ordinal
 *   or -1 for a station that is not a layer.
 */
function stationsOf(
  layers: IAutoMovieLoftChain.ILayer[],
  low: number,
  high: number,
  steps: number,
): [number[], number[]] {
  /** Knot stations, starting at the low end. */
  const knots: number[] = [low];

  /** Layer ordinal of each knot, or -1. */
  const owners: number[] = [-1];
  for (let ordinal: number = 0; ordinal < layers.length; ++ordinal) {
    /** This layer's station, mm. */
    const station: number = layers[ordinal]!.y;
    if (!(station >= low && station <= high)) continue;
    if (station === knots[knots.length - 1])
      owners[owners.length - 1] = ordinal;
    else {
      knots.push(station);
      owners.push(ordinal);
    }
  }
  if (high > knots[knots.length - 1]!) {
    knots.push(high);
    owners.push(-1);
  }

  /** Every sampled station, ascending. */
  const stations: number[] = [knots[0]!];

  /** Layer ordinal of each sampled station, or -1. */
  const ordinals: number[] = [owners[0]!];
  for (let k: number = 1; k < knots.length; ++k) {
    /** Lower knot of this interval. */
    const from: number = knots[k - 1]!;

    /**
     * Upper knot of this interval, written as itself so a layer station is not
     * rounded.
     */
    const to: number = knots[k]!;
    for (let j: number = 1; j < steps; ++j) {
      stations.push(from + ((to - from) * j) / steps);
      ordinals.push(-1);
    }
    stations.push(to);
    ordinals.push(owners[k]!);
  }
  return [stations, ordinals];
}

/**
 * Evaluate one ring of a surface at uniform phases into a buffer in metres.
 *
 * @param surface The surface, read through `point` when it has one and
 *   `jet(...).p` otherwise.
 * @param station The ring's station, mm.
 * @param ring Flat xyz buffer of three components per phase; its length sets
 *   the phase count.
 */
function sampleRing(
  surface: IAutoMovieSolidSurface,
  station: number,
  ring: Float64Array,
): void {
  /** Samples around the ring. */
  const phases: number = ring.length / 3;

  for (let k: number = 0; k < phases; ++k) {
    /**
     * Phase of this sample, radians; `4 k / phases` is a whole number at each
     * quarter, so a quarter is exactly `q pi / 2`.
     */
    const phase: number = (Math.PI / 2) * ((4 * k) / phases);

    /**
     * The surface's point there, mm; possibly a vector the surface reuses, so
     * it is read at once.
     */
    const point: Readonly<[number, number, number]> =
      surface.point !== undefined
        ? surface.point(station, phase)
        : surface.jet(station, phase).p;
    for (let axis: number = 0; axis < 3; ++axis)
      ring[3 * k + axis] = point[axis]! / AutoMovieConstructionViews.SCALE;
  }
}
