import { minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanGaze,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../posture/internal/prepareHumanPoseResolution";
import { HumanGaze } from "./HumanGaze";

/** A part of the body a gaze recruits on its own timing. */
type GazePart = "eyes" | "head" | "trunk";

/** A target's direction from the eyes, degrees. */
type IStageTowards = { yaw: number; pitch: number };

/**
 * One request showing at an instant: the request, its target's point, its
 * direction from the posture under the layer and its parts' turn durations,
 * seconds.
 */
interface IStage {
  /** The request. */
  request: IAutoMovieMotionHumanGaze.ILayer;

  /** Where its target is at the instant, world metres. */
  point: IAutoMovieVector3;

  /**
   * The target's direction from the eyes on the posture under the layer,
   * degrees.
   */
  towards: IStageTowards;

  /** Each part's onset and return duration, seconds. */
  durations: Record<GazePart, number>;
}

/**
 * A gaze layer (`HumanGaze.layer`): from `from` the eyes, head and trunk turn
 * toward the target on their own timings and track it; from `to` they return. A
 * request that begins while an earlier one still holds the gaze turns the parts
 * on from where that one has them, so the gaze moves from target to target
 * without passing through rest.
 *
 * @param requests The gazes, in time order; each one's `from` after the
 *   previous one's `from`.
 * @param name The layer's name.
 * @returns The layer.
 */
export function HumanGazeLayer(
  requests: readonly IAutoMovieMotionHumanGaze.ILayer[],
  name: string,
): IAutoMovieMotionHumanLayer {
  // The largest eye movement a gaze shift times as a saccade, degrees: twice
  // the eyes' own share, `EYES`, since in large head-free gaze shifts the
  // eye's own saccade saturates near 30 degrees while the head carries the
  // rest (Freedman and Sparks 1997, J Neurophysiol 77:2328; Freedman 2008).
  const most: number = 2 * HumanGaze.EYES;

  // The longest any part takes to turn onto a target or back, seconds: the
  // saccade of `most`, the head's turn over its whole share `HEAD` and the
  // trunk's over `TRUNK`, so a request this long past its start or its return
  // has finished turning.
  const longest: number = Math.max(
    HumanGaze.saccade(most),
    HumanGaze.turn(
      Math.hypot(
        HumanGaze.HEAD.yaw,
        Math.max(HumanGaze.HEAD.down, HumanGaze.HEAD.up),
      ),
    ),
    HumanGaze.turn(HumanGaze.TRUNK),
  );
  return {
    name,

    // The eyes, the neck and the head, and the chest and lumbar spine
    // unless every gaze keeps the trunk out of the turn.
    channels: requests.every(
      (request: IAutoMovieMotionHumanGaze.ILayer): boolean =>
        request.with === "eyes" || request.with === "head",
    )
      ? ["head"]
      : ["head", "trunk"],
    apply: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      context: IAutoMovieMotionHumanLayer.IContext,
    ): IAutoMovieMotionHumanPosture => {
      let low: number = 0;
      let high: number = requests.length;
      while (low < high) {
        const middle: number = (low + high) >>> 1;
        if (requests[middle]!.from <= seconds) low = middle + 1;
        else high = middle;
      }
      const last: number = low - 1;
      if (last < 0) return posture;

      // The requests still showing: the latest, and each earlier one while
      // the one after it may not yet have finished turning onto its own
      // target, so a new gaze starts from where the last one has the eyes,
      // head and trunk instead of from rest. A request whose return is
      // over shows nothing.
      let first: number = last;
      while (first > 0 && seconds - requests[first]!.from < longest) first--;
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(context.resolution);
      const stages: IStage[] = [];
      for (let k: number = first; k <= last; k++) {
        const request: IAutoMovieMotionHumanGaze.ILayer = requests[k]!;
        if (request.to !== undefined && seconds - request.to >= longest)
          continue;
        const point: IAutoMovieVector3 = context.aim(
          request.target,
          seconds,
        ).point;
        const towards: IStageTowards = HumanGaze.direction(
          context.body,
          posture,
          point,
          resolution,
        );
        const amplitude: number = Math.hypot(towards.yaw, towards.pitch);
        const parts: IAutoMovieMotionHumanGaze.ISplit = HumanGaze.split(
          towards.yaw,
          towards.pitch,
          request.with ?? "auto",
        );
        const durations: Record<GazePart, number> = {
          eyes: HumanGaze.saccade(Math.min(amplitude, most)),
          head: HumanGaze.turn(Math.hypot(parts.head.yaw, parts.head.pitch)),
          trunk: HumanGaze.turn(parts.trunk),
        };
        stages.push({ request, point, towards, durations });
      }
      if (stages.length === 0) return posture;

      // Each stage is aimed over the one before, its weights faded by every
      // later stage's onset, so the later gaze takes over part by part on
      // its own timing.
      let out: IAutoMovieMotionHumanPosture = posture;
      stages.forEach((stage: IStage, index: number): void => {
        const weight: (part: GazePart) => number = (part: GazePart): number => {
          let w: number = gazeWeight(
            seconds,
            stage.request,
            stage.durations[part],
          );
          for (const later of stages.slice(index + 1))
            w *=
              1 -
              minimumJerk.share(
                (seconds - later.request.from) / later.durations[part],
              );
          return w;
        };
        out = HumanGaze.aim(
          context.body,
          out,
          stage.point,
          stage.request.with ?? "auto",
          {
            eyes: weight("eyes"),
            head: weight("head"),
            trunk: weight("trunk"),
          },
          resolution,
          index === 0 ? stage.towards : undefined,
        );
      });
      return out;
    },
  };
}

/**
 * A request's weight for one part at a second: its minimum-jerk onset over the
 * part's duration from `from`, less its return over the same duration from
 * `to`.
 */
function gazeWeight(
  seconds: number,
  active: IAutoMovieMotionHumanGaze.ILayer,
  duration: number,
): number {
  const on: number = minimumJerk.share((seconds - active.from) / duration);
  const off: number =
    active.to === undefined
      ? 0
      : minimumJerk.share((seconds - active.to) / duration);
  return on * (1 - off);
}
