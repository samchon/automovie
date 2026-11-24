import { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";

import { motionHumanBody } from "../../features/internal/motionHumanBody";

/**
 * The embrace from behind of `test_motion_touch_embrace_from_behind`, staged as
 * that spec stages it: the partner `b` standing ahead facing away, the embracer
 * `a` stepping in behind, so the embrace and its refusal are units of their
 * own.
 */
export namespace embraceScene {
  /**
   * How far toward the partner's left the embracer stands, metres: none,
   * centred behind the partner with the shoulders square, as the original
   * stages it.
   */
  const ASIDE: number = 0;

  /** How long the embrace is held, seconds. */
  const HOLD: number = 2;

  /**
   * The gap left between the chest and the back standing upright for the
   * average man, metres, scaled with the embracer's stature (provisional
   * staging, the original's).
   */
  const GAP: number = 0.2;

  /** `b` stands ahead facing away; `a` steps in behind and embraces. */
  export function scene(
    a: IAutoMovieMotionHumanBody,
    b: IAutoMovieMotionHumanBody,
  ): HumanPerformance {
    return new HumanPerformance({
      seed: "embrace-from-behind",
      laws: [AutoMovieMotionHumanTouch.embraceFromBehind],
      performers: [
        {
          subject: "a",
          body: a,
          at: { x: ASIDE, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body: b,
          at: {
            x: 0,
            y: 0,
            // The step back scaled with the embracer's stature from the
            // average man's, so every body closes it by the same lean.
            z:
              (a.measure.chestDepth + b.measure.chestDepth) / 2 +
              (GAP * a.measure.stature) /
                motionHumanBody("m-average").measure.stature,
          },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],

      // The partner is placed first, so the embrace reads where the partner stands.
      composition: HumanChain.subject("b")
        .stand({ hold: HOLD + 4 })
        .with(
          HumanChain.subject("a").registered(
            AutoMovieMotionHumanTouch.embraceFromBehind.name,
            { partner: "b", hold: HOLD },
          ),
        ).node,
    });
  }

  /** A body region's displayed point. */
  export function region(
    film: HumanPerformance,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    name: AutoMovieHumanoidRegion,
    t: number,
  ): IAutoMovieVector3 {
    return resolveAutoMovieHumanoidSurfaces.place(
      body.surfaces.regions[name],
      film.bones(subject, t).get(body.surfaces.regions[name].bone)!,
    ).point;
  }
}
