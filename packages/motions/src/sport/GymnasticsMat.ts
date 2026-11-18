import { carriedRate, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGymnasticsMat,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieVector3,
} from "@automovie/interface";

import { lieDown } from "../floor/lieDown";
import { prepareHumanShapeBlend } from "../handling/prepareHumanShapeBlend";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { GymnasticsFlight } from "./GymnasticsFlight";
import type { IPreparedGymnasticsFrame } from "./IPreparedGymnasticsFrame";
import { prepareGymnasticsFrame } from "./prepareGymnasticsFrame";

/**
 * Coming down lying on a landing surface after a jump over a bar (#3377):
 * the high jump's and the pole vault's landing on the mat.
 *
 * From the touchdown, the body turns on to lie over `SETTLE` seconds: its
 * tip goes to the lying tip nearest the one it landed at, on the back or on
 * the front, as its turn in the air brought it, its joints to `lieDown`'s
 * posture for that side, and it keeps resting on the
 * surface, the root's height putting the lowest of its collision shapes on
 * it at every instant. Its centre carries the touchdown's horizontal
 * velocity out over the same seconds and stops. It then lies still.
 *
 * First pass: the surface does not give, so the fall's vertical speed stops
 * at the touchdown (a mat's give over a few tenths of a second is not
 * shown); the body slides on the surface as its centre slows.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the landing does, how the body rests, how the velocity is carried and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A posture by seconds since the touchdown, built from the touchdown posture, its velocity and the surface's height.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two durations and one function, read by the high jump and the pole vault.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The lying posture is `lieDown`'s; the rest height is the body's own shapes'.
 */
export namespace GymnasticsMat {
  /** Seconds from the touchdown to lying on the back (provisional). */
  export const SETTLE: number = 0.6;

  /** Seconds lying still after it (provisional). */
  export const HOLD: number = 0.6;

  /**
   * The posture after a touchdown on the back.
   *
   * @param props The body, its mass model, the touchdown posture written by joints with no roll, the centre's velocity at the touchdown, m/s, and the surface's height, world metres.
   * @returns The posture at seconds since the touchdown, in [0, SETTLE + HOLD]; the last one beyond. Optional second/third arguments borrow the synchronous parent's exact FK source and genuine ROM projector, without retaining either.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result's timebase.
   * @evidence contracts/development/implementation.md#principled-implementation Joint space blended on minimum-jerk progress, the tip to the nearest supine tip, the root height from the shapes' rest and the root's floor place from the centre carried by the engine's `carriedRate`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One blend, one centre and one rest per instant; the query's fresh frame posture receives its final root Y before ownership transfers to the caller.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms The joint-map blend (`prepareHumanShapeBlend`) prepares J start/difference triples once, and the settled progress and carried-time coefficients are read once. Each query keeps actual ROM/FK/COM/floor evaluation and transfers its fresh posture/root directly, omitting two discarded shallow copies. No bound or phase time changes; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the authored interpolation prefix is fixed: the shared joint blend's union/start/difference and the scalar kernels at clipped t=SETTLE. Fresh triples isolate output mutations; current velocity/root requests and every actual body/ROM/profile/context reading remain evaluated. COM/floor share one query map and optional synchronous FK/projector loans share only prerequisites.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains original inputs and one O(J) joint blend reader (`prepareHumanShapeBlend`). Query frame, bone map and floor reader release on return/throw; optional FK/projector loans stay with the synchronous parent and neither enters the returned posture, frame floor callback or retained landing closure.
   */
  export function lie(props: IAutoMovieMotionHumanGymnasticsMat.ILieProps ): (seconds: number, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: ReturnType<typeof prepareHumanPostureProjection>) => IAutoMovieMotionHumanPosture {
    const body: IAutoMovieMotionHumanBody = props.body;
    const model: IAutoMovieResolveCenterOfMass.IModel = props.model;
    const prepareFrame: ReturnType<typeof prepareGymnasticsFrame> = prepareGymnasticsFrame(body, model);
    const from: IAutoMovieMotionHumanPosture = props.from;
    // The lying tip nearest the landing tip, an odd multiple of 90 degrees:
    // on the back at -90 plus whole turns, on the front at +90.
    const tip: number = 180 * Math.round((from.pitch - 90) / 180) + 90;
    const back: boolean = Math.abs((((tip + 90) % 360) + 360) % 360) < 1;
    const lain: IAutoMovieMotionHumanLieDown.IPose = back
      ? lieDown.POSES.supine
      : lieDown.POSES.prone;
    const centre: IAutoMovieVector3 = GymnasticsFlight.centre(
      body,
      model,
      from,
    );
    const blend: (weight: number) => IAutoMovieMotionHumanPosture["joints"] =
      prepareHumanShapeBlend(from.joints, lain.joints);
    const settledProgress: number = minimumJerk.share(1);
    const settledCarry: number = carriedRate(SETTLE, SETTLE);
    return (seconds: number, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: ReturnType<typeof prepareHumanPostureProjection>): IAutoMovieMotionHumanPosture => {
      const t: number = Math.min(SETTLE, Math.max(0, seconds));
      const resting: boolean = t === SETTLE;
      const u: number = resting ? settledProgress : minimumJerk.share(t / SETTLE);
      const joints: IAutoMovieMotionHumanPosture["joints"] = blend(resting ? 1 : u);
      const posed: IAutoMovieMotionHumanPosture = {
        ...from,
        pitch: from.pitch + (tip - from.pitch) * u,
        joints,
        root: { x: 0, y: 0, z: 0 },
      };

      // The centre's floor place, carried out from the touchdown.
      const carry: number = resting ? settledCarry : carriedRate(SETTLE, t);
      const frame: IPreparedGymnasticsFrame = prepareFrame(
        posed,
        { x: centre.x + props.velocity.x * carry, y: 0, z: centre.z + props.velocity.z * carry },
        resolution,
        projection,
      );

      // The frame owns this fresh raw root; transfer it after final floor placement.
      frame.posture.root.y = props.height + frame.floor();
      return frame.posture;
    };
  }
}

