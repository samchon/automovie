import {
  type IAutoMovieSchedule,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { CoverageLaw } from "../../laws/cinematography/CoverageLaw";
import { KickboxingAction } from "../../laws/kickboxing/KickboxingAction";
import { KickboxingRange } from "../../laws/kickboxing/KickboxingRange";
import { CameraTrack } from "../cinematography/CameraTrack";
import { RefereePerformance } from "../officiating/RefereePerformance";
import type { RefereeTrack } from "../officiating/RefereeTrack";
import type { BoutPerformance } from "./BoutPerformance";
import type { IRingCast } from "./IRingCast";
import { PictureMeasures } from "./PictureMeasures";
import { PictureTargets } from "./PictureTargets";

/**
 * The picture measures of the mounted film: the displayed fighters' and
 * referee's segments and the delivered camera track read into
 * {@link PictureMeasures.film}, each ranged measure with its research range
 * beside it ({@link PictureTargets.annotate}).
 *
 * ```ts
 * DisplayedPicture.measures(cast, schedule, performance, referee, camera, 180);
 * ```
 *
 * @evidence docs/research/kickboxing/ring-generalship.md#targets Measured on the displayed bodies across the whole film.
 * @evidence docs/research/kickboxing/techniques.md#standing-knees Every displayed standing figure, the referee included.
 */
export namespace DisplayedPicture {
  /**
   * The measures.
   *
   * @param cast The cast.
   * @param schedule The schedule.
   * @param performance The displayed fighters.
   * @param referee The referee's resolved path.
   * @param camera The delivered camera track.
   * @param duration Running time, seconds.
   * @returns Named measures with their ranges.
   */
  export function measures(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    performance: BoutPerformance,
    referee: RefereeTrack.ITrack,
    camera: CameraTrack.ISample[],
    duration: number,
  ): Record<string, number> {
    const fall = schedule.entries.find((e) => {
      if (e.intent.capability !== "phase") return false;
      const action = KickboxingAction.read(e.intent);
      return action.kind === "phase" && action.phase === "fall";
    });
    const segments = (
      subject: string,
      seconds: number,
    ): Record<string, { position: IAutoMovieVector3 }> =>
      subject === cast.referee.id
        ? RefereePerformance.at(cast, schedule, referee, seconds).segments
        : performance.at(seconds)[subject]!.segments;
    const body = (
      subject: string,
      ankle: number,
      seconds: number,
    ): PictureMeasures.IBody => {
      const s = segments(subject, seconds);
      const leg = (side: "left" | "right"): PictureMeasures.ILeg => ({
        hip: s[`${side}UpperLeg`]!.position,
        knee: s[`${side}LowerLeg`]!.position,
        ankle: s[`${side}Foot`]!.position,
      });
      return {
        legs: { left: leg("left"), right: leg("right") },
        hands: {
          left: s.leftHand!.position,
          right: s.rightHand!.position,
        },
        planted: ankle,
        fallen:
          fall !== undefined &&
          fall.subject === subject &&
          seconds >= fall.start,
      };
    };
    const measured: Record<string, number> = PictureMeasures.film({
      schedule,
      duration,
      finish: {
        start: CameraTrack.strike(schedule)?.start ?? duration,
        fall: fall?.start ?? duration,
      },
      limits: {
        close: KickboxingRange.clinch(cast.a.body.measure, cast.b.body.measure),
        fieldOfView: CoverageLaw.FIELD_OF_VIEW,
        aspect: CoverageLaw.ASPECT,
      },
      read: (seconds: number) => {
        const shot = CameraTrack.at(camera, seconds);
        const a = body(cast.a.id, cast.a.body.measure.ankle, seconds);
        const b = body(cast.b.id, cast.b.body.measure.ankle, seconds);
        return {
          bodies: [a, b],
          figures: [
            a,
            b,
            body(cast.referee.id, cast.referee.body.measure.ankle, seconds),
          ],
          lens: {
            position: shot.position,
            target: shot.target,
            fieldOfView: shot.fieldOfView,
          },
        };
      },
      striking: (subject, spec, seconds) => {
        if (spec.limb !== "arm")
          return performance.at(seconds)[subject]!.segments[
            `${spec.side}Midfoot`
          ]!.position;
        const fighter = subject === cast.a.id ? cast.a : cast.b;
        const fist = fighter.body.weapons[`knuckles-${spec.side}`]!;
        const s = performance.at(seconds)[subject]!.segments[fist.bone]!;
        return Vector3.add(
          s.position,
          Quaternion.rotateVector(s.rotation, fist.localPoint),
        );
      },
    });
    return PictureTargets.annotate(
      measured,
      PictureTargets.of(cast.a.body.measure, cast.b.body.measure),
    );
  }
}
