import {
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewRead,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanHeadTapeSource,
  IAutoMovieHumanHeadTapeStation,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftSectionNative,
  IAutoMovieLoftViewRead,
  IAutoMovieLoftViewSource,
  IAutoMovieViewOutline,
  IAutoMovieViewPart,
} from "@automovie/interface";

/** Call-owned exact-station numeric preparation for actual head-tape queries. */
export namespace AutoMovieHumanHeadTapeStation {
  /**
   * Own the actual scalar values once; numeric conics remain a lazy explicit
   * point/phase operation after the original axis callback. Available frames
   * and every physical2 requirement stay with their real consumers.
   */
  export function prepare(
    reader: IAutoMovieHumanHeadTapeSource.IReader,
    station: number,
  ): IAutoMovieHumanHeadTapeStation.IPrepared {
    const inputs: IAutoMovieLoftViewRead.IValues | string =
      AutoMovieLoftViewRead.values(reader.source, station);
    if (typeof inputs === "string")
      throw new Error(`Head tape original value: ${inputs}`);
    let curve: IAutoMovieLoftSectionNative.ICurve | undefined;
    let pointReader: ((phase: number) => AutoMovieVector3Tuple) | undefined;

    /*
     * Only an explicit actual evaluation constructs this immutable numeric
     * station.
     */
    const native: () => IAutoMovieLoftSectionNative.ICurve =
      (): IAutoMovieLoftSectionNative.ICurve => {
        curve ??= AutoMovieLoftSectionNative.curve(inputs);
        return curve;
      };
    return {
      reader,
      station,
      point(phase: number): AutoMovieVector3Tuple {
        if (pointReader !== undefined) return pointReader(phase);
        const frame: IAutoMovieLoftSectionFrame = reader.part.axis.at(station);
        function read(phi: number): AutoMovieVector3Tuple {
          return vector(frame, native().point(phi)).map(
            (x: number, i: number): number => x + frame.origin[i]!,
          ) as AutoMovieVector3Tuple;
        }
        const value: AutoMovieVector3Tuple = read(phase);
        pointReader = read;
        return value;
      },
      value(phase: number): IAutoMovieHumanHeadTapeStation.IReading {
        const frame: IAutoMovieLoftSectionFrame = reader.part.axis.at(station);
        const local: IAutoMovieHumanHeadTapeStation.IReading["local"] =
          native().phase(phase);
        const point: AutoMovieVector3Tuple = vector(frame, local.p).map(
          (x: number, i: number): number => x + frame.origin[i]!,
        ) as AutoMovieVector3Tuple;
        return { point, frame, local };
      },
    };
  }

  /**
   * Share only exact unchanged endpoints, and carry an arbitrary selected
   * bracket trial directly into its final phase read. No trial-station map,
   * failed preparation, whole part or physical Hessian is cached.
   */
  export function create(
    reader: IAutoMovieHumanHeadTapeSource.IReader,
    ends: IAutoMovieHumanHeadTapeStation.CreateEnds,
  ): IAutoMovieHumanHeadTapeStation.IOutput {
    const endpoints: Map<number, IAutoMovieHumanHeadTapeStation.IPrepared> =
      new Map();

    /*
     * A new arbitrary station is transient until a successful endpoint query.
     */
    function at(station: number): IAutoMovieHumanHeadTapeStation.IPrepared {
      return endpoints.get(station) ?? prepare(reader, station);
    }

    /*
     * Retention follows successful evaluation and is bounded by the two actual
     * endpoints.
     */
    function retain(source: IAutoMovieHumanHeadTapeStation.IPrepared): void {
      if (source.station === ends[0] || source.station === ends[1])
        endpoints.set(source.station, source);
    }
    return {
      point(
        station: number,
        phase: number,
      ): IAutoMovieHumanHeadTapeStation.IValue {
        const source: IAutoMovieHumanHeadTapeStation.IPrepared = at(station);
        const point: AutoMovieVector3Tuple = source.point(phase);
        retain(source);
        return { point, source };
      },
      value(
        station: number,
        phase: number,
        selected?: IAutoMovieHumanHeadTapeStation.IPrepared,
      ): IAutoMovieHumanHeadTapeStation.IReading {
        const source: IAutoMovieHumanHeadTapeStation.IPrepared =
          selected ?? at(station);
        if (source.reader !== reader || source.station !== station)
          throw new Error(
            "Head tape selected station belongs to another source trial",
          );
        const value: IAutoMovieHumanHeadTapeStation.IReading =
          source.value(phase);
        retain(source);
        return value;
      },
    };
  }

  /**
   * Keep quadrature inside each original scalar span instead of integrating
   * across its knot planes.
   */
  export function partition(
    reader: IAutoMovieHumanHeadTapeSource.IReader,
    plane: IAutoMovieHumanHeadTapeSource.IPlane,
  ): number[] {
    const cuts: number[] = [
      0,
      Math.PI / 2,
      Math.PI,
      (3 * Math.PI) / 2,
      2 * Math.PI,
    ];
    if (plane.b === 0) return cuts;
    const fields: readonly IAutoMovieViewOutline.IOutline[] = [
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
        ...fields.flatMap((outline: IAutoMovieViewOutline.IOutline): number[] =>
          outline.knots.map(
            (knot: IAutoMovieViewPart.IKnot): number => knot.station,
          ),
        ),
        ...reader.source.caps.flatMap(
          (cap: IAutoMovieLoftViewSource.ISource["caps"][number]): number[] =>
            cap.near === null ? [cap.pole] : [cap.pole, cap.near],
        ),
      ]),
    ].filter(
      (station: number): boolean =>
        station > plane.range[0] && station < plane.range[1],
    );
    for (const station of stations) {
      const inputs: IAutoMovieLoftViewRead.IValues | string =
        AutoMovieLoftViewRead.values(reader.source, station);
      if (typeof inputs === "string")
        throw new Error(`Head tape original span: ${inputs}`);
      const native: ReturnType<typeof AutoMovieLoftSectionNative.point> =
        AutoMovieLoftSectionNative.point(inputs);
      const frame: IAutoMovieLoftSectionFrame = reader.part.axis.at(station);
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
      function residual(phase: number): number {
        const local: ReturnType<typeof native> = native(phase);
        const point: AutoMovieVector3Tuple = vector(frame, local).map(
          (x: number, i: number): number => x + frame.origin[i]!,
        ) as AutoMovieVector3Tuple;
        return point[1] - plane.a - plane.b * point[0];
      }
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
    frame: IAutoMovieLoftSectionFrame,
    local: IAutoMovieHumanHeadTapeStation.VectorLocal,
  ): AutoMovieVector3Tuple {
    return frame.u.map(
      (x: number, i: number): number => x * local[0] + frame.v[i]! * local[1],
    ) as AutoMovieVector3Tuple;
  }
}
