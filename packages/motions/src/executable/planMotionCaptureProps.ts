import type { IAutoMoviePose } from "@automovie/interface";

import { planMotionCaptureInstants } from "../capture/planMotionCaptureInstants";
import type { IMotionCaptureCase } from "./IMotionCaptureCase";
import type { IMotionCaptureProps } from "./IMotionCaptureProps";

/**
 * Turn a built motion case into the data its draw page receives: every performer and ghost posed at each of the case's instants, the instants drawn with their labels from `planMotionCaptureInstants`, and the case's overlays as they are.
 *
 * @param capture The built case.
 * @param raster Width and height in pixels of every still.
 * @returns The page's props.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is sampled and what is copied.
 * @evidence contracts/development/implementation.md#principled-implementation A performer is a function of film seconds, so sampling it at exactly the instants the capture draws loses nothing the stills show.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One map per member.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Poses come from the case's own functions; nothing is interpolated or adjusted.
 * @evidence contracts/development/implementation.md#efficient-algorithms Figures times instants pose evaluations.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per case.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns plain data and keeps nothing.
 */
export function planMotionCaptureProps(
  capture: IMotionCaptureCase,
  raster: { width: number; height: number },
): IMotionCaptureProps {
  const seconds: number[] = capture.times.map(
    (time: IMotionCaptureCase.ITime): number => time.seconds,
  );
  const figure: (performer: IMotionCaptureCase.IPerformer) => IMotionCaptureProps.IFigure = (
    performer: IMotionCaptureCase.IPerformer,
  ): IMotionCaptureProps.IFigure => ({
    id: performer.id,
    body: performer.body,
    color: performer.color ?? null,
    poses: seconds.map((at: number): IAutoMoviePose => performer.pose(at)),
  });
  return {
    name: capture.name,
    seconds,
    instants: planMotionCaptureInstants(capture.times),
    raster,
    performers: capture.performers.map(figure),
    ghosts: (capture.ghosts ?? []).map(
      (ghost: IMotionCaptureCase.IGhost): IMotionCaptureProps["ghosts"][number] => ({
        ...figure(ghost),
        opacity: ghost.opacity,
      }),
    ),
    trails: capture.trails ?? [],
    targets: capture.targets ?? [],
    drift: capture.drift ?? [],
    boxes: capture.boxes ?? [],
  };
}
