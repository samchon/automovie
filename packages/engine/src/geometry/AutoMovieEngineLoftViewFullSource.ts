import type {
  AutoMovieVector3Tuple,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftSurfaceJet,
  IAutoMovieLoftViewFullSource,
  IAutoMovieLoftViewRead,
  IAutoMovieLoftViewSource,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieEngineLoftAdmissionError } from "./AutoMovieEngineLoftAdmissionError";
import { AutoMovieEngineLoftFrame } from "./AutoMovieEngineLoftFrame";
import { AutoMovieEngineLoftReliefCompose } from "./AutoMovieEngineLoftReliefCompose";
import { AutoMovieEngineLoftSectionNative } from "./AutoMovieEngineLoftSectionNative";
import { AutoMovieEngineLoftViewRead } from "./AutoMovieEngineLoftViewRead";
import { AutoMovieEngineLoftViewSource } from "./AutoMovieEngineLoftViewSource";
import { loftViewWorldJet } from "./construction/internal/loftViewWorldJet";

/**
 * Original native field values and physical2 before any loft or mesh.
 * Relief/shift composition is shared with chain consumers. This reader owns no
 * emitted rows, fitted source, legacy lift or geometry process.
 */
export namespace AutoMovieEngineLoftViewFullSource {
  /** Prepare one actual direct field and its bounded caller-owned value cache. */
  export function create(
    input: IAutoMovieLoftViewFullSource.IInput,
  ): IAutoMovieLoftViewFullSource.IReader {
    const prepared: IAutoMovieLoftViewSource.IResult | null =
      AutoMovieEngineLoftViewSource.create(input);
    if (prepared === null || prepared.source === null)
      throw new AutoMovieEngineLoftAdmissionError(
        "Full native reader needs an admitted direct scalar source: " +
          JSON.stringify(prepared?.diagnostics ?? []),
      );
    const source: IAutoMovieLoftViewSource.ISource = prepared.source;
    const domain: readonly [number, number] = [
      source.domain[0],
      source.domain[1],
    ];
    const axis: IAutoMovieLoftViewFullSource.IInput["axis"] = input.axis;
    const reliefs: NonNullable<IAutoMovieLoftViewFullSource.IInput["reliefs"]> =
      [...(input.reliefs ?? [])];
    const stations: Station[] = [];

    /*
     * Each capability admits the actual owned physical domain before reading.
     */
    const admit = (s: number): void => {
      if (s < domain[0] || s > domain[1])
        throw new AutoMovieEngineLoftAdmissionError(
          "Full native query is outside its actual source domain.",
        );
    };

    /*
     * Value preparation requests no physical-station derivatives.
     */
    const station = (s: number): Station => {
      const prior: Station | undefined = stations.find(
        (entry: Station): boolean => entry.s === s,
      );
      if (prior !== undefined) return prior;
      const values: IAutoMovieLoftViewRead.IValues | string =
        AutoMovieEngineLoftViewRead.values(source, s);
      if (typeof values === "string")
        throw new AutoMovieEngineLoftAdmissionError(values);
      const frame: IAutoMovieLoftSectionFrame = axis.at(s);

      const pole: boolean = source.caps.some(
        (cap: IAutoMovieLoftViewSource.ISource["caps"][number]): boolean =>
          cap.pole === s,
      );
      if (
        pole &&
        !values.extents.every((extent: number): boolean => extent === 0)
      )
        throw new AutoMovieEngineLoftAdmissionError(
          "The original cap tip differs from its actual collapsed source.",
        );
      const next: Station = {
        s,
        frame,
        local: pole ? null : AutoMovieEngineLoftSectionNative.point(values),
      };
      stations.unshift(next);
      if (stations.length > 8) stations.pop();
      return next;
    };

    return {
      domain,
      point: (s: number, t: number): V => {
        admit(s);
        const at: Station = station(s);
        const local: [number, number] | null =
          at.local === null ? null : at.local(t);
        const p: V =
          local === null
            ? [...at.frame.origin]
            : AutoMovieEngineLoftFrame.place(at.frame, local[0], local[1]);
        AutoMovieEngineLoftReliefCompose.point(p, reliefs, s, t, at.local === null);
        return p;
      },
      jet: (s: number, t: number): IAutoMovieSolidSurface.IJet => {
        admit(s);
        if (
          source.caps.some(
            (cap: IAutoMovieLoftViewSource.ISource["caps"][number]): boolean =>
              cap.pole === s,
          )
        )
          throw new AutoMovieEngineLoftAdmissionError(
            "The collapsed original pole has no regular physical2 chart.",
          );
        const bare: IAutoMovieSolidSurface.IJet | string =
          loftViewWorldJet(source, axis, s, t);
        if (typeof bare === "string")
          throw new AutoMovieEngineLoftAdmissionError(bare);
        const full: IAutoMovieLoftSurfaceJet = {
          p: bare.p,
          s: bare.u,
          t: bare.v,
          ss: bare.uu,
          st: bare.uv,
          tt: bare.vv,
        };
        AutoMovieEngineLoftReliefCompose.jet(full, reliefs, s, t);
        return {
          p: full.p,
          u: full.s,
          v: full.t,
          uu: full.ss,
          uv: full.st,
          vv: full.tt,
        };
      },
    };
  }
}

/*
 * A fresh world coordinate or derivative vector.
 */
type V = AutoMovieVector3Tuple;

/*
 * One immutable station's Point0 preparation, without physical derivatives.
 */
interface Station {
  /*
   * Actual physical station in mm.
   */
  s: number;
  /*
   * Original axis value at that station.
   */
  frame: IAutoMovieLoftSectionFrame;
  /*
   * A declared collapsed pole has no polar point reader.
   */
  local: ReturnType<typeof AutoMovieEngineLoftSectionNative.point> | null;
}
