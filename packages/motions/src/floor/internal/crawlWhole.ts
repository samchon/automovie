import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { HumanPhysics } from "../../law/internal/HumanPhysics";
import { crawl } from "./crawl";
import { crawlDown } from "./crawlDown";
import { floorEntry } from "./floorEntry";

/*
 * The crawl's one primitive over every channel: the way down (`crawlDown`)
 * until the body is down, its hips weighted from the physics window when the
 * hips own it, then the crawl's cycles; entered from the floor, the floor
 * entry's own way down (`floorEntry.down`) into the cycles.
 *
 * Part of `crawl.plan`, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `whole`.
 */
export function crawlWhole(
  prepared: crawlWhole.IPrepared,
): IAutoMovieMotionHumanPrimitive {
  const {
    duration,
    down,
    downAt,
    window,
    crawling,
    body,
    entered,
    clock,
    standing,
  }: crawlWhole.IPrepared = prepared;
  return {
    channels: [
      "root",
      "trunk",
      "head",
      "leftLeg",
      "rightLeg",
      "leftHand",
      "rightHand",
      "leftArm",
      "rightArm",
    ],
    from: 0,
    to: duration,
    write:
      down !== null
        ? (
            posture: IAutoMovieMotionHumanPosture,
            seconds: number,
          ): IAutoMovieMotionHumanPosture =>
            seconds < downAt
              ? down.write(
                  posture,
                  seconds,
                  window?.by === "hips"
                    ? HumanPhysics.weightAt(window, seconds)
                    : 0,
                )
              : crawling(posture, seconds)
        : floorEntry.down(
            body,
            entered,
            crawl.DOWN,
            (seconds: number): number =>
              clock.progress("start", "down", seconds),
            crawling,
            standing,
          ),
  };
}

/*
 * The `whole` of `crawl.plan`, built from what that plan prepared.
 */
export namespace crawlWhole {
  /*
   * What `crawl.plan` prepared for its `whole`.
   */
  export interface IPrepared {
    /*
     * The `duration` `crawl.plan` prepared.
     */
    duration: number;

    /*
     * The `down` `crawl.plan` prepared.
     */
    down: crawlDown.IDown | null;

    /*
     * The `downAt` `crawl.plan` prepared.
     */
    downAt: number;

    /*
     * The `window` `crawl.plan` prepared.
     */
    window: HumanPhysics.Window;

    /*
     * The `crawling` `crawl.plan` prepared.
     */
    crawling: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ) => IAutoMovieMotionHumanPosture;

    /*
     * The `body` `crawl.plan` prepared.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The `entered` `crawl.plan` prepared.
     */
    entered: floorEntry.IStart["entered"];

    /*
     * The `clock` `crawl.plan` prepared.
     */
    clock: IAutoMovieMotionClock;

    /*
     * The standing posture the crawl's base holds, its way down written over
     * it.
     */
    standing: IAutoMovieMotionHumanPosture;
  }
}
