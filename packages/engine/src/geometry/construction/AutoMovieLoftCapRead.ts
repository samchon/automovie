import type {
  IAutoMovieLoftCapRead,
  IAutoMovieLoftCapSource,
  IAutoMovieLoftChain,
  IAutoMovieLoftPhaseReading,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftSectionPhase,
  IAutoMovieLoftViewRead,
} from "@automovie/interface";

import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieLoftCapSource } from "./AutoMovieLoftCapSource";
import { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieLoftReliefCompose } from "./AutoMovieLoftReliefCompose";
import { AutoMovieLoftSectionNative } from "./AutoMovieLoftSectionNative";
import { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";

/** One chain operation's cap owner search. */
type Owners = ReturnType<typeof AutoMovieLoftCapSource.prepare>;

/** Phase and total2 station readers within a prepared cap ownership scope. */
interface IReader {
  /** Prepare actual value and phase tangent at an owned cap station. */
  phase(station: number): ((phi: number) => IAutoMovieLoftPhaseReading) | null;
  /** Prepare positive-cap physical2 at an owned cap station. */
  jet(station: number): IAutoMovieLoftCapRead.IJetResult;
}

/** Actual original-cap value and independently available physical2 preparation. */
export namespace AutoMovieLoftCapRead {
  /**
   * Prepare the cap and scalar ownership for repeated reads of an immutable
   * chain.
   */
  export function prepare(chain: IAutoMovieLoftChain, owners: Owners): IReader {
    const source: ReturnType<typeof AutoMovieLoftViewRead.prepare> | undefined =
      chain.nativeSource === undefined
        ? undefined
        : AutoMovieLoftViewRead.prepare(chain.nativeSource.data);
    return {
      phase: (station: number): ReturnType<IReader["phase"]> =>
        phaseOf(chain, station, owners.at(station), source),
      jet: (station: number): IAutoMovieLoftCapRead.IJetResult =>
        jetOf(chain, station, owners.at(station), source),
    };
  }

  /** Prepare original cap world values/phase tangents, or null on regular rows. */
  export function phase(
    chain: IAutoMovieLoftChain,
    station: number,
  ): ((phi: number) => IAutoMovieLoftPhaseReading) | null {
    return phaseOf(chain, station, AutoMovieLoftCapSource.at(chain, station));
  }

  /** Read one cap station after the owning interval has been selected. */
  function phaseOf(
    chain: IAutoMovieLoftChain,
    station: number,
    owner: IAutoMovieLoftCapSource.ISource | null,
    source?: ReturnType<typeof AutoMovieLoftViewRead.prepare>,
  ): ReturnType<IReader["phase"]> {
    if (owner === null) return null;
    const inputs: IAutoMovieLoftViewRead.IValues | string =
      source?.values(station) ??
      AutoMovieLoftViewRead.values(chain.nativeSource!.data, station);
    if (typeof inputs === "string")
      throw new AutoMovieLoftAdmissionError(inputs);
    const frame: IAutoMovieLoftSectionFrame = owner.axis.at(station);
    if (!finite(frame))
      throw new AutoMovieLoftAdmissionError(
        "The original cap axis has no finite frame value.",
      );
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
      throw new AutoMovieLoftAdmissionError(
        "The original cap tip differs from its actual collapsed source.",
      );
    const local: ((phi: number) => IAutoMovieLoftSectionPhase) | null =
      collapsed ? null : AutoMovieLoftSectionNative.phase(inputs);
    const reliefs = AutoMovieLoftReliefCompose.sources(chain);
    return (phi: number): IAutoMovieLoftPhaseReading => {
      if (!Number.isFinite(phi))
        throw new AutoMovieLoftAdmissionError("A cap phase must be finite.");
      let p: [number, number, number];
      let t: [number, number, number];
      if (local === null) {
        p = [...owner.point];
        t = [0, 0, 0];
      } else {
        const at: ReturnType<typeof local> = local(phi);
        p = AutoMovieLoftFrame.place(frame, at.p[0], at.p[1]);
        t = [0, 1, 2].map(
          (k: number): number => at.t[0] * frame.u[k]! + at.t[1] * frame.v[k]!,
        ) as [number, number, number];
      }
      AutoMovieLoftReliefCompose.phase(
        { p, t },
        reliefs,
        station,
        phi,
        collapsed,
      );
      if (![...p, ...t].every(Number.isFinite))
        throw new AutoMovieLoftAdmissionError(
          "The original cap world value/phase is nonfinite.",
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
    return jetOf(chain, station, AutoMovieLoftCapSource.at(chain, station));
  }

  /** Read one positive cap's jet after the owning interval has been selected. */
  function jetOf(
    chain: IAutoMovieLoftChain,
    station: number,
    owner: IAutoMovieLoftCapSource.ISource | null,
    source?: ReturnType<typeof AutoMovieLoftViewRead.prepare>,
  ): IAutoMovieLoftCapRead.IJetResult {
    if (owner === null) return null;
    if (station === owner.station)
      throw new AutoMovieLoftAdmissionError(
        "The collapsed original pole has no regular physical2 chart.",
      );
    const inputs: IAutoMovieLoftViewRead.IJets | string =
      source?.jets(station) ??
      AutoMovieLoftViewRead.jets(chain.nativeSource!.data, station);
    if (typeof inputs === "string")
      throw new AutoMovieLoftAdmissionError(inputs);
    if (typeof owner.axis.jet !== "function")
      throw new AutoMovieLoftAdmissionError(
        "The original cap axis has no physical2 owner.",
      );
    const frame: ReturnType<NonNullable<typeof owner.axis.jet>> =
      owner.axis.jet(station);
    if (
      frame === null ||
      ![frame.value, frame.first, frame.second].every(finite)
    )
      throw new AutoMovieLoftAdmissionError(
        "The original cap axis has no finite physical2 at this station.",
      );
    return {
      native: AutoMovieLoftSectionNative.jet(inputs),
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

/**
 * Finite returned frame data is distinct from a callback throwing its own
 * error.
 */
function finite(frame: IAutoMovieLoftSectionFrame): boolean {
  return [frame.origin, frame.u, frame.v].every(
    (row: number[]): boolean => row.length === 3 && row.every(Number.isFinite),
  );
}
