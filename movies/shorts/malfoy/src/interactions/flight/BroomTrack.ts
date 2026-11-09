import type { IAutoMovieSchedule } from "@automovie/engine";

import { BroomLaw } from "../../laws/flight/BroomLaw";
import type { IStageWorld } from "../staging/IStageWorld";
import type { StagePerformance } from "../staging/StagePerformance";
import { RiderMotion } from "./RiderMotion";

/**
 * Where every broom is at a second: under its front rider (or its hanging
 * rider) while ridden, and riderless after a transfer released it, keeping
 * its heading while it slows and sinks; before anyone rides it, nowhere.
 *
 * ```ts
 * const brooms = BroomTrack.resolve(performance, schedule);
 * brooms.at("broom-harry", 40); // the riderless broom's placement
 * ```
 *
 * @evidence docs/research/flight/broom-riding.md#riderless Keeps heading, slows about 1 m/s^2, sinks gently.
 * @evidence docs/body/settings/props/brooms.md#states Ridden, tandem, carrying a hanging rider, riderless.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure queries over the resolved performance.
 * @evidence contracts/development/common.md#meaningful-documentation States the three states.
 */
export class BroomTrack {
  private constructor(
    private readonly performance: StagePerformance,
    private readonly releases: Map<string, { begin: number; at: number; step: IStageWorld.IStudentStep }>,
  ) {}

  /**
   * Index the brooms of a schedule.
   *
   * @param performance The performance.
   * @param schedule The schedule.
   * @returns The track.
   */
  public static resolve(performance: StagePerformance, schedule: IAutoMovieSchedule): BroomTrack {
    const releases: Map<string, { begin: number; at: number; step: IStageWorld.IStudentStep }> = new Map();
    for (const e of schedule.entries) {
      if (e.intent.capability !== "transfer") continue;
      const step = e.state as IStageWorld.IStudentStep;
      if (step.from.broom !== null && step.outcome !== "not-admitted") releases.set(step.from.broom, { begin: e.start, at: e.start + step.lead, step });
    }
    return new BroomTrack(performance, releases);
  }

  /** A broom's placement at a second, or undefined when nobody has ridden it yet. */
  public at(broom: string, seconds: number): RiderMotion.IBroom | undefined {
    const release = this.releases.get(broom);
    if (release && seconds >= release.begin) {
      // Through the transfer's lead and its first phase the broom flies on as before under its hanging rider; the hand opens at that phase's end.
      const open: number = release.at + BroomLaw.TRANSFER_PHASES[0]!;
      const f = { x: Math.sin(release.step.from.heading), z: Math.cos(release.step.from.heading) };
      const held = (t: number) => ({
        ...release.step.from,
        position: {
          x: release.step.from.position.x + f.x * release.step.from.speed * t,
          y: Math.max(0.5, release.step.from.position.y + release.step.from.climb * t),
          z: release.step.from.position.z + f.z * release.step.from.speed * t,
        },
      });
      if (seconds < open) return RiderMotion.riderless({ ...held(seconds - release.begin), speed: release.step.from.speed }, 0);
      return RiderMotion.riderless(held(open - release.begin), seconds - open);
    }
    for (const id of this.performance.subjects()) {
      const found = this.performance.entry(id, seconds);
      if (!found) continue;
      const s = found.step;
      const riding: boolean = (s.to.support === "ride" || s.to.support === "hang" || s.from.support === "hang" || (s.action.kind === "transfer" && s.from.broom === broom)) && (s.to.broom === broom || s.from.broom === broom);
      if (!riding) continue;
      if (s.action.kind === "transfer") continue;
      return this.performance.broom(id, seconds);
    }
    return undefined;
  }
}
