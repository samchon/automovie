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
import { AutoMovieLoftViewWorldJet } from "./AutoMovieLoftViewWorldJet";

/** A fresh world coordinate or derivative vector. */
type V = AutoMovieVector3Tuple;

/**
 * Original native field values and physical2 before any loft or mesh.
 * Relief/shift composition is shared with chain consumers. This reader owns no
 * emitted rows, fitted source, legacy lift or geometry process.
 */
export namespace AutoMovieLoftViewFullSource {
  /** Prepare the actual direct field and provide station-scoped point readers. */
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
    /** Each capability admits the actual owned physical domain before reading. */
    const admit = (s: number): void => {
      if (s < domain[0] || s > domain[1])
        throw new AutoMovieLoftAdmissionError(
          "Full native query is outside its actual source domain.",
        );
    };

    /** Value preparation requests no physical-station derivatives. */
    const pointAt = (s: number): ((t: number) => V) => {
      admit(s);
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
      const sample = pole ? null : AutoMovieLoftSectionNative.point(values);
      return (t: number): V => {
        const local = sample === null ? null : sample(t);
        const p: V =
          local === null
            ? [...frame.origin]
            : AutoMovieLoftFrame.place(frame, local[0], local[1]);
        AutoMovieLoftReliefCompose.point(p, reliefs, s, t, pole);
        return p;
      };
    };

    return {
      domain,
      pointAt,
      point: (s: number, t: number): V => pointAt(s)(t),
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
