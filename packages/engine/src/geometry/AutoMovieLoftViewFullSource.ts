import type {
  AutoMovieVector3Tuple,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftSurfaceJet,
  IAutoMovieLoftViewFullSource,
  IAutoMovieLoftViewRead,
  IAutoMovieLoftViewSource,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieLoftReliefCompose } from "./AutoMovieLoftReliefCompose";
import { AutoMovieLoftSectionNative } from "./AutoMovieLoftSectionNative";
import { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";
import { AutoMovieLoftViewSource } from "./AutoMovieLoftViewSource";
import { AutoMovieLoftViewWorldJet } from "./construction/internal/AutoMovieLoftViewWorldJet";

/** A fresh world coordinate or derivative vector. */
type V = AutoMovieVector3Tuple;

/** One immutable station's Point0 preparation, without physical derivatives. */
interface Station {
  /** Actual physical station in mm. */
  s: number;
  /** Original axis value at that station. */
  frame: IAutoMovieLoftSectionFrame;
  /** A declared collapsed pole has no polar point reader. */
  local: ReturnType<typeof AutoMovieLoftSectionNative.point> | null;
}

/**
 * Original native field values and physical2 before any loft or mesh.
 * Relief/shift composition is shared with chain consumers. This reader owns no
 * emitted rows, fitted source, legacy lift or geometry process.
 */
export namespace AutoMovieLoftViewFullSource {
  /** Prepare one actual direct field and its bounded caller-owned value cache. */
  export function create(
    input: IAutoMovieLoftViewFullSource.IInput,
  ): IAutoMovieLoftViewFullSource.IReader {
    const prepared: IAutoMovieLoftViewSource.IResult | null =
      AutoMovieLoftViewSource.create(input);
    if (prepared === null || prepared.source === null)
      throw new AutoMovieLoftAdmissionError(
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

    /** Each capability admits the actual owned physical domain before reading. */
    const admit = (s: number): void => {
      if (s < domain[0] || s > domain[1])
        throw new AutoMovieLoftAdmissionError(
          "Full native query is outside its actual source domain.",
        );
    };

    /** Value preparation requests no physical-station derivatives. */
    const station = (s: number): Station => {
      const prior: Station | undefined = stations.find(
        (entry: Station): boolean => entry.s === s,
      );
      if (prior !== undefined) return prior;
      const values: IAutoMovieLoftViewRead.IValues | string =
        AutoMovieLoftViewRead.values(source, s);
      if (typeof values === "string")
        throw new AutoMovieLoftAdmissionError(values);
      const frame: IAutoMovieLoftSectionFrame = axis.at(s);

      const pole: boolean = source.caps.some(
        (cap: IAutoMovieLoftViewSource.ISource["caps"][number]): boolean =>
          cap.pole === s,
      );
      if (
        pole &&
        !values.extents.every((extent: number): boolean => extent === 0)
      )
        throw new AutoMovieLoftAdmissionError(
          "The original cap tip differs from its actual collapsed source.",
        );
      const next: Station = {
        s,
        frame,
        local: pole ? null : AutoMovieLoftSectionNative.point(values),
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
            : AutoMovieLoftFrame.place(at.frame, local[0], local[1]);
        AutoMovieLoftReliefCompose.point(p, reliefs, s, t, at.local === null);
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
          throw new AutoMovieLoftAdmissionError(
            "The collapsed original pole has no regular physical2 chart.",
          );
        const bare: IAutoMovieSolidSurface.IJet | string =
          AutoMovieLoftViewWorldJet(source, axis, s, t);
        if (typeof bare === "string")
          throw new AutoMovieLoftAdmissionError(bare);
        const full: IAutoMovieLoftSurfaceJet = {
          p: bare.p,
          s: bare.u,
          t: bare.v,
          ss: bare.uu,
          st: bare.uv,
          tt: bare.vv,
        };
        AutoMovieLoftReliefCompose.jet(full, reliefs, s, t);
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
