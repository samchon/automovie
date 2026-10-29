import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { AutoMovieHumanBodyWarpField } from "./AutoMovieHumanBodyWarpField";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/** Request-local, borrowed observations of the actual generation path. */
export namespace AutoMovieHumanBodyObservation {
  /** Stages of the same law evaluation, without a parallel reconstruction. */
  export type Stage = "source" | "field" | "preJoin" | "final";

  /** Optional execution observer; callbacks must not mutate or retain whole bodies. */
  export interface IObserver {
    /** Explicit chain selection; no anatomical name is special-cased. */
    readonly chains: ReadonlySet<string>;
    /** Read selected values synchronously from the same execution's borrowed references. */
    readonly stage: (
      name: Stage,
      body: Readonly<IAutoMovieHumanBodyCalibration>,
      field: Readonly<AutoMovieHumanBodyWarpField.IField> | null,
    ) => void;
    /** Actual selected join execution, not an independently rerun join. */
    readonly join?: (summary: IJoin) => void;
  }

  /** Station support used by the existing join's layer-based fade rule. */
  export interface ISupport {
    /** Child endpoint station in its own chart. */
    childStation: number;
    /** First inward layer, whose interval receives the endpoint slope change. */
    adjacentStation: number | null;
    /** Second inward layer used by the existing reach rule. */
    secondStation: number | null;
    /** Existing fade reach in child station units. */
    reach: number;
    /** Station where the existing positional fade ends. */
    fadeEndStation: number;
  }

  /** Bounded scalar summary of one selected positional join execution. */
  export interface IJoin extends ISupport {
    /** Actual parent chain name. */
    parent: string;
    /** Actual child chain name. */
    child: string;
    /** Existing event direction. */
    direction: "down" | "up";
    /** Actual parent endpoint station. */
    parentStation: number;
    /** Number of end-ring samples visited by the producer. */
    sampleCount: number;
    /** Samples inside the producer's existing SNAP distance. */
    withinSnap: number;
    /** Samples with a non-finite distance or movement, never reported as finite. */
    invalidSamples: number;
    /** Smallest finite nearest-ring distance in calibration mm. */
    minDistance?: number;
    /** Largest finite nearest-ring distance in calibration mm. */
    maxDistance?: number;
    /** Largest finite requested movement in calibration mm. */
    maxMove?: number;
    /** Whether the producer took its positional movement path. */
    applied: boolean;
  }

  /** Existing layer-index support, shared by the producer and its inspection. */
  export function support(
    child: IAutoMovieHumanLoftChain,
    direction: "down" | "up",
    minimumReach: number,
  ): ISupport {
    const k: number = direction === "down" ? child.layers.length - 1 : 0;
    const step: number = direction === "down" ? -1 : 1;
    const station: number = child.layers[k]!.y;
    const adjacent: number | null = child.layers[k + step]?.y ?? null;
    const second: number | null = child.layers[k + 2 * step]?.y ?? null;
    const reach: number = Math.max(
      minimumReach, second === null ? 0 : 1.5 * Math.abs(second - station),
    );
    return {
      childStation: station, adjacentStation: adjacent, secondStation: second,
      reach, fadeEndStation: station + step * reach,
    };
  }

  /** Selected sample accumulator; it is local to one already executing join. */
  export interface ICounter {
    /** Record the distance and movement the producer already computed. */
    record: (distance: number, within: boolean, movementLength: number) => void;
    /** Emit once after the producer chooses its movement branch. */
    finish: (applied: boolean) => void;
  }

  /** Allocate no accumulator when observation is absent or this event is unselected. */
  export function begin(
    observer: IObserver | undefined,
    parent: IAutoMovieHumanLoftChain,
    child: IAutoMovieHumanLoftChain,
    direction: "down" | "up",
    minimumReach: number,
  ): ICounter | undefined {
    if (observer?.join === undefined ||
      !(observer.chains.has(parent.name) || observer.chains.has(child.name)))
      return undefined;
    const receive: (summary: IJoin) => void = observer.join;
    let count: number = 0;
    let within: number = 0;
    let invalid: number = 0;
    let lo: number = Infinity;
    let hi: number = -Infinity;
    let maximumMove: number = -Infinity;
    return {
      record: (distance: number, inside: boolean, length: number): void => {
        count++;
        if (inside) within++;
        if (!Number.isFinite(distance) || !Number.isFinite(length)) { invalid++; return; }
        lo = Math.min(lo, distance);
        hi = Math.max(hi, distance);
        maximumMove = Math.max(maximumMove, length);
      },
      finish: (applied: boolean): void => receive({
        ...support(child, direction, minimumReach),
        parent: parent.name, child: child.name, direction,
        parentStation: direction === "down"
          ? parent.layers[0]!.y : parent.layers[parent.layers.length - 1]!.y,
        sampleCount: count, withinSnap: within, invalidSamples: invalid, applied,
        ...(Number.isFinite(lo) ? { minDistance: lo } : {}),
        ...(Number.isFinite(hi) ? { maxDistance: hi } : {}),
        ...(Number.isFinite(maximumMove) ? { maxMove: maximumMove } : {}),
      }),
    };
  }
}
