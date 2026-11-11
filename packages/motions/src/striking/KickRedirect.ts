import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { IKickGeometry } from "./IKickGeometry";
import { KickGeometry } from "./KickGeometry";
import type { kick } from "./kick";

/**
 * A round kick redirected before its chamber key into another round kick (a
 * middle kick switched to a high kick).
 *
 * The new kick is planned whole, as if thrown from the source's own entry on
 * the source's clock, line and step, and the figure moves from the source's
 * plan to the new one on a minimum-jerk blend from the cut to the contact:
 * the carriage's turn, lean and tip as each plan shows them at that second,
 * and under that one blended body the two plans' legs (the ankle, the knee's hint and the foot's rotation). Each
 * plan's leg is carried by the pelvis it hangs from, so both are legs the
 * blended body can hold, and so is their blend near either end. Both plans
 * are smooth and the blend's weight leaves zero with zero velocity and
 * acceleration, so position, velocity and acceleration stay continuous
 * through the cut. This is a blend of two complete plans, not one superposed
 * correction unit (Flash and Henis 1991): the two kicks differ in their
 * whole carriage, which no single displacement of the ankle expresses.
 */
export namespace KickRedirect {
  /**
   * Build a redirect's geometry.
   *
   * @param context The redirecting kick's context, starting at the cut.
   * @param source The kick it continues.
   * @param fixed The contact second the performance committed: null when the leg met nothing, undefined when the kick offers no weapon.
   * @returns The geometry, on the source's clock.
   */
  export function build(
    context: IHumanActionContext<kick.IParams>,
    source: IKickGeometry.ISource,
    fixed: number | null | undefined,
  ): IKickGeometry {
    const body: IHumanBody = context.body;
    const timing: IKickGeometry.ITiming = source.timing;
    const t0: number = source.start;
    const old: IKickGeometry = source.geometry();
    const fresh: IKickGeometry = KickGeometry.build(
      {
        ...source.context,
        params: context.params,
        random: context.random,
        start: t0,
      },
      timing,
      t0,
      fixed,
      { line: old.line, step: old.carriage.step },
    );
    const cut: number = context.start - t0;
    const blending: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      timing.impact,
      [{ name: "cut", seconds: Math.min(cut, timing.impact) }],
    );
    const blend = (t: number): number =>
      blending.progress("cut", AutoMovieMotionClock.END, t);
    const mix = (from: number, to: number, w: number): number =>
      from + (to - from) * w;
    return KickGeometry.compose(body, timing, t0, {
      line: fresh.line,
      carriage: fresh.carriage,
      base: fresh.base,
      shown: (turning: number): IKickGeometry.ICarriage => {
        const w: number = blend(turning);
        const from: IKickGeometry.ICarriage = old.shown(turning);
        const to: IKickGeometry.ICarriage = fresh.shown(turning);
        return {
          turn: mix(from.turn, to.turn, w),
          lean: mix(from.lean, to.lean, w),
          pitch: mix(from.pitch, to.pitch, w),
          step: to.step,
        };
      },
      leg: (
        clock: number,
        base: IHumanPosture,
        shift: IAutoMovieVector3,
      ): IKickGeometry.ILeg => {
        const from: IKickGeometry.ILeg = old.leg(clock, base, shift);
        const to: IKickGeometry.ILeg = fresh.leg(clock, base, shift);
        const w: number = blend(clock);
        return {
          ankle: Vector3.lerp(from.ankle, to.ankle, w),
          hint: Vector3.lerp(from.hint, to.hint, w),
          rotation: Quaternion.slerp(from.rotation, to.rotation, w),
        };
      },
      origin: fresh.origin,
      back: fresh.back,
      contacts: fresh.contacts,
      record: fresh.record,
    });
  }
}
