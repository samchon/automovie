import {
  type IAutoMovieSchedule,
  resolveAutoMovieZone,
} from "@automovie/engine";

import { KnockdownCount } from "../../laws/officiating/KnockdownCount";
import { OfficiatingAction } from "../../laws/officiating/OfficiatingAction";
import type { IRingCast } from "../kickboxing/IRingCast";

/**
 * Coverage of the knockdown count. Broadcasts keep a camera at a neutral
 * corner so the referee's count over the fallen man and the standing fighter
 * sent to the far neutral corner are both covered: the count is shot at
 * medium from the apron at the other neutral corner, a two-shot of the
 * referee counting over the fallen man aimed from that corner, so the winner
 * stands in his corner in the background of the same frame.
 *
 * ```ts
 * const count = CountCoverage.window(schedule, "referee");
 * CountCoverage.bearing(CountCoverage.COUNTED.map(floorOf), corner); // framing CountCoverage.SUBJECTS
 * ```
 *
 * @evidence docs/research/cinematography/fight-coverage.md#practice Neutral-corner cameras cover the count and the standing fighter.
 * @evidence docs/research/officiating/referee.md#knockdown The standing fighter goes to the farthest neutral corner and the count is picked up.
 */
export namespace CountCoverage {
  /**
   * The count's span: from the referee's first counted second to the end of
   * his last.
   *
   * @param schedule The schedule.
   * @param referee The referee's id.
   * @returns The span, or undefined without a count.
   */
  export function window(
    schedule: IAutoMovieSchedule,
    referee: string,
  ): { start: number; end: number } | undefined {
    const counts = schedule.entries.filter(
      (e) =>
        e.subject === referee &&
        e.intent.capability === "signal" &&
        OfficiatingAction.read(e.intent).signal === "count",
    );
    if (counts.length === 0) return undefined;
    return {
      start: Math.min(...counts.map((e) => e.start)),
      end: Math.max(...counts.map((e) => e.end)),
    };
  }

  /** The count's two-shot: the referee counting over the fallen man. */
  export const COUNTED: readonly string[] = Object.freeze(["referee", "b"]);

  /**
   * Who the count's shot frames: the two-shot, and the winner in his neutral
   * corner behind it, so the shot also shows him keeping to his corner.
   */
  export const SUBJECTS: readonly string[] = Object.freeze([...COUNTED, "a"]);

  /**
   * The neutral corner the camera stands at: the one the standing fighter
   * was not sent to.
   *
   * @param cast The cast.
   * @param standing The standing fighter's floor point when the count begins.
   * @returns The corner's floor point.
   */
  export function corner(
    cast: IRingCast,
    standing: { x: number; z: number },
  ): { x: number; z: number } {
    const at = (name: string) => {
      const p = resolveAutoMovieZone(cast.ring.zones, "neutral-corners", name);
      return { x: p.x, z: p.z };
    };
    // The standing fighter's corner is the one nearer him; the camera takes
    // the farther one.
    return KnockdownCount.corner(
      [at("north-east"), at("south-west")],
      standing,
    );
  }

  /**
   * The bearing from the framed subjects toward the camera's corner.
   *
   * @param subjects The framed subjects' floor points.
   * @param corner The camera's corner.
   * @returns Radians from +Z toward +X.
   */
  export function bearing(
    subjects: readonly { x: number; z: number }[],
    corner: { x: number; z: number },
  ): number {
    const x: number =
      subjects.reduce((sum, p) => sum + p.x, 0) / subjects.length;
    const z: number =
      subjects.reduce((sum, p) => sum + p.z, 0) / subjects.length;
    return Math.atan2(corner.x - x, corner.z - z);
  }
}
