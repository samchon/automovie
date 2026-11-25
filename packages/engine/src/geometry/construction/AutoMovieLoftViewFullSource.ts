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
import { AutoMovieLoftSectionOriginal } from "./AutoMovieLoftSectionOriginal";
import { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";
import { AutoMovieLoftViewSource } from "./AutoMovieLoftViewSource";
import { AutoMovieLoftViewWorldJet } from "./AutoMovieLoftViewWorldJet";

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
  /** Prepare one actual direct field with independent Point0 and total2 readers. */
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
    const regular: [number, number] = [...domain];
    const hasRegularSpan: boolean =
      source.caps.every(({ pole, near, span }): boolean => {
        if (near === null || span === null || !(span > 0)) return false;
        if (pole === domain[0]) regular[0] = near;
        else if (pole === domain[1]) regular[1] = near;
        else return false;
        return true;
      }) && regular[0] < regular[1];
    const axis: IAutoMovieLoftViewFullSource.IInput["axis"] = input.axis;
    const original = input.originalSection;
    if (original !== undefined) {
      const error = AutoMovieLoftSectionOriginal.fault(
        original,
        ...domain,
        source.caps.length !== 0,
      );
      if (error !== null) throw new AutoMovieLoftAdmissionError(error);
      if (original.interior === true && (!hasRegularSpan || original.domain[0] < regular[0] || original.domain[1] > regular[1]))
        throw new AutoMovieLoftAdmissionError("The interior original section overlaps an original cap.");
    }
    const reliefs = [...AutoMovieLoftReliefCompose.sources(input)];
    const scalar: ReturnType<typeof AutoMovieLoftViewRead.prepare> =
      AutoMovieLoftViewRead.prepare(source);

    /** Each capability admits the actual owned physical domain before reading. */
    const admit = (s: number, t: number): void => {
      if (
        !Number.isFinite(s) ||
        !Number.isFinite(t) ||
        s < domain[0] ||
        s > domain[1]
      )
        throw new AutoMovieLoftAdmissionError(
          "Full native query is outside its actual source domain.",
        );
    };

    /** Value preparation requests no physical-station derivatives. */
    const station = (s: number): Station => {
      const external = AutoMovieLoftSectionOriginal.active(original, s);
      const values: IAutoMovieLoftViewRead.IValues | string | null = external
        ? null
        : scalar.values(s);
      if (typeof values === "string")
        throw new AutoMovieLoftAdmissionError(values);
      const frame: IAutoMovieLoftSectionFrame = axis.at(s);
      if (
        frame === null ||
        typeof frame !== "object" ||
        ![frame.origin, frame.u, frame.v].every(
          (row: V): boolean =>
            Array.isArray(row) &&
            row.length === 3 &&
            row.every(Number.isFinite),
        )
      )
        throw new AutoMovieLoftAdmissionError(
          "The original native axis has no finite frame value.",
        );
      const pole: boolean = source.caps.some(
        (cap: IAutoMovieLoftViewSource.ISource["caps"][number]): boolean =>
          cap.pole === s,
      );
      if (
        pole &&
        (values === null ||
          !values.extents.every((extent: number): boolean => extent === 0))
      )
        throw new AutoMovieLoftAdmissionError(
          "The original cap tip differs from its actual collapsed source.",
        );
      return {
        s,
        frame,
        local: pole
          ? null
          : external
            ? original!.pointAt?.(s) ?? ((t) => original!.point(s, t))
            : AutoMovieLoftSectionNative.point(values!),
      };
    };

    /** Place a phase in its already prepared station frame and add reliefs. */
    const point = (at: Station, t: number): V => {
      const local: [number, number] | null =
        at.local === null ? null : at.local(t);
      const p: V =
        local === null
          ? [...at.frame.origin]
          : AutoMovieLoftFrame.place(at.frame, local[0], local[1]);
      AutoMovieLoftReliefCompose.point(p, reliefs, at.s, t, at.local === null);
      if (!p.every(Number.isFinite))
        throw new AutoMovieLoftAdmissionError(
          "The full native Point0 is nonfinite.",
        );
      return p;
    };

    return {
      domain,
      regular: hasRegularSpan ? regular : null,
      point: (s: number, t: number): V => {
        admit(s, t);
        const at: Station = station(s);
        return point(at, t);
      },
      pointAt: (s: number): ((t: number) => V) => {
        admit(s, 0);
        const at: Station = station(s);
        return (t: number): V => {
          admit(s, t);
          return point(at, t);
        };
      },
      jet: (s: number, t: number): IAutoMovieSolidSurface.IJet => {
        admit(s, t);
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
          AutoMovieLoftViewWorldJet(
            source,
            axis,
            s,
            t,
            AutoMovieLoftSectionOriginal.active(original, s)
              ? original
              : undefined,
            scalar.jets,
          );
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
        if (
          !Object.values(full).every((row: V): boolean =>
            row.every(Number.isFinite),
          )
        )
          throw new AutoMovieLoftAdmissionError(
            "The complete frame/local/lift/relief total2 is nonfinite.",
          );
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
