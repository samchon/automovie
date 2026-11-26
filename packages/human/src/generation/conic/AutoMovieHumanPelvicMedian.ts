import {
  AutoMovieNaturalSpline,
  AutoMovieViewHermite,
  AutoMovieViewOutline,
  AutoMovieViewParallelAxis,
  AutoMovieViewParameter,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import type {
  IAutoMovieLoftViewFullSource,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

import type { AutoMovieHumanPelvicSplit } from "./AutoMovieHumanPelvicSplit";

/** The original anterior and posterior sagittal curves at the pelvic split. */
export namespace AutoMovieHumanPelvicMedian {
  /** The person's actual prepared parent, receiving owners and authored guide. */
  type Source = Exclude<
    ReturnType<typeof AutoMovieHumanPelvicSplit.source>,
    string
  >;

  /** Read the same native front cardinal without a near-pole station round trip. */
  export function regularFore(source: Source) {
    const part = source.parent;
    const frame = AutoMovieViewParallelAxis.source(part.axis);
    if (
      frame === null ||
      frame.origin.y.knots.some(({ station, value }) => station !== value)
    )
      throw new Error(
        "The original sagittal reference needs the body's physical station axis",
      );
    const root = source.guide.at(0.5).p;
    const floor = root[1];
    const edge = AutoMovieViewOutline.create(part.front.positive, {
      bottom: floor,
    });
    if ("detail" in edge)
      throw new Error(
        "The native sagittal edge and axis have no direct scalar readers",
      );
    const parameter = edge.parameter;
    if (parameter === undefined)
      throw new Error(
        "The original pole has no admitted radial interpolation parameter",
      );
    const start = AutoMovieViewParameter.at(parameter, source.guide.at(0).p[1]);
    const rate = -start;
    const read = (outline: typeof edge, x: number) =>
      outline.hermite === undefined
        ? AutoMovieNaturalSpline.read(outline.spline, x)
        : AutoMovieViewHermite.read(outline.hermite, x);
    const at = (t: number) => {
      const x = start * (1 - t);
      const station = AutoMovieViewParameter.station(parameter, x);
      const axis = part.axis.jet?.(station, parameter);
      if (axis === null || axis === undefined)
        throw new Error("The actual sagittal axis has no native two-jet");
      const radial = read(edge, x);
      const span =
        parameter.type === "angle" ? parameter.top - parameter.bottom : 0;
      const sign =
        parameter.type === "root" && parameter.end === "top" ? -1 : 1;
      const d =
        parameter.type === "angle" ? (span * Math.sin(x)) / 2 : 2 * sign * x;
      const dd =
        parameter.type === "angle" ? (span * Math.cos(x)) / 2 : 2 * sign;
      const point = Vec.add(
        axis.value.origin,
        Vec.scale(axis.value.u, radial[0]),
      );
      // The trunk's original Y coordinate is identity in physical station.
      // Differentiate that inverse directly in the accurate radial parameter.
      const first = Vec.combine([
        [rate, [axis.first.origin[0], d, axis.first.origin[2]]],
        [rate * radial[1], axis.value.u],
      ]);
      const second = Vec.combine([
        [rate ** 2, [axis.second.origin[0], dd, axis.second.origin[2]]],
        [rate ** 2 * radial[2], axis.value.u],
      ]);
      return { point, first, second };
    };
    return Object.assign(at, {
      parameters: { radial: parameter, axis: frame.origin.x.parameter },
    });
  }

  /**
   * Diagnostic control: follow the original front/rear cardinal traces in their
   * signed scalar coordinate. The original centred trunk axis supplies zero
   * parameter speed at this pole. The extents supply its finite speed.
   */
  export function cardinal(
    source: Source,
    parent: IAutoMovieLoftViewFullSource.IReader,
    chordMm: number,
  ) {
    const [floor] = parent.domain;
    const phases = [0, Math.PI];
    const ends = phases.map((phase) => source.input.parent.cut.point(phase));
    const root = parent.point(floor, 0);
    const direction = source.parent.axis.at(floor).u;
    const outlines = [
      source.parent.front.positive,
      source.parent.front.negative,
    ].map((outline, i) => {
      const prepared = AutoMovieViewOutline.create(outline, { bottom: floor });
      if ("detail" in prepared) throw new Error(prepared.detail);
      const pole = AutoMovieViewOutline.at(prepared, floor);
      if (typeof pole === "string") throw new Error(pole);
      const width = AutoMovieViewParameter.at(prepared.parameter, ends[i]![1]);
      const span = (4 * i - 2) * width;
      return {
        parameter: prepared.parameter,
        span,
        poleSpeed: span * pole.parameterJet[0],
      };
    });
    const speed = outlines[0]!.poleSpeed;
    const mismatch = Math.abs(speed - outlines[1]!.poleSpeed);
    if (!(speed < 0 && mismatch <= 64 * Number.EPSILON * Math.abs(speed)))
      throw new Error(
        `Native signed pole velocity is not shared: ${JSON.stringify(outlines)}`,
      );
    const at = (t: number): { p: P3; d: P3 } => {
      const i = t < 0.5 ? 0 : 1;
      const { parameter, span } = outlines[i]!;
      const s =
        t === 0 || t === 1
          ? ends[i]![1]
          : AutoMovieViewParameter.station(parameter, span * (t - 0.5));
      if (s === floor) return { p: root, d: Vec.scale(direction, speed) };
      const j = parent.jet(s, phases[i]!);
      const inverse = AutoMovieViewParameter.inverseJet(parameter, s)!;
      return { p: j.p, d: Vec.scale(j.u, span * inverse[0]) };
    };
    // The companion uses only normal acceleration. At the cap, any finite
    // second derivative of the signed AP outline lies in its own tangent
    // direction, while the inverse station sends the actual normal motion.
    const normalCurvature = (t: number, normal: P3): number => {
      const i = t < 0.5 ? 0 : 1;
      const { parameter, span } = outlines[i]!;
      const s =
        t === 0 || t === 1
          ? ends[i]![1]
          : AutoMovieViewParameter.station(parameter, span * (t - 0.5));
      if (s !== floor) {
        const curve = parent.jet(s, phases[i]!);
        return Vec.dot(curve.uu, normal) / Vec.dot(curve.u, curve.u);
      }
      const axis = source.parent.axis.jet?.(floor, parameter);
      if (axis === null || axis === undefined)
        throw new Error("The actual trunk cap has no physical axis derivative");
      return (span ** 2 * Vec.dot(axis.second.origin, normal)) / speed ** 2;
    };
    const columns = source.guide.columns;
    const chord = Vec.unit(Vec.sub(ends[1]!, ends[0]!))!;
    const sites = Array.from({ length: columns + 1 }, (_, j) =>
      at(j / columns),
    );
    const samples = sites.slice(1).map(({ p }, j) => {
      const before = sites[j]!.p;
      const centre = at((j + 0.5) / columns).p;
      const span = Vec.sub(p, before);
      return {
        projectedChord: Vec.dot(span, chord),
        chordError:
          Vec.norm(Vec.cross(Vec.sub(centre, before), span)) / Vec.norm(span),
      };
    });
    const orderingMargin = Math.min(...samples.map((a) => a.projectedChord));
    const chordError = Math.max(...samples.map((a) => a.chordError));
    const rates = source.rails.map(({ clock }) =>
      sites.map(({ p, d }) => clock.rate(p, d)),
    );
    const signedMinimum = rates.map((values): number =>
      Math.min(...values.map((rate) => rate * Math.sign(values[0]!))),
    );
    const endpoints = [
      Vec.norm(Vec.sub(at(0).p, ends[0]!)),
      Vec.norm(Vec.sub(at(1).p, ends[1]!)),
    ];
    if (
      !(
        orderingMargin > 0 &&
        chordError <= chordMm &&
        signedMinimum.every((v) => v > 0)
      )
    )
      throw new Error(
        `Native cardinal order or chord refused: ${JSON.stringify({ orderingMargin, chordError, signedMinimum, endpoints })}`,
      );
    return {
      guide: {
        ...source.guide,
        at,
        depth: Vec.dot(Vec.sub(root, ends[0]!), source.input.forward),
        orderingMargin,
      },
      normalCurvature,
      witness: {
        root,
        speed,
        mismatch,
        orderingMargin,
        chordError,
        signedMinimum,
        endpoints,
        columns,
      },
    };
  }
}
