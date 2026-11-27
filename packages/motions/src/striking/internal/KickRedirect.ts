import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanKick,
  IAutoMovieMotionHumanKickGeometry,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { KickGeometry } from "./KickGeometry";
import { KickLaunch } from "./KickLaunch";

/*
 * A round kick redirected before its chamber key into another round kick (a
 * middle kick switched to a high kick).
 *
 * The new kick is planned whole, as if thrown from the source's own entry on
 * the source's clock, line and step, and the figure moves from the source's
 * plan to the new one on a minimum-jerk blend from the cut to the contact: the
 * carriage's turn, lean and tip as each plan shows them at that second, and
 * under that one blended body the two plans' legs (the ankle, the knee's hint
 * and the foot's rotation). Each plan's leg is carried by the pelvis it hangs
 * from, so both are legs the blended body can hold, and so is their blend near
 * either end. Both plans are smooth and the blend's weight leaves zero with
 * zero velocity and acceleration, so position, velocity and acceleration stay
 * continuous through the cut. This is a blend of two complete plans, not one
 * superposed correction unit (Flash and Henis 1991): the two kicks differ in
 * their whole carriage, which no single displacement of the ankle expresses.
 */
export namespace KickRedirect {
  /*
   * How far a redirected kick has turned from its old geometry to the fresh one
   * at a second: a minimum-jerk share from the cut to the impact, over at least
   * a millisecond.
   * Parameter seconds: The kick's seconds.
   * Parameter cut: The redirect's seconds.
   * Parameter impact: The impact's seconds.
   * Returns: 0 to 1.
   */
  export function weight(seconds: number, cut: number, impact: number): number {
    return AutoMovieEngineMotionSampling.minimumJerkShare((seconds - cut) / Math.max(1e-3, impact - cut));
  }

  /*
   * A redirecting kick's launch: the new target read on the source's clock,
   * keeping the source's line and step (`KickLaunch`).
   * Parameter context: The redirecting kick's context, starting at the cut.
   * Parameter source: The kick it continues.
   * Returns: The launch.
   */
  export function launch(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKick.IParams>,
    source: IAutoMovieMotionHumanKickGeometry.ISource,
  ): KickLaunch.ILaunch {
    const old: IAutoMovieMotionHumanKickGeometry = source.geometry();
    return KickLaunch(
      redirected(context, source),
      source.timing,
      source.start,
      { line: old.line, step: old.carriage.step, drive: old.carriage.drive },
    );
  }

  /*
   * Build a redirect's geometry.
   * Parameter context: The redirecting kick's context, starting at the cut.
   * Parameter source: The kick it continues.
   * Parameter fixed: The contact second the performance committed: null when the
   * leg met nothing, undefined when the kick offers no weapon.
   * Parameter launch: The redirecting kick's launch (`launch`).
   * Returns: The geometry, on the source's clock.
   */
  export function build(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKick.IParams>,
    source: IAutoMovieMotionHumanKickGeometry.ISource,
    fixed: number | null | undefined,
    launch: KickLaunch.ILaunch,
  ): IAutoMovieMotionHumanKickGeometry {
    const body: IAutoMovieMotionHumanBody = context.body;
    const timing: IAutoMovieMotionHumanKickGeometry.ITiming = source.timing;
    const t0: number = source.start;
    const old: IAutoMovieMotionHumanKickGeometry = source.geometry();
    const fresh: IAutoMovieMotionHumanKickGeometry = KickGeometry.build(
      redirected(context, source),
      timing,
      t0,
      fixed,
      launch,
    );
    const cut: number = context.start - t0;
    const blend = (t: number): number => weight(t, cut, timing.impact);
    const mix = (from: number, to: number, w: number): number =>
      from + (to - from) * w;
    return KickGeometry.compose(
      body,
      timing,
      t0,
      {
        line: fresh.line,
        carriage: fresh.carriage,
        base: fresh.base,
        shown: (
          turning: number,
        ): IAutoMovieMotionHumanKickGeometry.ICarriage => {
          const w: number = blend(turning);
          const from: IAutoMovieMotionHumanKickGeometry.ICarriage =
            old.shown(turning);
          const to: IAutoMovieMotionHumanKickGeometry.ICarriage =
            fresh.shown(turning);
          return {
            turn: mix(from.turn, to.turn, w),
            lean: mix(from.lean, to.lean, w),
            pitch: mix(from.pitch, to.pitch, w),
            step: to.step,
            drive: to.drive,
          };
        },
        leg: (
          clock: number,
          base: IAutoMovieMotionHumanPosture,
          shift: IAutoMovieVector3,
          hip?: IAutoMovieVector3,
        ): IAutoMovieMotionHumanKickGeometry.ILeg => {
          const from: IAutoMovieMotionHumanKickGeometry.ILeg = old.leg(
            clock,
            base,
            shift,
            hip,
          );
          const to: IAutoMovieMotionHumanKickGeometry.ILeg = fresh.leg(
            clock,
            base,
            shift,
            hip,
          );
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
      },
      launch.props.recovery,
    );
  }

  /*
   * The redirecting kick's parameters and draws on its source's context and
   * clock.
   */
  function redirected(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKick.IParams>,
    source: IAutoMovieMotionHumanKickGeometry.ISource,
  ): IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKick.IParams> {
    return {
      ...source.context,
      params: context.params,
      random: context.random,
      start: source.start,
    };
  }
}
