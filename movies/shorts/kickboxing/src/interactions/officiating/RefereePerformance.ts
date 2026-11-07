import { type IAutoMovieSchedule, resolveAutoMovieZone } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IBoutPosture } from "../../laws/kickboxing/IBoutPosture";
import { KickboxingTiming } from "../../laws/kickboxing/KickboxingTiming";
import { StanceShape } from "../../laws/kickboxing/StanceShape";
import { StepPattern } from "../../laws/kickboxing/StepPattern";
import { KnockdownCount } from "../../laws/officiating/KnockdownCount";
import { OfficiatingAction } from "../../laws/officiating/OfficiatingAction";
import { RefereeShape } from "../../laws/officiating/RefereeShape";
import type { RefereeBody } from "../../entities/cast/referee/RefereeBody";
import { BoutLaws } from "../kickboxing/BoutLaws";
import type { IRingCast } from "../kickboxing/IRingCast";
import { RefereeTrack } from "./RefereeTrack";

/**
 * The referee's body at any second: his officiating stance or active signal,
 * his feet stepping along the resolved track one step per half second, his
 * head toward the action, and his mouth open while he speaks.
 *
 * ```ts
 * RefereePerformance.at(cast, schedule, track, 157.2);
 * ```
 *
 * @evidence docs/research/officiating/referee.md#signals Stance and signals.
 * @evidence docs/body/settings/cast/referee.md#positioning He is never idle; he walks with the fighters.
 * @evidence docs/body/settings/cast/referee.md#voice The mouth opens during speech.
 */
export namespace RefereePerformance {
  /** Jaw opening while speaking, millimetres: half the jaw's range, a projected command. */
  const SPEAKING_JAW: number = 26;

  /**
   * The referee's placed body at a second.
   *
   * @param cast The cast.
   * @param schedule The schedule.
   * @param track His resolved path.
   * @param seconds Film seconds.
   * @returns His FK, root, segments and jaw.
   */
  export function at(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    track: RefereeTrack.ITrack,
    seconds: number,
  ): ReturnType<RefereeBody["place"]> & { jaw: number } {
    const body: RefereeBody = cast.referee.body;
    const measure = body.measure;
    const here = RefereeTrack.at(track, seconds);
    const facing = unit({ x: here.look.x - here.point.x, z: here.look.z - here.point.z });
    const origin: IAutoMovieVector3 = { x: here.point.x, y: 0, z: here.point.z };
    const feet: Record<"left" | "right", IAutoMovieVector3> = { left: foot("left"), right: foot("right") };
    let posture: IBoutPosture = RefereeShape.stance(measure);
    let jaw: number = 0;
    for (const entry of schedule.entries) {
      if (entry.subject !== cast.referee.id || entry.start > seconds || seconds >= entry.end) continue;
      const action: OfficiatingAction.IAction = OfficiatingAction.read(entry.intent);
      const share: number = (seconds - entry.start) / (entry.end - entry.start);
      const toward: IAutoMovieVector3 | undefined = direction(action.signal, cast, schedule, here.point, facing, seconds);
      posture = RefereeShape.posture(measure, rest(feet, origin, facing), { signal: action.signal, share, ...(toward ? { toward } : {}) });
      if (action.words !== undefined && share < SPEECH_SHARE) jaw = SPEAKING_JAW * Math.sin(Math.PI * (share / SPEECH_SHARE));
    }
    const placed = body.place({ ...posture, jaw }, { origin, facing, feet });
    return { ...placed, jaw };

    function foot(side: "left" | "right"): IAutoMovieVector3 {
      // Each foot steps every other half second toward its stance place on the track.
      const period: number = KickboxingTiming.STEP_PERIOD * 2;
      const offset: number = side === "left" ? 0 : KickboxingTiming.STEP_PERIOD;
      const k: number = Math.floor((seconds - offset) / period);
      const swingStart: number = k * period + offset;
      const swing: number = Math.min(1, (seconds - swingStart) / KickboxingTiming.STEP_PERIOD);
      const from = RefereeTrack.at(track, swingStart);
      const to = RefereeTrack.at(track, swingStart + period);
      const place = (p: { x: number; z: number }, f: { x: number; z: number }): IAutoMovieVector3 => {
        const z: number = (side === "left" ? 1 : -1) * measure.hipHalfWidth;
        return { x: p.x - f.z * z, y: measure.ankle, z: p.z + f.x * z };
      };
      const a: IAutoMovieVector3 = place(from.point, facing);
      const b: IAutoMovieVector3 = place(to.point, facing);
      const moving: boolean = Math.hypot(b.x - a.x, b.z - a.z) > StanceShape.step(measure) * MOVING_SHARE;
      const s: number = moving ? swing : 1;
      return {
        x: a.x + (b.x - a.x) * s,
        y: measure.ankle * (1 + (moving ? StepPattern.lift(swing) * StepPattern.LIFT_SHARE : 0)),
        z: a.z + (b.z - a.z) * s,
      };
    }
  }

  /** Share of a signal during which its words are spoken: the first half, before the gesture holds. */
  const SPEECH_SHARE: number = 0.5;

  /** A foot steps only when its next place is at least a tenth of a step away; smaller drift is absorbed by the stance. */
  const MOVING_SHARE: number = 0.1;

  /** The body-frame direction a pointing signal points along. */
  function direction(
    signal: RefereeShape.Signal,
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    from: { x: number; z: number },
    facing: { x: number; z: number },
    seconds: number,
  ): IAutoMovieVector3 | undefined {
    const target =
      signal === "down" || signal === "count"
        ? BoutLaws.origin(schedule, cast.b.id, seconds, cast).point
        : signal === "winner"
          ? BoutLaws.origin(schedule, cast.a.id, seconds, cast).point
          : signal === "neutral-corner"
            ? KnockdownCount.corner(
                [corner(cast, "north-east"), corner(cast, "south-west")],
                BoutLaws.origin(schedule, cast.b.id, seconds, cast).point,
              )
            : undefined;
    if (!target) return undefined;
    const w = unit({ x: target.x - from.x, z: target.z - from.z });
    // World direction into the referee's frame (facing along +X).
    return { x: w.x * facing.x + w.z * facing.z, y: 0, z: -w.x * facing.z + w.z * facing.x };
  }

  function corner(cast: IRingCast, name: string): { x: number; z: number } {
    const p = resolveAutoMovieZone(cast.ring.zones, "neutral-corners", name);
    return { x: p.x, z: p.z };
  }

  function rest(
    feet: Record<"left" | "right", IAutoMovieVector3>,
    origin: IAutoMovieVector3,
    facing: { x: number; z: number },
  ): Record<"left" | "right", IAutoMovieVector3> {
    const local = (p: IAutoMovieVector3): IAutoMovieVector3 => {
      const dx: number = p.x - origin.x;
      const dz: number = p.z - origin.z;
      return { x: dx * facing.x + dz * facing.z, y: p.y, z: -dx * facing.z + dz * facing.x };
    };
    return { left: local(feet.left), right: local(feet.right) };
  }

  function unit(v: { x: number; z: number }): { x: number; z: number } {
    const l: number = Math.hypot(v.x, v.z);
    return l === 0 ? { x: 1, z: 0 } : { x: v.x / l, z: v.z / l };
  }
}
