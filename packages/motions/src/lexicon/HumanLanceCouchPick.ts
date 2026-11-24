import { StrikingRoll } from "../striking/StrikingRoll";
import { HumanLanceCouchCarriage } from "./HumanLanceCouchCarriage";

/**
 * The least-turning carriage the arm's own fit holds within
 * `StrikingRoll.MISS`, of the first `HumanLanceCouchPick.TRIES`, or undefined,
 * with the least miss read, which a refusal reports.
 */
export function HumanLanceCouchPick(
  options: readonly HumanLanceCouchPick.IOption[],
  reaches: (laid: HumanLanceCouchCarriage.ICarriage) => number,
): HumanLanceCouchPick.IPick {
  const ordered: HumanLanceCouchPick.IOption[] = [...options].sort(
    (a: HumanLanceCouchPick.IOption, b: HumanLanceCouchPick.IOption): number =>
      a.turn - b.turn,
  );
  let miss: number = Infinity;
  for (const option of ordered.slice(0, HumanLanceCouchPick.TRIES)) {
    const read: number = reaches(option.laid);
    miss = Math.min(miss, read);
    if (read <= StrikingRoll.MISS) return { laid: option.laid, miss };
  }
  return { laid: undefined, miss };
}

/** `HumanLanceCouchPick` and its records. */
export namespace HumanLanceCouchPick {
  /**
   * How many of the least-turning carriages are tried against the arm's own fit
   * (provisional: the fit is the costliest step).
   */
  export const TRIES: number = 12;

  /**
   * A carriage found, and how far its hand turns from the one it is weighed
   * against, radians.
   */
  export interface IOption {
    /** The carriage. */
    laid: HumanLanceCouchCarriage.ICarriage;

    /** Its hand's turn. */
    turn: number;
  }

  /**
   * What `HumanLanceCouchPick` found: the carriage, if any, and the least miss
   * it read.
   */
  export interface IPick {
    /** The least-turning carriage the arm's own fit holds, or undefined. */
    laid: HumanLanceCouchCarriage.ICarriage | undefined;

    /** The least miss read over the tried carriages, metres; for a refusal. */
    miss: number;
  }
}
