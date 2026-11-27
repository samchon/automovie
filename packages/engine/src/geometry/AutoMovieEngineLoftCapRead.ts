import type {
  IAutoMovieLoftCapRead,
  IAutoMovieLoftCapSource,
  IAutoMovieLoftChain,
  IAutoMovieLoftPhaseReading,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftSectionPhase,
  IAutoMovieLoftViewRead,
} from "@automovie/interface";

import { AutoMovieEngineLoftAdmissionError } from "./AutoMovieEngineLoftAdmissionError";
import { AutoMovieEngineLoftCapSource } from "./AutoMovieEngineLoftCapSource";
import { AutoMovieEngineLoftFrame } from "./AutoMovieEngineLoftFrame";
import { AutoMovieEngineLoftReliefCompose } from "./AutoMovieEngineLoftReliefCompose";
import { AutoMovieEngineLoftSectionNative } from "./AutoMovieEngineLoftSectionNative";
import { AutoMovieEngineLoftViewRead } from "./AutoMovieEngineLoftViewRead";

/** Actual original-cap value and independently available physical2 preparation. */
export namespace AutoMovieEngineLoftCapRead {
  /** Prepare original cap world values/phase tangents, or null on regular rows. */
  export function phase(
    chain: IAutoMovieLoftChain,
    station: number,
  ): ((phi: number) => IAutoMovieLoftPhaseReading) | null {
    const owner: IAutoMovieLoftCapSource.ISource | null =
      AutoMovieEngineLoftCapSource.at(chain, station);
    if (owner === null) return null;
    const inputs: IAutoMovieLoftViewRead.IValues | string =
      AutoMovieEngineLoftViewRead.values(chain.nativeSource!.data, station);
    if (typeof inputs === "string")
      throw new AutoMovieEngineLoftAdmissionError(inputs);
    const frame: IAutoMovieLoftSectionFrame = owner.axis.at(station);
    const collapsed: boolean =
      station === owner.station &&
      inputs.extents.every((x: number): boolean => x === 0);
    if (
      station === owner.station &&
      (!collapsed ||
        frame.origin.some(
          (x: number, k: number): boolean => x !== owner.point[k],
        ))
    )
      throw new AutoMovieEngineLoftAdmissionError(
        "The original cap tip differs from its actual collapsed source.",
      );
    const local: ((phi: number) => IAutoMovieLoftSectionPhase) | null =
      collapsed ? null : AutoMovieEngineLoftSectionNative.phase(inputs);
    return (phi: number): IAutoMovieLoftPhaseReading => {
      let p: [number, number, number];
      let t: [number, number, number];
      if (local === null) {
        p = [...owner.point];
        t = [0, 0, 0];
      } else {
        const at: ReturnType<typeof local> = local(phi);
        p = AutoMovieEngineLoftFrame.place(frame, at.p[0], at.p[1]);
        t = [0, 1, 2].map(
          (k: number): number => at.t[0] * frame.u[k]! + at.t[1] * frame.v[k]!,
        ) as [number, number, number];
      }
      AutoMovieEngineLoftReliefCompose.phase(
        { p, t },
        chain.reliefs ?? [],
        station,
        phi,
        collapsed,
      );
      return { p, t };
    };
  }

  /**
   * Prepare original positive-cap local2 and actual frame2, independently of
   * Point0.
   */
  export function jet(
    chain: IAutoMovieLoftChain,
    station: number,
  ): IAutoMovieLoftCapRead.IJetResult {
    const owner: IAutoMovieLoftCapSource.ISource | null =
      AutoMovieEngineLoftCapSource.at(chain, station);
    if (owner === null) return null;
    if (station === owner.station)
      throw new AutoMovieEngineLoftAdmissionError(
        "The collapsed original pole has no regular physical2 chart.",
      );
    const inputs: IAutoMovieLoftViewRead.IJets | string =
      AutoMovieEngineLoftViewRead.jets(chain.nativeSource!.data, station);
    if (typeof inputs === "string")
      throw new AutoMovieEngineLoftAdmissionError(inputs);
    if (owner.axis.jet === undefined)
      throw new AutoMovieEngineLoftAdmissionError(
        "The original cap axis has no physical2 owner.",
      );
    const frame: ReturnType<NonNullable<typeof owner.axis.jet>> =
      owner.axis.jet(station);
    if (
      frame === null ||
      ![frame.value, frame.first, frame.second].every(finite)
    )
      throw new AutoMovieEngineLoftAdmissionError(
        "The original cap axis has no finite physical2 at this station.",
      );
    return {
      native: AutoMovieEngineLoftSectionNative.jet(inputs),
      f: [frame.value, frame.first, frame.second].map(
        (value: IAutoMovieLoftSectionFrame): number[] => [
          ...value.origin,
          ...value.u,
          ...value.v,
        ],
      ),
    };
  }
}

/*
 * Finite returned frame data is distinct from a callback throwing its own
 * error.
 */
function finite(frame: IAutoMovieLoftSectionFrame): boolean {
  return [frame.origin, frame.u, frame.v].every(
    (row: number[]): boolean => row.length === 3,
  );
}
