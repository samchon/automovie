import { AutoMovieLoftSectionNative, AutoMovieLoftViewRead, type AutoMovieLoftFrame, type AutoMovieLoftViewSource, type AutoMovieViewOutline, type IAutoMovieViewPart } from "@automovie/engine";
import type { AutoMovieHumanHeadTapeSource } from "./AutoMovieHumanHeadTapeSource";

type Vec3 = [number, number, number];

/** Call-owned exact-station numeric preparation for actual head-tape queries. */
export namespace AutoMovieHumanHeadTapeStation {
  /** An actual value query and the identical station that produced it. */
  export interface IValue {
    /** Original world point, calibration mm. */
    point: Vec3;

    /** Same input/station preparation, not another inverse trial. */
    source: IPrepared;
  }

  /** Complete phase reading before the separate physical source2 request. */
  export interface IReading {
    /** Original world point, calibration mm. */
    point: Vec3;

    /** Actual current world frame; phase reads do not borrow an inverse trial's frame. */
    frame: AutoMovieLoftFrame.IFrame;

    /** Same native point and its first two phase derivatives. */
    local: ReturnType<ReturnType<typeof AutoMovieLoftSectionNative.phase>>;
  }

  /** One original numeric station; no inverse solve or physical2 is hidden in it. */
  export interface IPrepared {
    /** Actual unchanged original reader owning this station. */
    readonly reader: AutoMovieHumanHeadTapeSource.IReader;

    /** Original physical station, calibration mm. */
    readonly station: number;

    /** Point0 inversion retains its exact prepared frame after a successful first read. */
    point(phase: number): Vec3;

    /** Explicit phase demand reads its actual frame and shares only the numeric native source. */
    value(phase: number): IReading;
  }

  /** One measured course retains only its two successful endpoint preparations. */
  export interface IOutput {
    /** Actual Point0 and the source that produced this bracket trial. */
    point(station: number, phase: number): IValue;

    /** Read phase data from the selected trial, or its actual endpoint station. */
    value(station: number, phase: number, selected?: IPrepared): IReading;
  }

  /**
   * Own the actual scalar values once; numeric conics remain a lazy explicit
   * point/phase operation after the original axis callback. Available frames
   * and every physical2 requirement stay with their real consumers.
   */
  export function prepare(reader: AutoMovieHumanHeadTapeSource.IReader, station: number): IPrepared {
    const inputs: AutoMovieLoftViewRead.IValues | string = AutoMovieLoftViewRead.values(reader.source, station);
    if (typeof inputs === "string") throw new Error(`Head tape original value: ${inputs}`);
    let curve: AutoMovieLoftSectionNative.ICurve | undefined;
    let pointReader: ((phase: number) => Vec3) | undefined;

    /** Only an explicit actual evaluation constructs this immutable numeric station. */
    const native: () => AutoMovieLoftSectionNative.ICurve = (): AutoMovieLoftSectionNative.ICurve => {
      curve ??= AutoMovieLoftSectionNative.curve(inputs);
      return curve;
    };
    return {
      reader, station,
      point(phase: number): Vec3 {
        if (pointReader !== undefined) return pointReader(phase);
        const frame: AutoMovieLoftFrame.IFrame = reader.part.axis.at(station);
        const read: (phi: number) => Vec3 = (phi: number): Vec3 =>
          vector(frame, native().point(phi)).map((x: number, i: number): number => x + frame.origin[i]!) as Vec3;
        const value: Vec3 = read(phase);
        pointReader = read;
        return value;
      },
      value(phase: number): IReading {
        const frame: AutoMovieLoftFrame.IFrame = reader.part.axis.at(station);
        const local: IReading["local"] = native().phase(phase);
        const point: Vec3 = vector(frame, local.p).map((x: number, i: number): number => x + frame.origin[i]!) as Vec3;
        return { point, frame, local };
      },
    };
  }

