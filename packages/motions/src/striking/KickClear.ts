import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanKick,
  IAutoMovieMotionHumanKickGeometry,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPerformanceContacts } from "../perform/HumanPerformanceContacts";
import { HumanColliders } from "../posture/HumanColliders";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { KickCarriage } from "./KickCarriage";
import { KickForm } from "./KickForm";
import { KickGeometry } from "./KickGeometry";
import type { KickLaunch } from "./KickLaunch";
import { StrikingTarget } from "./StrikingTarget";
import { StrikingWeapon } from "./StrikingWeapon";

/** The alternatives of `OfEarlyGirth`'s site. */
type OfEarlyGirth = number | readonly [number, number];

/**
 * A kick's way to its contact, kept clear of the person it is thrown at.
 *
 * The contact is decided at the contact's own instant (`KickContact`), and the
 * leg reaches it through a lift and a chamber. Thrown from where the two stand,
 * the lifting knee or the chambered foot may meet the partner before the leg
 * has opened; the performance's contact resolution then stops the leg there,
 * far from the planned contact. A kicker who sees the partner that near makes
 * room first: the support foot steps back and the kick is thrown from there;
 * before that, where it stands, it folds the knee to the full chamber
 * (`KickForm.CHAMBER_FLEXION`) instead of the share of it its skill would show.
 * So the launch's plan is swept as the performance will sweep it (the leg's
 * three capsules of `StrikingWeapon`, at `HumanPerformanceContacts.STEP`, from
 * the launch to a step before the contact) against the partner as perceived at
 * the launch, and while the leg meets the partner early the support foot's step
 * is taken back by the thigh's girth, the contact solved again on that step, no
 * further back than a backward step goes (`KickForm.STEP_BACK_SHARE`) and no
 * further than the leg still lands from. A step back that leaves the way no
 * clearer is not taken: the launch stays as it was, and the performance's
 * resolution shows what the leg meets.
 */
export namespace KickClear {
  /**
   * A launch whose way to the contact is clear of the person kicked at, the
   * support foot stepped back for it where that clears it.
   *
   * @param context The kick's context.
   * @param timing The kick's timing.
   * @param t0 Film second of the kick's time zero.
   * @param launch The launch.
   * @returns The launch, its contact solved again on a step further back when
   *   the leg met the partner early and the step clears it; the launch itself
   *   otherwise.
   */
  export function of(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKick.IParams>,
    timing: IAutoMovieMotionHumanKickGeometry.ITiming,
    t0: number,
    launch: KickLaunch.ILaunch,
  ): KickLaunch.ILaunch {
    const p: IAutoMovieMotionHumanKick.IParams = context.params;
    if (launch.feint || launch.kept !== undefined || p.at.kind !== "person")
      return launch;
    const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
    const other: IAutoMovieMotionHumanPerformerReader = context.performer(
      p.at.subject,
    );
    const reading: ReturnType<typeof HumanColliders.reading> =
      HumanColliders.reading(
        other.body,
        other.bones(t0 - StrikingTarget.LOOK, HumanColliders.bones(other.body)),
      );
    const radii: ReturnType<typeof StrikingWeapon.legRadii> =
      StrikingWeapon.legRadii(body);
    const frames: ReturnType<typeof StrikingWeapon.frames> =
      StrikingWeapon.frames(
        body,
        timing.side === "left" ? "leftLeg" : "rightLeg",
      );

    // Whether a plan's leg meets the partner before its contact, on the
    // plan's own free course with no correction and no stop.
    const early = (planned: KickLaunch.IPlanned): boolean => {
      const geometry: IAutoMovieMotionHumanKickGeometry = KickGeometry.compose(
        body,
        timing,
        t0,
        {
          line: launch.line,
          carriage: planned.carriage,
          base: (
            seconds: number,
            shown: IAutoMovieMotionHumanKickGeometry.ICarriage,
            turning?: number,
            resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
            projection?: ReturnType<typeof prepareHumanPostureProjection>,
          ): IAutoMovieMotionHumanPosture =>
            KickCarriage.posture(
              launch.props,
              shown,
              seconds,
              turning,
              resolution,
              projection,
            ),
          shown: (): IAutoMovieMotionHumanKickGeometry.ICarriage =>
            planned.carriage,
          leg: planned.leg,
          origin: launch.origin,
          back: Vector3.add(
            launch.origin,
            Vector3.scale(launch.line, planned.carriage.step),
          ),
          contacts: [],
          record: {
            limb: timing.side === "left" ? "leftFoot" : "rightFoot",
            offset: launch.offset,
            planned: launch.planned,
            reached: planned.fit.reached,
            status: planned.fit.status,
            stop: (): undefined => undefined,
          },
        },
      );
      const course: StrikingWeapon.Course = (
        at: number,
        channels?: Parameters<StrikingWeapon.Course>[1],
        resolution?: Parameters<StrikingWeapon.Course>[2],
        projection?: Parameters<StrikingWeapon.Course>[3],
      ): IAutoMovieMotionHumanPosture =>
        geometry.posture(at - t0, channels, resolution, projection?.());
      const step: number = HumanPerformanceContacts.STEP;
      for (
        let seconds: number = timing.prep;
        seconds < timing.impact - step;
        seconds += step
      ) {
        const ends: IAutoMovieVector3[] = StrikingWeapon.leg(
          body,
          course,
          timing.side,
          t0 + seconds,
          undefined,
          undefined,
          frames,
        );
        for (let i: number = 0; i < radii.length; i++) {
          const girth: OfEarlyGirth = radii[i]!;
          const taper: readonly [number, number] =
            typeof girth === "number" ? [girth, girth] : girth;
          if (reading.segment(ends[i]!, ends[i + 1]!, taper).distance <= 0)
            return true;
        }
      }
      return false;
    };
    if (!early(launch.launched)) return launch;

    // A kicker too close for the chamber its skill would show folds the
    // knee to the full chamber first, heel to the thigh, where it stands:
    // the foot then waits on its own side of the partner. Measured on the
    // staged lead round kick, 0.74 m between the hips: folded 79 degrees the
    // foot hung on the partner's hips, 8 ms after the chamber key.
    const tight: number = KickForm.CHAMBER_FLEXION;
    const folded: KickLaunch.IPlanned = launch.contact(
      launch.planned,
      launch.launched.carriage.step,
      launch.launched.carriage.lean,
      launch.launched.carriage.drive,
      tight,
    );
    if (!early(folded)) return { ...launch, chamber: tight, launched: folded };

    // The support foot steps back by the thigh's girth, the widest of the
    // leg, while the way is not clear, no further than a backward step goes.
    const stride: number = 2 * body.measure.thighRadius;
    const furthest: number = -KickForm.STEP_BACK_SHARE * body.measure.stature;
    let planned: KickLaunch.IPlanned = folded;
    // The backward step's own length bounds the search, a girth at a time.
    for (;;) {
      const back: number = planned.carriage.step - stride;
      if (back < furthest) break;
      planned = launch.contact(
        launch.planned,
        back,
        undefined,
        planned.carriage.drive,
        tight,
      );

      // A step back that puts the target out of the leg's reach clears the
      // way by missing it, which is no answer.
      if (planned.fit.status === "short") break;
      if (!early(planned))
        return { ...launch, chamber: tight, launched: planned };
    }
    return launch;
  }
}
