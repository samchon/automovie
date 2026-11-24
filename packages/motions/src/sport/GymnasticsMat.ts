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
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { prepareHumanShapeBlend } from "../posture/prepareHumanShapeBlend";
import { GymnasticsFlight } from "./GymnasticsFlight";
import type { IPreparedGymnasticsFrame } from "./IPreparedGymnasticsFrame";
import { prepareGymnasticsFrame } from "./prepareGymnasticsFrame";

/**
 * Coming down lying on a landing surface after a jump over a bar: the high
 * jump's and the pole vault's landing on the mat.
 *
 * From the touchdown, the body turns on to lie over `SETTLE` seconds: its tip
 * goes to the lying tip nearest the one it landed at, on the back or on the
 * front, as its turn in the air brought it, its joints to `lieDown`'s posture
 * for that side, and it keeps resting on the surface, the root's height putting
 * the lowest of its collision shapes on it at every instant. Its centre carries
 * the touchdown's horizontal velocity out over the same seconds and stops. It
 * then lies still.
 *
 * First pass: the surface does not give, so the fall's vertical speed stops at
 * the touchdown (a mat's give over a few tenths of a second is not shown); the
 * body slides on the surface as its centre slows.
 */
export namespace GymnasticsMat {
  /** Seconds from the touchdown to lying on the back (provisional). */
  export const SETTLE: number = 0.6;

  /** Seconds lying still after it (provisional). */
  export const HOLD: number = 0.6;

  /**
   * The posture after a touchdown on the back.
   *
   * @param props The body, its mass model, the touchdown posture written by
   *   joints with no roll, the centre's velocity at the touchdown, m/s, and the
   *   surface's height, world metres.
   * @returns The posture at seconds since the touchdown, in [0, SETTLE + HOLD];
   *   the last one beyond. Optional second/third arguments borrow the
   *   synchronous parent's exact FK source and genuine ROM projector, without
   *   retaining either.
   */
  export function lie(
    props: IAutoMovieMotionHumanGymnasticsMat.ILieProps,
  ): (
    seconds: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ) => IAutoMovieMotionHumanPosture {
    const body: IAutoMovieMotionHumanBody = props.body;
    const model: IAutoMovieResolveCenterOfMass.IModel = props.model;
    const prepareFrame: ReturnType<typeof prepareGymnasticsFrame> =
      prepareGymnasticsFrame(body, model);
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
    return (
      seconds: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture => {
      const t: number = Math.min(SETTLE, Math.max(0, seconds));
      const resting: boolean = t === SETTLE;
      const u: number = resting
        ? settledProgress
        : minimumJerk.share(t / SETTLE);
      const joints: IAutoMovieMotionHumanPosture["joints"] = blend(
        resting ? 1 : u,
      );
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
        {
          x: centre.x + props.velocity.x * carry,
          y: 0,
          z: centre.z + props.velocity.z * carry,
        },
        resolution,
        projection,
      );

      // The frame owns this fresh raw root; transfer it after final floor placement.
      frame.posture.root.y = props.height + frame.floor();
      return frame.posture;
    };
  }
}