  /**
   * Share only exact unchanged endpoints, and carry an arbitrary selected
   * bracket trial directly into its final phase read. No trial-station map,
   * failed preparation, whole part or physical Hessian is cached.
   */
  export function create(reader: AutoMovieHumanHeadTapeSource.IReader, ends: readonly [number, number]): IOutput {
    const endpoints: Map<number, IPrepared> = new Map();

    /** A new arbitrary station is transient until a successful endpoint query. */
    const at: (station: number) => IPrepared = (station: number): IPrepared =>
      endpoints.get(station) ?? prepare(reader, station);

    /** Retention follows successful evaluation and is bounded by the two actual endpoints. */
    const retain: (source: IPrepared) => void = (source: IPrepared): void => {
      if (source.station === ends[0] || source.station === ends[1]) endpoints.set(source.station, source);
    };
    return {
      point(station: number, phase: number): IValue {
        const source: IPrepared = at(station);
        const point: Vec3 = source.point(phase);
        retain(source);
        return { point, source };
      },
      value(station: number, phase: number, selected?: IPrepared): IReading {
        const source: IPrepared = selected ?? at(station);
        if (source.reader !== reader || source.station !== station)
          throw new Error("Head tape selected station belongs to another source trial");
        const value: IReading = source.value(phase);
        retain(source);
        return value;
      },
    };
  }

  /** Keep quadrature inside each original scalar span instead of integrating across its knot planes. */
  export function partition(reader: AutoMovieHumanHeadTapeSource.IReader, plane: AutoMovieHumanHeadTapeSource.IPlane): number[] {
    const cuts: number[] = [
      0,
      Math.PI / 2,
      Math.PI,
      (3 * Math.PI) / 2,
      2 * Math.PI,
    ];
    if (plane.b === 0) return cuts;
    const fields: readonly AutoMovieViewOutline.IOutline[] = [
      ...reader.source.extents,
      ...(reader.source.fullness.kind === "top"
        ? reader.source.fullness.shoulders
        : [
            reader.source.fullness.owner,
            ...(reader.source.fullness.departures ?? []),
          ]),
    ];
    const stations: number[] = [
      ...new Set([
        ...reader.part.stations,
        ...fields.flatMap((outline: AutoMovieViewOutline.IOutline): number[] =>
          outline.knots.map(
            (knot: IAutoMovieViewPart.IKnot): number => knot.station,
          ),
        ),
        ...reader.source.caps.flatMap(
          (cap: AutoMovieLoftViewSource.ISource["caps"][number]): number[] =>
            cap.near === null ? [cap.pole] : [cap.pole, cap.near],
        ),
      ]),
    ].filter(
      (station: number): boolean =>
        station > plane.range[0] && station < plane.range[1],
    );
    for (const station of stations) {
      const inputs: AutoMovieLoftViewRead.IValues | string =
        AutoMovieLoftViewRead.values(reader.source, station);
      if (typeof inputs === "string")
        throw new Error(`Head tape original span: ${inputs}`);
      const native: ReturnType<typeof AutoMovieLoftSectionNative.point> =
        AutoMovieLoftSectionNative.point(inputs);
      const frame: AutoMovieLoftFrame.IFrame = reader.part.axis.at(station);
      if (
        Math.hypot(
          frame.u[0] - 1,
          frame.u[1],
          frame.u[2],
          frame.v[0],
          frame.v[1],
          frame.v[2] - 1,
        ) >
        64 * Number.EPSILON
      )
        throw new Error(
          "Head tape source-span partition requires its authored upright X/Z chart",
        );
      const residual: (phase: number) => number = (phase: number): number => {
        const local: ReturnType<typeof native> = native(phase);
        const point: Vec3 = vector(frame, local).map(
          (x: number, i: number): number => x + frame.origin[i]!,
        ) as Vec3;
        return point[1] - plane.a - plane.b * point[0];
      };
      for (let quarter: number = 0; quarter < 4; quarter++) {
        let low: number = (quarter * Math.PI) / 2;
        let high: number = ((quarter + 1) * Math.PI) / 2;
        const start: number = residual(low);
        const end: number = residual(high);
        if (start === 0) cuts.push(low);
        if (end === 0) cuts.push(high);
        if (start === 0 || end === 0 || start > 0 === end > 0) continue;
        for (let iteration: number = 0; iteration < 56; iteration++) {
          const middle: number = (low + high) / 2;
          if (middle === low || middle === high) break;
          if (residual(middle) > 0 === start > 0) low = middle;
          else high = middle;
        }
        cuts.push((low + high) / 2);
      }
    }
    return [...new Set(cuts)].sort((a: number, b: number): number => a - b);
  }


  /** Restore a native local vector without an origin translation. */
  export function vector(
    frame: AutoMovieLoftFrame.IFrame,
    local: readonly [number, number],
  ): Vec3 {
    return frame.u.map(
      (x: number, i: number): number => x * local[0] + frame.v[i]! * local[1],
    ) as Vec3;
  }


}
