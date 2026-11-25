import type {
  IAutoMovieBodyMeasure,
  IAutoMovieMotionHumanKneel,
} from "@automovie/interface";

import { walkRoot } from "../actions/walkRoot";
import { kneel } from "./kneel";

/**
 * A kneel's phase table: down through its keys (`stepBack`, `lowering`,
 * `kneeContact`, `secondKnee`, each `kneel.PHASES` long scaled by the square
 * root of the hip height over the walk's reference, Alexander 1984), the kind's
 * contact marks, the hold, and, when it rises, the way back up through the same
 * keys at the same lengths.
 *
 * @param m The body's measures.
 * @param keys The kneel's key count.
 * @param kind The kneel's kind.
 * @param marks The kind's contact marks at the bottom key.
 * @param hold The hold, seconds.
 * @param rise Whether it rises again.
 * @returns The phases in order.
 */
export function kneelPhaseTable(
  m: Pick<IAutoMovieBodyMeasure, "hipHeight">,
  keys: number,
  kind: IAutoMovieMotionHumanKneel.Kind,
  marks: readonly string[],
  hold: number,
  rise: boolean,
): kneelPhaseTable.IPhase[] {
  const scale: number = Math.sqrt(m.hipHeight / walkRoot.REFERENCE_HIP);
  const downNames: readonly [string, number][] = [
    ["stepBack", kneel.PHASES.step],
    ["lowering", kneel.PHASES.lower],
    ["kneeContact", kneel.PHASES.second],
    ["secondKnee", kneel.PHASES.sit],
  ];
  const phases: kneelPhaseTable.IPhase[] = [];
  for (let i: number = 0; i + 1 < keys; i++)
    phases.push({
      name: downNames[i]![0],
      seconds: downNames[i]![1] * scale,
      from: i,
      to: i + 1,
    });
  const bottom: number = keys - 1;
  for (const mark of marks)
    phases.push({ name: mark, seconds: 0, from: bottom, to: bottom });
  phases.push({ name: "settled", seconds: hold, from: bottom, to: bottom });
  if (rise) {
    const upNames: readonly string[] =
      kind === "one"
        ? ["kneeOff", "stepForward"]
        : kind === "both"
          ? ["kneeOff", "frontUp", "stepForward"]
          : ["seatOff", "kneeOff", "frontUp", "stepForward"];
    for (let i: number = bottom; i > 0; i--)
      phases.push({
        name: upNames[bottom - i]!,
        seconds: phases[i - 1]!.seconds,
        from: i,
        to: i - 1,
      });
    phases.push({ name: "stood", seconds: 0, from: 0, to: 0 });
  }
  return phases;
}

/** `kneelPhaseTable`'s records. */
export namespace kneelPhaseTable {
  /** A kneel's phase: its name, length and keys. */
  export interface IPhase {
    /** The phase's name, the event it ends on. */
    name: string;

    /** The phase's length, seconds. */
    seconds: number;

    /** The key state it starts from. */
    from: number;

    /** The key state it ends at. */
    to: number;
  }
}
