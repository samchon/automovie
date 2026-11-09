import {
  type IAutoMovieSchedule,
  resolveAutoMovieZone,
} from "@automovie/engine";

import { KickboxingAction } from "../../laws/kickboxing/KickboxingAction";
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
 * const shot = CountCoverage.shot(schedule, cast); // { counted: ["referee", "b"], subjects: ["referee", "b", "a"] }
 * CountCoverage.bearing(shot.counted.map(floorOf), corner); // framing shot.subjects
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

  /** The count's shot. */
  export interface IShot {
    /** The two-shot: the referee and the fallen man he counts over. */
    counted: string[];

    /** Who the shot frames: the two-shot, and the winner in his neutral corner behind it, so the shot also shows him keeping to his corner. */
    subjects: string[];
  }

  /**
   * The count's shot, from who fell: the fighter whose fall phase the
   * schedule holds is the counted man, the other the winner.
   *
   * @param schedule The schedule.
   * @param cast The cast.
   * @returns The shot, or undefined when nobody falls.
   */
  export function shot(
    schedule: IAutoMovieSchedule,
    cast: IRingCast,
  ): IShot | undefined {
    const fallen: string | undefined = schedule.entries.find((e) => {
      if (e.intent.capability !== "phase") return false;
      const action: KickboxingAction.IAction = KickboxingAction.read(e.intent);
      return action.kind === "phase" && action.phase === "fall";
    })?.subject;
    if (fallen === undefined) return undefined;
    const winner: string = fallen === cast.a.id ? cast.b.id : cast.a.id;
    const counted: string[] = [cast.referee.id, fallen];
    return { counted, subjects: [...counted, winner] };
  }

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
